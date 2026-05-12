/**
 * Earth fault calculations for IT, TN and Petersen-coil networks.
 * IEC 60364 / NVE guidelines.
 */

/**
 * IT-network single-phase earth fault current (capacitive).
 * I_jord = U_f · ω · C0 · L  (practical simplified form, per NVE)
 * where U_f = Un/√3 (phase-to-earth voltage)
 *
 * @param Un   Nominal line voltage [V]
 * @param C0   Capacitance per km per phase [F/km]
 * @param L    Total cable length [km]
 * @param f    Frequency [Hz], default 50
 */
export function calcEarthFaultIT(Un: number, C0: number, L: number, f = 50): number {
  const Uf = Un / Math.sqrt(3);
  const omega = 2 * Math.PI * f;
  return Uf * omega * C0 * L;
}

/**
 * TN-network single-phase earth fault current (low-impedance earthed neutral).
 * I_jord = U_f / (Z_fase + Z_jord)
 *
 * @param Uf     Phase-to-earth voltage [V]
 * @param Zfase  Phase conductor impedance [Ω]
 * @param Zjord  Earth/neutral return impedance [Ω]
 */
export function calcEarthFaultTN(Uf: number, Zfase: number, Zjord: number): number {
  return Uf / (Zfase + Zjord);
}

/**
 * Petersen coil (resonance-earthed) optimal inductance and residual current.
 *
 * Resonance condition: ω·L_P = 1/(3·ω·C_total)
 * => L_P = 1 / (3 · ω² · C0 · L)   [H]
 *
 * I_rest = I_jord · (1 - k)
 *
 * @param Un           Nominal line voltage [V]
 * @param C0           Capacitance per km per phase [F/km]
 * @param L            Total cable length [km]
 * @param f            Frequency [Hz], default 50
 * @param k            Compensation degree [0–1], default 1.0 (full)
 */
export function calcPetersen(
  Un: number,
  C0: number,
  L: number,
  f = 50,
  k = 1.0,
): { L_P: number; I_rest: number; I_jord: number } {
  const omega = 2 * Math.PI * f;
  const L_P = 1 / (3 * omega ** 2 * C0 * L);
  const I_jord = calcEarthFaultIT(Un, C0, L, f);
  const I_rest = I_jord * (1 - k);
  return { L_P, I_rest, I_jord };
}
