const RHO = 1000; // kg/m³
const G = 9.81;  // m/s²

/** Hydraulic turbine power [MW]: P = η·ρ·g·H·Q / 1e6 */
export function calcHydro(H: number, Q: number, eta: number): number {
  return (eta * RHO * G * H * Q) / 1e6;
}

/**
 * Detailed hydro power with parabolic efficiency curve.
 * η(Q/Q_n) = η_max · (1 - k · (Q/Q_n - 1)²)
 * k = 0.3 for Francis (typical)
 */
export function calcHydroDetailed(
  H: number,
  Q: number,
  Qn: number,
  etaMax: number,
  k: number = 0.3,
): { etaAct: number; pMW: number } {
  const ratio = Q / Qn;
  const etaAct = etaMax * (1 - k * (ratio - 1) ** 2);
  const pMW = (etaAct * RHO * G * H * Q) / 1e6;
  return { etaAct, pMW };
}

/**
 * Wind energy annual production with capacity factor.
 * Uses cubic P(v) curve; CF = E_year / (Pn * n * 8760).
 */
export function calcWindDetailed(
  vMean: number,
  Pn: number,
  n: number = 1,
  vci: number = 3,
  vr: number = 12,
  vco: number = 25,
): { pMW: number; eYearMWh: number; cf: number } {
  // Rayleigh scale parameter: c = v_mean / 0.886
  const c = vMean / 0.886;
  let eSum = 0;
  for (let v = 0; v <= 30; v += 0.5) {
    const p = calcWind(v, vci, vr, vco, Pn, n);
    // Rayleigh PDF
    const fv = (Math.PI / 2) * (v / c ** 2) * Math.exp(-Math.PI * (v / (2 * c)) ** 2);
    eSum += p * fv * 0.5; // 0.5 = step width [h-equivalent per year fraction]
  }
  const eYearMWh = eSum * 8760;
  const cf = eYearMWh / (Pn * n * 8760);
  return { pMW: calcWind(vMean, vci, vr, vco, Pn, n), eYearMWh, cf };
}

/** Monthly solar production factors for Norway */
export const SOLAR_MONTHLY_FACTORS = [
  0.05, 0.12, 0.30, 0.60, 0.85, 1.00,
  0.95, 0.80, 0.50, 0.25, 0.08, 0.03,
];

const CF_SOL_NORWAY = 0.11;

/**
 * Annual solar energy [MWh/yr] for Norway using typical CF = 0.11.
 * Returns monthly breakdown as well.
 */
export function calcSolarAnnual(
  pPeakMW: number,
): { eYearMWh: number; cf: number; monthly: number[] } {
  const eYearMWh = pPeakMW * CF_SOL_NORWAY * 8760;
  const factorSum = SOLAR_MONTHLY_FACTORS.reduce((s, f) => s + f, 0);
  // Distribute annual energy proportionally per month so sum(monthly) = eYearMWh
  const monthly = SOLAR_MONTHLY_FACTORS.map((f) => eYearMWh * (f / factorSum));
  return { eYearMWh, cf: CF_SOL_NORWAY, monthly };
}

/**
 * Wind turbine power [MW] for n turbines.
 * Cubic interpolation between cut-in and rated speed.
 */
export function calcWind(
  v: number,
  vci: number,
  vr: number,
  vco: number,
  Pn: number,
  n: number = 1,
): number {
  if (v < vci || v > vco) return 0;
  if (v >= vr) return Pn * n;
  const ratio = (v - vci) / (vr - vci);
  return Pn * ratio ** 3 * n;
}

/**
 * Solar power [MW] using sinusoidal day profile.
 * Returns P_peak · 0.5 as static average when t is outside daylight hours.
 */
export function calcSolar(
  Ppeak: number,
  t: number,
  trise: number = 6.0,
  tset: number = 20.0,
): number {
  if (t < trise || t > tset) return 0;
  return Ppeak * Math.sin((Math.PI * (t - trise)) / (tset - trise));
}

/** Nuclear / thermal baseline power [MW]: always P_n */
export function calcNuclear(Pn: number): number {
  return Pn;
}
