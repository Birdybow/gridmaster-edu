import type { VoltageDropResult } from '../types/index.js';

const REN_LIMIT_YELLOW = 10; // %
const REN_LABEL = 'REN 4100 — spenningskvalitet i lavspentanlegg';
const REN_WARNING = 'Spenningsfallet overskrider grensen. Se REN 4100 — spenningskvalitet.';

function stamp(lineId: string, model: 'simple' | 'pi', deltaU: number, Un: number, uReceivingKV: number): VoltageDropResult {
  const deltaUPercent = (deltaU / Un) * 100;
  const withinLimits = deltaUPercent < REN_LIMIT_YELLOW;
  return {
    timestamp: new Date().toISOString(),
    lineId,
    model,
    deltaUVolts: deltaU,
    deltaUPercent,
    deltaUPU: deltaU / Un,
    uReceivingKV,
    withinLimits,
    renReference: withinLimits ? REN_LABEL : REN_WARNING,
  };
}

/**
 * Simple voltage-drop model for lines < 50 km (no shunt capacitance).
 * ΔU = √3 · I · (R·cosφ + X·sinφ)  [V, line-to-line]
 *
 * @param I       Line current [A]
 * @param R       Total resistance [Ω]  (rOhmPerKm × lengthKm)
 * @param X       Total reactance [Ω]  (xOhmPerKm × lengthKm)
 * @param cosPhi  Power factor (–)
 * @param Un      Nominal line-to-line voltage [V]
 * @param lineId  Reference to the Line id in the network
 */
export function calcVoltageDrop(
  I: number,
  R: number,
  X: number,
  cosPhi: number,
  Un: number,
  lineId = '',
): VoltageDropResult {
  const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
  const deltaU = Math.sqrt(3) * I * (R * cosPhi + X * sinPhi);
  const uReceivingKV = (Un - deltaU) / 1000;
  return stamp(lineId, 'simple', deltaU, Un, uReceivingKV);
}

/**
 * Pi-model voltage drop for lines ≥ 50 km (with distributed shunt capacitance).
 *
 * Phase reference: V_S taken as real (sending end = voltage reference)
 *   I_R   = (P − jQ) / (3 · V_S_phase)     receiving-end load current
 *   I_C1  = V_S_phase · j(B/2)              capacitive shunt at sending end
 *   I_line = I_R + I_C1
 *   V_R   = V_S_phase − I_line · (R + jX)
 *   ΔU    = |V_S_LL| − |V_R| · √3
 *
 * @param P      Active power [W]
 * @param Q      Reactive power [VAr]
 * @param Vs     Sending-end line-to-line voltage [V]
 * @param R      Total series resistance [Ω]
 * @param X      Total series reactance [Ω]
 * @param B      Total shunt susceptance [S]  (bMuSPerKm × lengthKm × 1e-6)
 * @param Un     Nominal line-to-line voltage [V]
 * @param lineId Reference to the Line id in the network
 */
export function calcVoltageDropPi(
  P: number,
  Q: number,
  Vs: number,
  R: number,
  X: number,
  B: number,
  Un: number,
  lineId = '',
): VoltageDropResult {
  const VsPhase = Vs / Math.sqrt(3);

  // Receiving-end current (complex)
  const IR_re = P / (3 * VsPhase);
  const IR_im = -Q / (3 * VsPhase);

  // Sending-end shunt current
  const IC1_im = VsPhase * (B / 2);

  // Total line current
  const IL_re = IR_re;
  const IL_im = IR_im + IC1_im;

  // Series voltage drop: (R + jX) × I_line
  const drop_re = R * IL_re - X * IL_im;
  const drop_im = R * IL_im + X * IL_re;

  // Receiving-end phase voltage (complex)
  const VR_re = VsPhase - drop_re;
  const VR_im = -drop_im;

  const VR_phase = Math.sqrt(VR_re * VR_re + VR_im * VR_im);
  const VR_LL = VR_phase * Math.sqrt(3);

  const deltaU = Vs - VR_LL;
  return stamp(lineId, 'pi', deltaU, Un, VR_LL / 1000);
}
