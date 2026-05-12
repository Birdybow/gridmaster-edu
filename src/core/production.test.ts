import { describe, it, expect } from 'vitest';
import { calcHydro, calcWind, calcSolar, calcNuclear } from './production.js';

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
