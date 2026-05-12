import type { GmxProject } from '../types/index.js';

// IEC 60909 voltage factors (Table 1)
const C_MAX = 1.10;
const C_MIN = 1.00;

// ---------------------------------------------------------------------------
// Internal complex arithmetic  [re, im]
// ---------------------------------------------------------------------------
type Cx = [number, number];
const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const csub = (a: Cx, b: Cx): Cx => [a[0] - b[0], a[1] - b[1]];
const cmul = (a: Cx, b: Cx): Cx => [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]];
const cdiv = (a: Cx, b: Cx): Cx => {
  const d = b[0]**2 + b[1]**2;
  return [(a[0]*b[0] + a[1]*b[1])/d, (a[1]*b[0] - a[0]*b[1])/d];
};
const cabs = (a: Cx): number => Math.sqrt(a[0]**2 + a[1]**2);

/** Gauss-Jordan inversion on complex n×n matrix. Returns null if singular. */
function invertCx(A: Cx[][]): Cx[][] | null {
  const n = A.length;
  const aug: Cx[][] = A.map((row, i) => [
    ...row.map((c): Cx => [c[0], c[1]]),
    ...Array.from({ length: n }, (_, j): Cx => [i === j ? 1 : 0, 0]),
  ]);
  for (let col = 0; col < n; col++) {
    let bestRow = col, bestMag = cabs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      const m = cabs(aug[r][col]);
      if (m > bestMag) { bestMag = m; bestRow = r; }
    }
    if (bestMag < 1e-18) return null;
    [aug[col], aug[bestRow]] = [aug[bestRow], aug[col]];
    const piv = aug[col][col];
    for (let j = col; j < 2 * n; j++) aug[col][j] = cdiv(aug[col][j], piv);
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = aug[r][col];
      for (let j = col; j < 2 * n; j++)
        aug[r][j] = csub(aug[r][j], cmul(f, aug[col][j]));
    }
  }
  return aug.map(row => row.slice(n));
}

/**
 * Build p.u. admittance matrix (Y-bus) for short-circuit analysis.
 * Generator subtransient shunts are added at their bus for each id in `genSubset`.
 */
function buildYsc(project: GmxProject, genSubset: string[]): { Y: Cx[][]; busIndex: Map<string, number> } {
  const { buses, lines, transformers, generators, system } = project;
  const n = buses.length;
  const sBase = system.sBaseMVA;
  const busIndex = new Map(buses.map((b, i) => [b.id, i]));
  const Y: Cx[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, (): Cx => [0, 0])
  );

  for (const line of lines) {
    const i = busIndex.get(line.fromBusId), j = busIndex.get(line.toBusId);
    if (i === undefined || j === undefined) continue;
    const zBase = (buses[i].voltageKV ** 2) / sBase;
    const rpu = (line.rOhmPerKm * line.lengthKm) / zBase;
    const xpu = (line.xOhmPerKm * line.lengthKm) / zBase;
    const d = rpu ** 2 + xpu ** 2;
    if (d < 1e-20) continue;
    const ys: Cx = [rpu / d, -xpu / d];
    Y[i][i] = cadd(Y[i][i], ys); Y[j][j] = cadd(Y[j][j], ys);
    Y[i][j] = csub(Y[i][j], ys); Y[j][i] = csub(Y[j][i], ys);
  }

  for (const tr of transformers) {
    const i = busIndex.get(tr.fromBusId), j = busIndex.get(tr.toBusId);
    if (i === undefined || j === undefined) continue;
    const rk = tr.loadLossKW / (tr.ratedMVA * 1000);
    const zk = tr.ekPercent / 100;
    const xk = Math.sqrt(Math.max(0, zk * zk - rk * rk));
    const bf = sBase / tr.ratedMVA;
    const rpu = rk * bf, xpu = xk * bf;
    const d = rpu ** 2 + xpu ** 2;
    if (d < 1e-20) continue;
    const ys: Cx = [rpu / d, -xpu / d];
    Y[i][i] = cadd(Y[i][i], ys); Y[j][j] = cadd(Y[j][j], ys);
    Y[i][j] = csub(Y[i][j], ys); Y[j][i] = csub(Y[j][i], ys);
  }

  for (const gen of generators) {
    if (!genSubset.includes(gen.id)) continue;
    const i = busIndex.get(gen.busId);
    if (i === undefined) continue;
    // Z_gen_pu = j * x''d * (SBase / Sn); Y_gen = [0, -1/xd_pu]
    const xdPu = gen.xdSubtransientPU * (sBase / gen.ratedMVA);
    Y[i][i] = cadd(Y[i][i], [0, -1 / xdPu]);
  }

  return { Y, busIndex };
}

/**
 * Compute Thevenin equivalent impedance at faultBusId.
 * Returns complex impedance in physical Ohms (at fault bus voltage base), or null.
 */
export function calcZThevenin(
  project: GmxProject,
  faultBusId: string,
  genSubset?: string[],
): { re: number; im: number } | null {
  const subset = genSubset ?? project.generators.map((g) => g.id);
  const { Y, busIndex } = buildYsc(project, subset);
  const Z = invertCx(Y);
  if (!Z) return null;
  const k = busIndex.get(faultBusId);
  if (k === undefined) return null;
  const faultBus = project.buses.find((b) => b.id === faultBusId);
  if (!faultBus) return null;
  const zBase = (faultBus.voltageKV ** 2) / project.system.sBaseMVA;
  return { re: Z[k][k][0] * zBase, im: Z[k][k][1] * zBase };
}

// ---------------------------------------------------------------------------
// S5-01  Trepolt maksimal kortslutningsstrøm  (IEC 60909 §4.3.1)
// ---------------------------------------------------------------------------
/**
 * @param zkOhm  |Z_k| Thevenin impedance magnitude [Ω]
 * @param unV    Nominal line-to-line voltage [V]
 * @param c      Voltage factor (1.10 max, 1.00 min)
 * @returns I''k3p [kA]
 */
export function calcIk3p(zkOhm: number, unV: number, c = C_MAX): number {
  return (c * unV) / (Math.sqrt(3) * zkOhm) / 1000;
}

// ---------------------------------------------------------------------------
// S5-02  Topolt kortslutningsstrøm  (IEC 60909 §4.3.2)
// ---------------------------------------------------------------------------
/** @returns I''k2p = (√3/2) · I''k3p  [kA] */
export function calcIk2p(ik3pKA: number): number {
  return (Math.sqrt(3) / 2) * ik3pKA;
}

// ---------------------------------------------------------------------------
// S5-03  Støtstrøm ip  (IEC 60909 §4.3.1.2)
// ---------------------------------------------------------------------------
/**
 * @param ik3pKA   Subtransient three-phase fault current [kA]
 * @param rOverX   R/X ratio of Thevenin impedance
 * @returns ip peak impact current [kA]
 */
export function calcImpact(ik3pKA: number, rOverX: number): number {
  const kappa = 1.02 + 0.98 * Math.exp(-3 * rOverX);
  return kappa * Math.sqrt(2) * ik3pKA;
}

// ---------------------------------------------------------------------------
// S5-04  Minimal kortslutningsstrøm  (IEC 60909, vernfølsomhet)
// ---------------------------------------------------------------------------
/**
 * @param zkOhm      |Z_k| at maximum impedance (warm conductor) [Ω]
 * @param unV        Nominal line-to-line voltage [V]
 * @param tempFactor Thermal correction: PEX=1.28, PVC=1.20, overhead=1.0
 * @returns I''k3p_min [kA]
 */
export function calcIk3pMin(zkOhm: number, unV: number, tempFactor = 1.0): number {
  return calcIk3p(zkOhm * tempFactor, unV, C_MIN);
}

// ---------------------------------------------------------------------------
// Generator contribution breakdown
// ---------------------------------------------------------------------------
/**
 * Compute each generator's individual contribution to fault current at faultBusId.
 * Uses superposition: one generator at a time, all others open-circuited.
 */
export function calcContributions(
  project: GmxProject,
  faultBusId: string,
): Array<{ sourceId: string; ik3pKA: number }> {
  return project.generators.flatMap((gen) => {
    const zTh = calcZThevenin(project, faultBusId, [gen.id]);
    if (!zTh) return [];
    const faultBus = project.buses.find((b) => b.id === faultBusId);
    if (!faultBus) return [];
    const zkMag = Math.sqrt(zTh.re ** 2 + zTh.im ** 2);
    if (zkMag < 1e-9) return [];
    const unV = faultBus.voltageKV * 1000;
    return [{ sourceId: gen.id, ik3pKA: calcIk3p(zkMag, unV) }];
  });
}
