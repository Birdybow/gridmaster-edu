/**
 * Ring network current distribution — IEC analytical solution.
 * Covers symmetric and asymmetric 3-bus rings (A–C–B with supply at A and B).
 */

export interface RingSymmetricResult {
  IA: number;       // Current from A [A]
  IB: number;       // Current from B [A]
  tapAC: number;    // Active losses in branch A→C [kW]
  tapCB: number;    // Active losses in branch C→B [kW]
  totalTap: number; // Total losses [kW]
  radialTap: number;// Losses if fed radially from A alone [kW]
  tapReductionPercent: number;
}

export interface RingAsymmetricResult {
  IA: number;
  IB: number;
  tapAC: number;
  tapCB: number;
  totalTap: number;
  radialTap: number;
  tapReductionPercent: number;
}

/**
 * S6-01 — Symmetric ring: equal impedance per unit length, VA = VB.
 *
 * @param iLoadA   Load current magnitude [A]
 * @param zacOhm   Impedance magnitude |Z_AC| [Ω]
 * @param zcbOhm   Impedance magnitude |Z_CB| [Ω]
 * @param rAcOhm   Resistance R_AC [Ω] (for loss calc)
 * @param rCbOhm   Resistance R_CB [Ω]
 */
export function calcRingSymmetric(
  iLoadA: number,
  zacOhm: number,
  zcbOhm: number,
  rAcOhm: number,
  rCbOhm: number,
): RingSymmetricResult {
  const zTotal = zacOhm + zcbOhm;
  const IA = iLoadA * (zcbOhm / zTotal);
  const IB = iLoadA * (zacOhm / zTotal);

  const tapAC = (IA ** 2 * rAcOhm) / 1000;  // kW
  const tapCB = (IB ** 2 * rCbOhm) / 1000;
  const totalTap = tapAC + tapCB;

  // Radial reference: all current flows through both branches in series
  const radialTap = (iLoadA ** 2 * (rAcOhm + rCbOhm)) / 1000;
  const tapReductionPercent = radialTap > 0
    ? ((radialTap - totalTap) / radialTap) * 100
    : 0;

  return { IA, IB, tapAC, tapCB, totalTap, radialTap, tapReductionPercent };
}

/**
 * S6-02 — Asymmetric ring: different impedances, possibly different supply voltages.
 * Kirchhoff's voltage law around the loop:
 *   VA - IA·ZAC - (IA - Iload)·ZCB - VB = 0
 *   (VA - VB) + Iload·ZCB = IA·(ZAC + ZCB)
 *
 * @param iLoadA   Load current [A] at node C
 * @param zacOhm   |Z_AC| [Ω]
 * @param zcbOhm   |Z_CB| [Ω]
 * @param rAcOhm   R_AC [Ω]
 * @param rCbOhm   R_CB [Ω]
 * @param vaDeltaV Voltage difference (VA - VB) [V], default 0
 */
export function calcRingAsymmetric(
  iLoadA: number,
  zacOhm: number,
  zcbOhm: number,
  rAcOhm: number,
  rCbOhm: number,
  vaDeltaV = 0,
): RingAsymmetricResult {
  const zTotal = zacOhm + zcbOhm;
  // IA·zTotal = Iload·zcb + vaDeltaV/|Z| — simplified: voltage contribution term
  const IA = (iLoadA * zcbOhm + vaDeltaV) / zTotal;
  const IB = iLoadA - IA;

  const tapAC = (IA ** 2 * rAcOhm) / 1000;
  const tapCB = (IB ** 2 * rCbOhm) / 1000;
  const totalTap = tapAC + tapCB;

  const radialTap = (iLoadA ** 2 * (rAcOhm + rCbOhm)) / 1000;
  const tapReductionPercent = radialTap > 0
    ? ((radialTap - totalTap) / radialTap) * 100
    : 0;

  return { IA, IB, tapAC, tapCB, totalTap, radialTap, tapReductionPercent };
}
