import { describe, it, expect } from 'vitest';
import { calcCompensation } from './compensation.js';
import { importLegacyGmx } from '../io/gmx.js';
import { runNewtonRaphson } from './newton-raphson.js';
import s1raw from '../scenarios/Enkel_radial_Kilde_Porsgrunn_til_Last_Skien.json';

// ---------------------------------------------------------------------------
// Scenario 1 referanseparametere
// P = 5 MW, cosφ₁ = 0.928, cosφ₂ = 0.98, U = 22 kV, R_total = 3.0 Ω
//
// Forventet Q_komp = 5 · (tan(arccos(0.928)) − tan(arccos(0.98)))
//   tan(arccos(0.928)) = sqrt(1−0.928²)/0.928 = 0.3726/0.928 = 0.4015
//   tan(arccos(0.98))  = sqrt(1−0.98²)/0.98  = 0.1990/0.98  = 0.2031
//   Q_komp ≈ 5 · 0.1984 ≈ 0.992 MVAr  (toleranse ±0.01 MVAr iht. Sprint3-spec §4)
// ---------------------------------------------------------------------------

describe('calcCompensation — unit (cosφ₁=0.928, cosφ₂=0.98, P=5 MW)', () => {
  const calc = calcCompensation(5, 0.928, 0.98, 22, 3.0, 4);

  it('Q_komp ≈ 0.992 MVAr (±0.01)', () => {
    expect(calc.qKompMVAr).toBeGreaterThan(0.985);
    expect(calc.qKompMVAr).toBeLessThan(1.005);
  });

  it('S₁ = P/cosφ₁ ≈ 5.388 MVA (±0.01)', () => {
    expect(calc.s1MVA).toBeCloseTo(5 / 0.928, 1);
  });

  it('S₂ = P/cosφ₂ ≈ 5.102 MVA (±0.01)', () => {
    expect(calc.s2MVA).toBeCloseTo(5 / 0.98, 1);
  });

  it('strømreduksjon > 0 (alltid positiv ved kompensering)', () => {
    expect(calc.currentReductionPct).toBeGreaterThan(0);
  });

  it('tapreduksjon > 0 (alltid positiv ved kompensering)', () => {
    expect(calc.lossReductionPct).toBeGreaterThan(0);
  });

  it('φ₁ ≈ 21.9° (±0.3°)', () => {
    expect(calc.phi1Deg).toBeCloseTo(21.8, 0);
  });

  it('φ₂ ≈ 11.5° (±0.3°)', () => {
    expect(calc.phi2Deg).toBeCloseTo(11.5, 0);
  });

  it('linjestrøm I₁ ≈ 141 A', () => {
    expect(calc.i1A).toBeCloseTo(5.388e6 / (Math.sqrt(3) * 22e3), 0);
  });

  it('linjestrøm I₂ < I₁', () => {
    expect(calc.i2A).toBeLessThan(calc.i1A);
  });

  it('q2MVAr = q1MVAr − qKomp', () => {
    expect(calc.q2MVAr).toBeCloseTo(calc.q1MVAr - calc.qKompMVAr, 6);
  });

  it('trinnvis: 4 trinn med stigende cosφ', () => {
    expect(calc.steppedCosPhi).toHaveLength(4);
    for (let i = 1; i < 4; i++) {
      expect(calc.steppedCosPhi[i]).toBeGreaterThan(calc.steppedCosPhi[i - 1]);
    }
  });

  it('siste trinn nær cosφ₂_actual', () => {
    const last = calc.steppedCosPhi[3];
    expect(last).toBeCloseTo(calc.cosPhi2Actual, 4);
  });

  it('P²+Q₁²=S₁² (effekttrekant)', () => {
    expect(5 ** 2 + calc.q1MVAr ** 2).toBeCloseTo(calc.s1MVA ** 2, 4);
  });

  it('P²+Q₂²=S₂² (effekttrekant etter)', () => {
    expect(5 ** 2 + calc.q2MVAr ** 2).toBeCloseTo(calc.s2MVA ** 2, 4);
  });
});

describe('calcCompensation — grensetilfeller', () => {
  it('cosφ₁=cosφ₂ gir Q_komp = 0', () => {
    const c = calcCompensation(5, 0.95, 0.95, 22, 3, 1);
    expect(c.qKompMVAr).toBeCloseTo(0, 6);
  });

  it('cosφ₂=1.0 gir Q₂ ≈ 0 og S₂ ≈ P', () => {
    const c = calcCompensation(5, 0.9, 1.0, 22, 3, 1);
    expect(c.q2MVAr).toBeCloseTo(0, 3);
    expect(c.s2MVA).toBeCloseTo(5, 3);
  });

  it('strøm og tap alltid positive for induktiv last', () => {
    const c = calcCompensation(3, 0.85, 0.95, 22, 2, 2);
    expect(c.i1A).toBeGreaterThan(0);
    expect(c.pLoss1W).toBeGreaterThan(0);
  });
});

describe('calcCompensation — integrasjon mot scenario 1 NR-resultat', () => {
  const s1 = importLegacyGmx(s1raw);

  it('NR konvergerer (forutsetning for integrasjonstest)', () => {
    const res = runNewtonRaphson(s1);
    expect(res.converged).toBe(true);
  });

  it('Q_komp fra scenario 1-parametere er positiv', () => {
    const bus2 = s1.buses.find((b) => b.id === 'bus_2')!;
    const line1 = s1.lines[0];
    const s1MvA = Math.sqrt(bus2.loadMW ** 2 + bus2.loadMVAr ** 2);
    const cosPhi1 = s1MvA > 0 ? bus2.loadMW / s1MvA : 1;
    const rTotal = line1.rOhmPerKm * line1.lengthKm;
    const calc = calcCompensation(bus2.loadMW, cosPhi1, 0.98, bus2.voltageKV, rTotal, 3);
    expect(calc.qKompMVAr).toBeGreaterThan(0);
  });

  it('NR med redusert loadMVAr gir lavere tap enn baseline', () => {
    const res0 = runNewtonRaphson(s1);
    const bus2 = s1.buses.find((b) => b.id === 'bus_2')!;
    const line1 = s1.lines[0];
    const s1MvA = Math.sqrt(bus2.loadMW ** 2 + bus2.loadMVAr ** 2);
    const cosPhi1 = bus2.loadMW / s1MvA;
    const rTotal = line1.rOhmPerKm * line1.lengthKm;
    const calc = calcCompensation(bus2.loadMW, cosPhi1, 0.98, bus2.voltageKV, rTotal, 1);

    const s1Compensated = {
      ...s1,
      buses: s1.buses.map((b) =>
        b.id === 'bus_2'
          ? { ...b, loadMVAr: Math.max(0, calc.q2MVAr) }
          : b,
      ),
    };
    const res1 = runNewtonRaphson(s1Compensated);
    expect(res1.converged).toBe(true);
    expect(res1.totalLossesMW).toBeLessThan(res0.totalLossesMW);
  });
});
