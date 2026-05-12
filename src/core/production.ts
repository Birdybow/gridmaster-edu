const RHO = 1000; // kg/m³
const G = 9.81;  // m/s²

/** Hydraulic turbine power [MW]: P = η·ρ·g·H·Q / 1e6 */
export function calcHydro(H: number, Q: number, eta: number): number {
  return (eta * RHO * G * H * Q) / 1e6;
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
