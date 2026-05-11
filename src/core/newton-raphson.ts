import type {
  GmxProject,
  Bus,
  PowerFlowResult,
  BusResult,
  LineResult,
  IterationStep,
  GmxId,
} from '../types/index.js';
import { buildYBus } from './ybus.js';

/** Solve a dense linear system Ax = b via Gaussian elimination with partial pivoting. */
function gaussSolve(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-14) {
      throw new Error('gaussSolve: singular or near-singular matrix');
    }

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let k = col; k <= n; k++) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j];
    x[i] /= aug[i][i];
  }
  return x;
}

/**
 * Run a full Newton-Raphson AC power flow on a GmxProject.
 *
 * Algorithm:
 * 1. Build Y-bus from topology.
 * 2. Initialise: V = v_set p.u., δ = 0 for all non-slack buses.
 * 3. Compute P/Q injections; form mismatch ΔP, ΔQ.
 * 4. Build 4-submatrix Jacobian (H, N, J_sub, L).
 * 5. Solve for corrections Δδ and ΔV/V via Gaussian elimination.
 * 6. Update state; check max(|ΔP|, |ΔQ|) < tolerance.
 * 7. Compute line results (current, losses) after convergence.
 */
export function runNewtonRaphson(project: GmxProject): PowerFlowResult {
  const { buses, lines, transformers, system } = project;
  const { sBaseMVA } = system;
  const tolerance = 1e-6;
  const maxIter = 50;

  const { Y, busIndex } = buildYBus(buses, lines, transformers, system);
  const n = buses.length;

  // State vectors
  const vMag = buses.map((b) => b.vSetPU);
  const vAng = new Array<number>(n).fill(0);

  // Scheduled net injections per bus (generation minus load), in per-unit
  const pSch = buses.map((b) =>
    ((b.genMW ?? 0) - b.loadMW) / sBaseMVA
  );
  const qSch = buses.map((b) =>
    ((0) - b.loadMVAr) / sBaseMVA
  );

  // Bus classifications
  const isSlack = (b: Bus) => b.type === 'slack';
  const isPQ = (b: Bus) => b.type === 'PQ';
  const isPV = (b: Bus) => b.type === 'PV';

  // Indices for non-slack (delta unknowns) and PQ (V unknowns)
  const nonSlackIdx = buses.map((_, i) => i).filter((i) => !isSlack(buses[i]));
  const pqIdx = buses.map((_, i) => i).filter((i) => isPQ(buses[i]));

  const iterLog: IterationStep[] = [];
  let converged = false;
  let iter = 0;

  for (iter = 0; iter < maxIter; iter++) {
    // Compute power injections P_calc, Q_calc
    const pCalc = new Array<number>(n).fill(0);
    const qCalc = new Array<number>(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const g = Y[i][j][0];
        const b = Y[i][j][1];
        const dij = vAng[i] - vAng[j];
        pCalc[i] += vMag[i] * vMag[j] * (g * Math.cos(dij) + b * Math.sin(dij));
        qCalc[i] += vMag[i] * vMag[j] * (g * Math.sin(dij) - b * Math.cos(dij));
      }
    }

    // Mismatches for non-slack (ΔP) and PQ (ΔQ) buses
    const dP = nonSlackIdx.map((i) => pSch[i] - pCalc[i]);
    const dQ = pqIdx.map((i) => qSch[i] - qCalc[i]);

    const maxDP = Math.max(...dP.map(Math.abs));
    const maxDQ = dQ.length > 0 ? Math.max(...dQ.map(Math.abs)) : 0;

    // Record busDeltas (will fill after solve; use zeros for this entry)
    const stepEntry: IterationStep = {
      iteration: iter + 1,
      maxMismatchP: maxDP,
      maxMismatchQ: maxDQ,
      busDeltas: {},
    };
    iterLog.push(stepEntry);

    if (Math.max(maxDP, maxDQ) < tolerance) {
      converged = true;
      break;
    }

    // Build Jacobian H, N, J_sub, L
    // H[a][b] = ∂P_nonSlack[a] / ∂δ_nonSlack[b]
    // N[a][b] = ∂P_nonSlack[a] / ∂|V|_PQ[b]  × |V|_PQ[b]
    // J_sub[a][b] = ∂Q_PQ[a] / ∂δ_nonSlack[b]
    // L[a][b] = ∂Q_PQ[a] / ∂|V|_PQ[b]  × |V|_PQ[b]

    const nNS = nonSlackIdx.length; // delta unknowns
    const nPQ = pqIdx.length;       // V unknowns
    const dim = nNS + nPQ;

    const Jac: number[][] = Array.from({ length: dim }, () => new Array<number>(dim).fill(0));
    const rhs = [...dP, ...dQ];

    // H block (top-left): rows = nonSlack buses, cols = nonSlack buses
    for (let a = 0; a < nNS; a++) {
      const i = nonSlackIdx[a];
      for (let b2 = 0; b2 < nNS; b2++) {
        const j = nonSlackIdx[b2];
        if (i === j) {
          // H_ii = -Q_i - B_ii * V_i²
          Jac[a][b2] = -qCalc[i] - Y[i][i][1] * vMag[i] * vMag[i];
        } else {
          // H_ij = V_i * V_j * (G_ij * sin(δ_i - δ_j) - B_ij * cos(δ_i - δ_j))
          const dij = vAng[i] - vAng[j];
          Jac[a][b2] =
            vMag[i] * vMag[j] * (Y[i][j][0] * Math.sin(dij) - Y[i][j][1] * Math.cos(dij));
        }
      }
    }

    // N block (top-right): rows = nonSlack, cols = PQ buses
    for (let a = 0; a < nNS; a++) {
      const i = nonSlackIdx[a];
      for (let b2 = 0; b2 < nPQ; b2++) {
        const j = pqIdx[b2];
        if (i === j) {
          // N_ii = P_i + G_ii * V_i²
          Jac[a][nNS + b2] = pCalc[i] + Y[i][i][0] * vMag[i] * vMag[i];
        } else {
          // N_ij = V_i * V_j * (G_ij * cos(δ_i - δ_j) + B_ij * sin(δ_i - δ_j))
          const dij = vAng[i] - vAng[j];
          Jac[a][nNS + b2] =
            vMag[i] * vMag[j] * (Y[i][j][0] * Math.cos(dij) + Y[i][j][1] * Math.sin(dij));
        }
      }
    }

    // J_sub block (bottom-left): rows = PQ, cols = nonSlack buses
    for (let a = 0; a < nPQ; a++) {
      const i = pqIdx[a];
      for (let b2 = 0; b2 < nNS; b2++) {
        const j = nonSlackIdx[b2];
        if (i === j) {
          // J_ii = P_i - G_ii * V_i²
          Jac[nNS + a][b2] = pCalc[i] - Y[i][i][0] * vMag[i] * vMag[i];
        } else {
          // J_ij = -V_i * V_j * (G_ij * cos(δ_i - δ_j) + B_ij * sin(δ_i - δ_j))
          const dij = vAng[i] - vAng[j];
          Jac[nNS + a][b2] =
            -vMag[i] * vMag[j] * (Y[i][j][0] * Math.cos(dij) + Y[i][j][1] * Math.sin(dij));
        }
      }
    }

    // L block (bottom-right): rows = PQ, cols = PQ buses
    for (let a = 0; a < nPQ; a++) {
      const i = pqIdx[a];
      for (let b2 = 0; b2 < nPQ; b2++) {
        const j = pqIdx[b2];
        if (i === j) {
          // L_ii = Q_i - B_ii * V_i²
          Jac[nNS + a][nNS + b2] = qCalc[i] - Y[i][i][1] * vMag[i] * vMag[i];
        } else {
          // L_ij = V_i * V_j * (G_ij * sin(δ_i - δ_j) - B_ij * cos(δ_i - δ_j))
          const dij = vAng[i] - vAng[j];
          Jac[nNS + a][nNS + b2] =
            vMag[i] * vMag[j] * (Y[i][j][0] * Math.sin(dij) - Y[i][j][1] * Math.cos(dij));
        }
      }
    }

    // Solve: [Δδ; ΔV/V] = J⁻¹ × [ΔP; ΔQ]
    const correction = gaussSolve(Jac, rhs);

    const busDeltas: Record<GmxId, { dV: number; dDelta: number }> = {};

    // Apply corrections
    for (let a = 0; a < nNS; a++) {
      const i = nonSlackIdx[a];
      const dd = correction[a];
      vAng[i] += dd;
      busDeltas[buses[i].id] = { dV: 0, dDelta: dd };
    }
    for (let a = 0; a < nPQ; a++) {
      const i = pqIdx[a];
      const dv = correction[nNS + a]; // ΔV/V
      vMag[i] *= (1 + dv);
      if (busDeltas[buses[i].id]) {
        busDeltas[buses[i].id].dV = dv;
      } else {
        busDeltas[buses[i].id] = { dV: dv, dDelta: 0 };
      }
    }

    // Keep PV bus voltages at setpoint (V fixed, only δ updated)
    for (let i = 0; i < n; i++) {
      if (isPV(buses[i])) vMag[i] = buses[i].vSetPU;
    }

    iterLog[iterLog.length - 1].busDeltas = busDeltas;
  }

  // ── Post-convergence: compute bus and line results ────────────────────────

  const busResults: BusResult[] = buses.map((b, i) => ({
    busId: b.id,
    vMagPU: vMag[i],
    vAngDeg: (vAng[i] * 180) / Math.PI,
    vMagKV: vMag[i] * b.voltageKV,
    pMW: 0, // filled below for slack
    qMVAr: 0,
    withinLimits: vMag[i] >= b.vMinPU && vMag[i] <= b.vMaxPU,
  }));

  // Compute P and Q injection for each bus (including slack generation)
  for (let i = 0; i < n; i++) {
    let p = 0;
    let q = 0;
    for (let j = 0; j < n; j++) {
      const g = Y[i][j][0];
      const b = Y[i][j][1];
      const dij = vAng[i] - vAng[j];
      p += vMag[i] * vMag[j] * (g * Math.cos(dij) + b * Math.sin(dij));
      q += vMag[i] * vMag[j] * (g * Math.sin(dij) - b * Math.cos(dij));
    }
    busResults[i].pMW = p * sBaseMVA;
    busResults[i].qMVAr = q * sBaseMVA;
  }

  // Line results
  const lineResults: LineResult[] = lines.map((line) => {
    const i = busIndex.get(line.fromBusId);
    const j = busIndex.get(line.toBusId);
    if (i === undefined || j === undefined) {
      return makeZeroLineResult(line.id, line.fromBusId, line.toBusId);
    }

    const fromBus = buses[i];
    const zBase = (fromBus.voltageKV ** 2) / sBaseMVA;
    const rTotal = line.rOhmPerKm * line.lengthKm;
    const xTotal = line.xOhmPerKm * line.lengthKm;
    const bTotal = line.bMuSPerKm * line.lengthKm * 1e-6;
    const rPU = rTotal / zBase;
    const xPU = xTotal / zBase;
    const bPU = bTotal * zBase;
    const zMagSq = rPU * rPU + xPU * xPU;

    if (zMagSq === 0) return makeZeroLineResult(line.id, line.fromBusId, line.toBusId);

    // Series admittance and shunt
    const gS = rPU / zMagSq;
    const bS = -xPU / zMagSq;
    const bSh = bPU / 2;

    // Complex voltages
    const viR = vMag[i] * Math.cos(vAng[i]);
    const viI = vMag[i] * Math.sin(vAng[i]);
    const vjR = vMag[j] * Math.cos(vAng[j]);
    const vjI = vMag[j] * Math.sin(vAng[j]);

    // Line current i→j: I_ij = y_series*(V_i - V_j) + j*bSh*V_i
    const dvR = viR - vjR;
    const dvI = viI - vjI;
    const iijR = gS * dvR - bS * dvI + (-bSh) * viI;
    const iijI = gS * dvI + bS * dvR + bSh * viR;

    // Line current j→i
    const ijiR = -(gS * dvR - bS * dvI) + (-bSh) * vjI;
    const ijiI = -(gS * dvI + bS * dvR) + bSh * vjR;

    // Complex power from i and from j
    const sFromR = viR * iijR + viI * iijI; // Re(V_i × I_ij*)
    const sFromI = viI * iijR - viR * iijI; // Im(V_i × I_ij*)
    const sToR = vjR * ijiR + vjI * ijiI;
    const sToI = vjI * ijiR - vjR * ijiI;

    const pFromMW = sFromR * sBaseMVA;
    const qFromMVAr = sFromI * sBaseMVA;
    const pToMW = sToR * sBaseMVA;
    const qToMVAr = sToI * sBaseMVA;

    const lossesActiveMW = pFromMW + pToMW;
    const lossesReactiveMVAr = qFromMVAr + qToMVAr;

    // Line current magnitude in kA
    const iMagPU = Math.sqrt(iijR * iijR + iijI * iijI);
    const iBase = (sBaseMVA * 1e6) / (Math.sqrt(3) * fromBus.voltageKV * 1000); // A
    const currentKA = (iMagPU * iBase) / 1000;

    const loadingPercent = line.ratingMVA > 0
      ? (Math.sqrt(sFromR ** 2 + sFromI ** 2) * sBaseMVA / line.ratingMVA) * 100
      : 0;

    return {
      lineId: line.id,
      fromBusId: line.fromBusId,
      toBusId: line.toBusId,
      pFromMW,
      qFromMVAr,
      pToMW,
      qToMVAr,
      currentKA,
      lossesActiveMW,
      lossesReactiveMVAr,
      loadingPercent,
      overloaded: loadingPercent > 100,
    };
  });

  const totalLossesMW = lineResults.reduce((s, l) => s + l.lossesActiveMW, 0);
  const totalLossesMVAr = lineResults.reduce((s, l) => s + l.lossesReactiveMVAr, 0);
  const maxMismatch = iterLog.length > 0
    ? Math.max(iterLog[iterLog.length - 1].maxMismatchP, iterLog[iterLog.length - 1].maxMismatchQ)
    : 0;

  return {
    timestamp: new Date().toISOString(),
    converged,
    iterations: iter + (converged ? 0 : 0),
    maxMismatchPU: maxMismatch,
    totalLossesMW,
    totalLossesMVAr,
    buses: busResults,
    lines: lineResults,
    iterationLog: iterLog,
  };
}

function makeZeroLineResult(lineId: string, from: GmxId, to: GmxId): LineResult {
  return {
    lineId, fromBusId: from, toBusId: to,
    pFromMW: 0, qFromMVAr: 0, pToMW: 0, qToMVAr: 0,
    currentKA: 0, lossesActiveMW: 0, lossesReactiveMVAr: 0,
    loadingPercent: 0, overloaded: false,
  };
}
