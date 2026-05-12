import type { OcCurve } from '../types/index.js';

export interface SelectivityCheck {
  selective: boolean;
  margin: number;
  t1: number;
  t2: number;
}

/**
 * IEC 60255-151 overcurrent relay trip time.
 * Returns Infinity if I ≤ Is (relay does not operate).
 *
 * @param tms   Time Multiplier Setting (0.05–1.0); for definite_time, used directly as seconds
 * @param Is    Pickup current [A]
 * @param I     Fault current [A]
 * @param curve Characteristic curve
 */
export function calcTripTime(tms: number, Is: number, I: number, curve: OcCurve): number {
  if (I <= Is) return Infinity;
  const r = I / Is;
  switch (curve) {
    case 'standard_inverse':  return tms * 0.14 / (r ** 0.02 - 1);
    case 'very_inverse':      return tms * 13.5 / (r - 1);
    case 'extremely_inverse': return tms * 80 / (r ** 2 - 1);
    case 'definite_time':     return tms;
  }
}

/**
 * Selectivity check for two series-connected overcurrent relays.
 * prot1 = downstream (closest to fault), prot2 = upstream (backup).
 *
 * @param dtMin  Minimum discrimination time [s], default 0.25 s (IEC 60255)
 */
export function checkSelectivity(
  prot1: { tms: number; Is: number; curve: OcCurve },
  prot2: { tms: number; Is: number; curve: OcCurve },
  Ik: number,
  dtMin = 0.25,
): SelectivityCheck {
  const t1 = calcTripTime(prot1.tms, prot1.Is, Ik, prot1.curve);
  const t2 = calcTripTime(prot2.tms, prot2.Is, Ik, prot2.curve);
  // prot1 doesn't see fault → no selectivity concern
  if (!isFinite(t1)) return { selective: true, margin: Infinity, t1, t2 };
  // prot1 trips but backup (prot2) doesn't → backup fails
  if (!isFinite(t2)) return { selective: false, margin: -Infinity, t1, t2 };
  const margin = t2 - t1;
  return { selective: margin >= dtMin, margin, t1, t2 };
}
