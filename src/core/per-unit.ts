// GridMaster Edu — Per-unit conversion utilities

export interface PerUnitBase {
  sBaseMVA: number;
  uBaseKV: number;
}

/** Impedance base [Ω] */
export function zBase(sBaseMVA: number, uBaseKV: number): number {
  return (uBaseKV ** 2) / sBaseMVA;
}

/** Convert impedance in Ω to per-unit */
export function zToPU(zOhm: number, sBaseMVA: number, uBaseKV: number): number {
  return zOhm / zBase(sBaseMVA, uBaseKV);
}

/** Convert per-unit impedance back to Ω */
export function zFromPU(zPU: number, sBaseMVA: number, uBaseKV: number): number {
  return zPU * zBase(sBaseMVA, uBaseKV);
}

/** Convert voltage in kV to per-unit */
export function vToPU(vKV: number, uBaseKV: number): number {
  return vKV / uBaseKV;
}

/** Convert per-unit voltage back to kV */
export function vFromPU(vPU: number, uBaseKV: number): number {
  return vPU * uBaseKV;
}

/** Convert active power in MW to per-unit */
export function pToPU(pMW: number, sBaseMVA: number): number {
  return pMW / sBaseMVA;
}

/** Convert reactive power in MVAr to per-unit */
export function qToPU(qMVAr: number, sBaseMVA: number): number {
  return qMVAr / sBaseMVA;
}

/** Convert apparent power in MVA to per-unit */
export function sToPU(sMVA: number, sBaseMVA: number): number {
  return sMVA / sBaseMVA;
}

/** Convert current in A to per-unit (iBase = sBase / (sqrt(3) * uBase)) */
export function iToPU(iA: number, sBaseMVA: number, uBaseKV: number): number {
  const iBase = (sBaseMVA * 1e6) / (Math.sqrt(3) * uBaseKV * 1e3);
  return iA / iBase;
}

/** Format a per-unit value with 3 decimal places */
export function formatPU(value: number): string {
  return `${value.toFixed(3)} pu`;
}

export interface PerUnitBusResult {
  busId: string;
  busName: string;
  vPU: number;
  vAngDeg: number;
  pPU: number;
  qPU: number;
}

export interface PerUnitLineResult {
  lineId: string;
  lineName: string;
  pFromPU: number;
  qFromPU: number;
  currentPU: number;
  lossesPPU: number;
}
