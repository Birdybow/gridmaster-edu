import { describe, it, expect } from 'vitest';
import { calcTripTime, checkSelectivity } from './protection.js';

// ---------------------------------------------------------------------------
// Fasit — Standard invers (IEC 60255-151)
// TMS=0.1, I_s=100A, I=500A:
// t = 0.1 · 0.14 / (5^0.02 - 1) = 0.1 · 0.14 / 0.03267 = 0.429 s
//
// Fasit — Veldig invers:
// t = 0.1 · 13.5 / (5 - 1) = 0.1 · 13.5 / 4 = 0.338 s
// ---------------------------------------------------------------------------

describe('calcTripTime — standard_inverse', () => {
  it('fasit: t ≈ 0.429 s (±0.01)', () => {
    const t = calcTripTime(0.1, 100, 500, 'standard_inverse');
    expect(t).toBeGreaterThanOrEqual(0.419);
    expect(t).toBeLessThanOrEqual(0.439);
  });

  it('I ≤ Is → Infinity', () => {
    expect(calcTripTime(0.1, 100, 100, 'standard_inverse')).toBe(Infinity);
    expect(calcTripTime(0.1, 100, 50, 'standard_inverse')).toBe(Infinity);
  });

  it('TMS proporsjonalt med utløsetid', () => {
    const t1 = calcTripTime(0.1, 100, 500, 'standard_inverse');
    const t2 = calcTripTime(0.2, 100, 500, 'standard_inverse');
    expect(t2).toBeCloseTo(t1 * 2, 5);
  });

  it('høyere strøm gir kortere tid', () => {
    const tLow = calcTripTime(0.1, 100, 200, 'standard_inverse');
    const tHigh = calcTripTime(0.1, 100, 1000, 'standard_inverse');
    expect(tHigh).toBeLessThan(tLow);
  });
});

describe('calcTripTime — very_inverse', () => {
  it('fasit: t ≈ 0.338 s (±0.01)', () => {
    const t = calcTripTime(0.1, 100, 500, 'very_inverse');
    expect(t).toBeGreaterThanOrEqual(0.328);
    expect(t).toBeLessThanOrEqual(0.348);
  });

  it('I ≤ Is → Infinity', () => {
    expect(calcTripTime(0.1, 100, 100, 'very_inverse')).toBe(Infinity);
  });

  it('kortere tid enn standard_inverse ved høy overstrøm (I/Is=5)', () => {
    // At I/Is=5: SI=0.429s, VI=0.338s → VI is faster
    const tSI = calcTripTime(0.1, 100, 500, 'standard_inverse');
    const tVI = calcTripTime(0.1, 100, 500, 'very_inverse');
    expect(tVI).toBeLessThan(tSI);
  });
});

describe('calcTripTime — extremely_inverse', () => {
  it('t > 0 for I > Is', () => {
    const t = calcTripTime(0.1, 100, 500, 'extremely_inverse');
    expect(t).toBeGreaterThan(0);
  });

  it('kortere tid enn very_inverse ved høy overstrøm', () => {
    const tVI = calcTripTime(0.1, 100, 1000, 'very_inverse');
    const tEI = calcTripTime(0.1, 100, 1000, 'extremely_inverse');
    expect(tEI).toBeLessThan(tVI);
  });

  it('I ≤ Is → Infinity', () => {
    expect(calcTripTime(0.1, 100, 99, 'extremely_inverse')).toBe(Infinity);
  });
});

describe('calcTripTime — definite_time', () => {
  it('returnerer TMS direkte uavhengig av strøm', () => {
    expect(calcTripTime(0.5, 100, 500, 'definite_time')).toBe(0.5);
    expect(calcTripTime(1.0, 100, 9999, 'definite_time')).toBe(1.0);
  });

  it('I ≤ Is → Infinity', () => {
    expect(calcTripTime(0.5, 100, 50, 'definite_time')).toBe(Infinity);
  });
});

describe('checkSelectivity', () => {
  const p1 = { tms: 0.1, Is: 100, curve: 'standard_inverse' as const };
  const p2 = { tms: 0.2, Is: 100, curve: 'standard_inverse' as const };

  it('margin = t2 - t1', () => {
    const res = checkSelectivity(p1, p2, 500);
    expect(res.margin).toBeCloseTo(res.t2 - res.t1, 10);
  });

  it('TMS 0.1 vs 0.2: selektiv (margin ≈ 0.429 s)', () => {
    const res = checkSelectivity(p1, p2, 500);
    expect(res.margin).toBeCloseTo(0.429, 2);
    expect(res.selective).toBe(true);
  });

  it('for liten TMS-differanse → ikke selektiv', () => {
    const pa = { tms: 0.10, Is: 100, curve: 'standard_inverse' as const };
    const pb = { tms: 0.12, Is: 100, curve: 'standard_inverse' as const };
    const res = checkSelectivity(pa, pb, 500);
    expect(res.selective).toBe(false);
  });

  it('I ≤ Is prot1 → selective: true (ingen aktivering)', () => {
    const res = checkSelectivity(p1, p2, 50);
    expect(res.t1).toBe(Infinity);
    expect(res.selective).toBe(true);
  });

  it('prot1 løser ut men prot2 ikke → selective: false (backup feiler)', () => {
    const pa = { tms: 0.1, Is: 100, curve: 'standard_inverse' as const };
    const pb = { tms: 0.2, Is: 2000, curve: 'standard_inverse' as const }; // høy Is → ikke følsom
    const res = checkSelectivity(pa, pb, 500);
    expect(res.t1).not.toBe(Infinity);
    expect(res.t2).toBe(Infinity);
    expect(res.selective).toBe(false);
  });
});
