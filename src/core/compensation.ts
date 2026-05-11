/**
 * Fasekompenserings-beregninger for GridMaster Edu.
 * Hovudformel: Q_komp = P · (tan φ₁ − tan φ₂)
 */

/** Alle kalkulerte størrelser for en fasekompenserings-operasjon. */
export interface CompensationCalc {
  cosPhi1: number;
  phi1Deg: number;
  s1MVA: number;
  q1MVAr: number;
  qKompMVAr: number;
  q2MVAr: number;
  s2MVA: number;
  cosPhi2Actual: number;
  phi2Deg: number;
  i1A: number;
  i2A: number;
  currentReductionPct: number;
  pLoss1W: number;
  pLoss2W: number;
  lossReductionPct: number;
  /** cosφ etter hvert innkoblet trinn (lengde = steps) */
  steppedCosPhi: number[];
}

/**
 * Beregn fasekompensering.
 *
 * @param pMW          Aktiv last [MW]
 * @param cosPhi1      Nåværende effektfaktor (0 < cosφ₁ ≤ 1)
 * @param cosPhi2      Ønsket effektfaktor etter kompensering (cosφ₂ ≤ cosφ₁ er tillatt,
 *                     men faglig sett gir cosφ₂ > cosφ₁ negativ Q_komp)
 * @param voltageKV    Nominell spenning [kV] for strøm-beregning
 * @param rTotalOhm    Total linjeresistans [Ω] for taps-beregning
 * @param steps        Antall kompenseringstrinn (≥ 1)
 */
export function calcCompensation(
  pMW: number,
  cosPhi1: number,
  cosPhi2: number,
  voltageKV: number,
  rTotalOhm: number,
  steps: number,
): CompensationCalc {
  const phi1 = Math.acos(Math.max(0.001, Math.min(1, cosPhi1)));
  const phi2 = Math.acos(Math.max(0.001, Math.min(1, cosPhi2)));

  const tanPhi1 = Math.tan(phi1);
  const tanPhi2 = Math.tan(phi2);

  const s1MVA = pMW / cosPhi1;
  const q1MVAr = pMW * tanPhi1;

  const qKompMVAr = pMW * (tanPhi1 - tanPhi2);
  const q2MVAr = q1MVAr - qKompMVAr;
  const s2MVA = Math.sqrt(pMW ** 2 + q2MVAr ** 2);
  const cosPhi2Actual = s2MVA > 0 ? pMW / s2MVA : 1;

  const sqrt3 = Math.sqrt(3);
  const i1A = s1MVA * 1e6 / (sqrt3 * voltageKV * 1e3);
  const i2A = s2MVA * 1e6 / (sqrt3 * voltageKV * 1e3);

  const pLoss1W = 3 * i1A ** 2 * rTotalOhm;
  const pLoss2W = 3 * i2A ** 2 * rTotalOhm;

  const currentReductionPct = i1A > 0 ? (i1A - i2A) / i1A * 100 : 0;
  const lossReductionPct = pLoss1W > 0 ? (pLoss1W - pLoss2W) / pLoss1W * 100 : 0;

  const n = Math.max(1, Math.round(steps));
  const steppedCosPhi = Array.from({ length: n }, (_, i) => {
    const qActive = (i + 1) * qKompMVAr / n;
    const qRes = q1MVAr - qActive;
    const sRes = Math.sqrt(pMW ** 2 + qRes ** 2);
    return sRes > 0 ? pMW / sRes : 1;
  });

  return {
    cosPhi1,
    phi1Deg: phi1 * 180 / Math.PI,
    s1MVA,
    q1MVAr,
    qKompMVAr,
    q2MVAr,
    s2MVA,
    cosPhi2Actual,
    phi2Deg: phi2 * 180 / Math.PI,
    i1A,
    i2A,
    currentReductionPct,
    pLoss1W,
    pLoss2W,
    lossReductionPct,
    steppedCosPhi,
  };
}
