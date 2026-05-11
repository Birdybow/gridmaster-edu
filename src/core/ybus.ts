import type { Bus, Line, Transformer, PerUnitSystem, GmxId } from '../types/index.js';
import type { Complex } from '../types/index.js';
import { cadd } from './math.js';

/** Admittance matrix result with bus-index mapping */
export interface YBusResult {
  /** n×n complex admittance matrix in per-unit */
  Y: Complex[][];
  /** Bus ID → row/column index in Y */
  busIndex: Map<GmxId, number>;
}

/**
 * Build the Y-bus (nodal admittance) matrix in per-unit from network topology.
 *
 * Pi-model for lines: series admittance y_s = 1/(R+jX) and shunt y_sh = j·B/2 at each end.
 * Transformer: series admittance only, impedance referred to HV base and scaled to system base.
 */
export function buildYBus(
  buses: Bus[],
  lines: Line[],
  transformers: Transformer[],
  system: PerUnitSystem
): YBusResult {
  const n = buses.length;
  const busIndex = new Map<GmxId, number>(buses.map((b, i) => [b.id, i]));

  // Initialise n×n zero matrix
  const Y: Complex[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => [0, 0] as Complex)
  );

  const { sBaseMVA } = system;

  for (const line of lines) {
    const i = busIndex.get(line.fromBusId);
    const j = busIndex.get(line.toBusId);
    if (i === undefined || j === undefined) continue;

    const fromBus = buses[i];
    const zBase = (fromBus.voltageKV ** 2) / sBaseMVA; // Ω

    const rTotal = line.rOhmPerKm * line.lengthKm;
    const xTotal = line.xOhmPerKm * line.lengthKm;
    const bTotal = (line.bMuSPerKm * line.lengthKm) * 1e-6; // S

    const rPU = rTotal / zBase;
    const xPU = xTotal / zBase;
    const bPU = bTotal * zBase; // B_pu = B_physical × Z_base = B_physical / Y_base

    // Avoid divide-by-zero for zero-impedance lines
    const zMagSq = rPU * rPU + xPU * xPU;
    if (zMagSq === 0) continue;

    const ySeries: Complex = [rPU / zMagSq, -xPU / zMagSq];
    const yShunt: Complex = [0, bPU / 2];

    // Diagonal: Y[i][i] += y_series + y_shunt
    Y[i][i] = cadd(cadd(Y[i][i], ySeries), yShunt);
    Y[j][j] = cadd(cadd(Y[j][j], ySeries), yShunt);

    // Off-diagonal: Y[i][j] -= y_series (symmetric)
    Y[i][j] = [Y[i][j][0] - ySeries[0], Y[i][j][1] - ySeries[1]];
    Y[j][i] = [Y[j][i][0] - ySeries[0], Y[j][i][1] - ySeries[1]];
  }

  for (const trafo of transformers) {
    const i = busIndex.get(trafo.fromBusId);
    const j = busIndex.get(trafo.toBusId);
    if (i === undefined || j === undefined) continue;

    // Transformer short-circuit impedance on its own MVA base, then scale to system base
    const rk = trafo.loadLossKW / (trafo.ratedMVA * 1000); // p.u. on trafo base
    const zk = trafo.ekPercent / 100;                        // p.u. on trafo base
    const xk = Math.sqrt(Math.max(0, zk * zk - rk * rk));

    // Scale to system base: Z_sys_pu = Z_own_pu × (S_base_sys / S_base_own)
    const baseFactor = sBaseMVA / trafo.ratedMVA;
    const rPU = rk * baseFactor;
    const xPU = xk * baseFactor;

    const zMagSq = rPU * rPU + xPU * xPU;
    if (zMagSq === 0) continue;

    const yTrafo: Complex = [rPU / zMagSq, -xPU / zMagSq];

    Y[i][i] = cadd(Y[i][i], yTrafo);
    Y[j][j] = cadd(Y[j][j], yTrafo);
    Y[i][j] = [Y[i][j][0] - yTrafo[0], Y[i][j][1] - yTrafo[1]];
    Y[j][i] = [Y[j][i][0] - yTrafo[0], Y[j][i][1] - yTrafo[1]];
  }

  return { Y, busIndex };
}
