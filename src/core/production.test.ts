import { describe, it, expect } from 'vitest';
import { calcHydro, calcWind, calcSolar, calcNuclear, calcHydroDetailed, calcWindDetailed, calcSolarAnnual } from './production.js';

describe('calcHydro', () => {
  it('Francis: H=200, Q=50, η=0.92 → 90.252 MW', () => {
    expect(calcHydro(200, 50, 0.92)).toBeCloseTo(90.252, 1);
  });

  it('Pelton: H=600, Q=10, η=0.90 → 52.974 MW', () => {
    expect(calcHydro(600, 10, 0.90)).toBeCloseTo(52.974, 1);
  });

  it('Kaplan: H=20, Q=200, η=0.91 → positive value', () => {
    const p = calcHydro(20, 200, 0.91);
    expect(p).toBeGreaterThan(0);
  });
});

describe('calcWind', () => {
  it('v=10 m/s (between vci=3 and vr=13), Pn=3.0, n=1 → 1.029 MW', () => {
    expect(calcWind(10, 3, 13, 25, 3.0, 1)).toBeCloseTo(1.029, 2);
  });

  it('v < vci → 0 MW', () => {
    expect(calcWind(2, 3, 13, 25, 3.0, 1)).toBe(0);
  });

  it('v > vco → 0 MW', () => {
    expect(calcWind(30, 3, 13, 25, 3.0, 1)).toBe(0);
  });

  it('v = vr → Pn (rated)', () => {
    expect(calcWind(13, 3, 13, 25, 3.0, 1)).toBeCloseTo(3.0, 5);
  });

  it('v = vco → Pn (still within range)', () => {
    expect(calcWind(25, 3, 13, 25, 3.0, 1)).toBeCloseTo(3.0, 5);
  });

  it('n=5 turbines scales output', () => {
    const single = calcWind(10, 3, 13, 25, 3.0, 1);
    const five = calcWind(10, 3, 13, 25, 3.0, 5);
    expect(five).toBeCloseTo(single * 5, 5);
  });
});

describe('calcSolar', () => {
  it('t before sunrise → 0', () => {
    expect(calcSolar(5.0, 5, 6, 20)).toBe(0);
  });

  it('t after sunset → 0', () => {
    expect(calcSolar(5.0, 21, 6, 20)).toBe(0);
  });

  it('t at solar noon → near Ppeak', () => {
    const p = calcSolar(5.0, 13, 6, 20);
    expect(p).toBeGreaterThan(4.9);
  });

  it('t at sunrise → 0 (sin(0)=0)', () => {
    expect(calcSolar(5.0, 6, 6, 20)).toBeCloseTo(0, 5);
  });
});

describe('calcNuclear', () => {
  it('returns exactly Pn', () => {
    expect(calcNuclear(1000)).toBe(1000);
    expect(calcNuclear(400)).toBe(400);
    expect(calcNuclear(0)).toBe(0);
  });
});

describe('calcHydroDetailed', () => {
  it('Francis Q/Qn=0.8: P ≈ 72.12 MW (±0.1)', () => {
    // η = 0.93 * (1 - 0.3 * (0.8-1)²) = 0.93 * 0.988 = 0.91884
    // P = 0.91884 * 1000 * 9.81 * 200 * 40 / 1e6 = 72.12 MW
    const { pMW, etaAct } = calcHydroDetailed(200, 40, 50, 0.93, 0.3);
    expect(pMW).toBeCloseTo(72.12, 1);
    expect(etaAct).toBeCloseTo(0.9188, 3);
  });

  it('Francis Q/Qn=1.0 (design point): η = η_max', () => {
    const { etaAct } = calcHydroDetailed(200, 50, 50, 0.93, 0.3);
    expect(etaAct).toBeCloseTo(0.93, 5);
  });

  it('Pelton Q/Qn=0.5: η below η_max', () => {
    const { etaAct } = calcHydroDetailed(600, 5, 10, 0.91, 0.25);
    expect(etaAct).toBeLessThan(0.91);
    expect(etaAct).toBeGreaterThan(0.8);
  });

  it('result is positive for valid inputs', () => {
    const { pMW } = calcHydroDetailed(100, 20, 20, 0.90, 0.3);
    expect(pMW).toBeGreaterThan(0);
  });
});

describe('calcWindDetailed', () => {
  it('returns CF in realistic range [0.1, 0.6] for v_mean=8 m/s', () => {
    const { cf } = calcWindDetailed(8, 3.0, 1);
    expect(cf).toBeGreaterThan(0.1);
    expect(cf).toBeLessThan(0.6);
  });

  it('higher wind speed gives higher annual energy', () => {
    const { eYearMWh: e1 } = calcWindDetailed(6, 3.0, 1);
    const { eYearMWh: e2 } = calcWindDetailed(10, 3.0, 1);
    expect(e2).toBeGreaterThan(e1);
  });

  it('n turbines scales energy linearly', () => {
    const { eYearMWh: e1 } = calcWindDetailed(8, 3.0, 1);
    const { eYearMWh: e5 } = calcWindDetailed(8, 3.0, 5);
    expect(e5).toBeCloseTo(e1 * 5, 0);
  });
});

describe('calcSolarAnnual', () => {
  it('CF = 0.11 for Norway', () => {
    const { cf } = calcSolarAnnual(1.0);
    expect(cf).toBeCloseTo(0.11, 5);
  });

  it('E_year scales with P_peak', () => {
    const { eYearMWh: e1 } = calcSolarAnnual(1.0);
    const { eYearMWh: e2 } = calcSolarAnnual(2.0);
    expect(e2).toBeCloseTo(e1 * 2, 5);
  });

  it('monthly sum ≈ annual total', () => {
    const { eYearMWh, monthly } = calcSolarAnnual(1.0);
    const sumMonthly = monthly.reduce((s, v) => s + v, 0);
    expect(sumMonthly).toBeCloseTo(eYearMWh, 1);
  });

  it('June is highest month', () => {
    const { monthly } = calcSolarAnnual(1.0);
    const juneIdx = 5;
    expect(monthly[juneIdx]).toBe(Math.max(...monthly));
  });
});
