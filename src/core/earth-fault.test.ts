import { describe, it, expect } from 'vitest';
import { calcEarthFaultIT, calcEarthFaultTN, calcPetersen } from './earth-fault.js';

// Fasit: I_jord = Uf · ω · C0 · L
// = (22000/√3) · (2π·50) · 0.3e-6 · 10
// = 12700 · 314.16 · 3e-6 ≈ 11.97 A
describe('calcEarthFaultIT', () => {
  it('FASIT: 22kV, C0=0.3µF/km, L=10km → ~12.0 A (±0.5 A)', () => {
    const result = calcEarthFaultIT(22e3, 0.3e-6, 10, 50);
    expect(result).toBeGreaterThanOrEqual(11.5);
    expect(result).toBeLessThanOrEqual(12.5);
  });

  it('scales linearly with cable length', () => {
    const base = calcEarthFaultIT(22e3, 0.3e-6, 10, 50);
    const double = calcEarthFaultIT(22e3, 0.3e-6, 20, 50);
    expect(double).toBeCloseTo(base * 2, 3);
  });

  it('scales linearly with capacitance', () => {
    const base = calcEarthFaultIT(22e3, 0.3e-6, 10, 50);
    const double = calcEarthFaultIT(22e3, 0.6e-6, 10, 50);
    expect(double).toBeCloseTo(base * 2, 3);
  });
});

// Fasit: I_jord = 230 / (0.5 + 0.5) = 230 A
describe('calcEarthFaultTN', () => {
  it('FASIT: Uf=230V, Zfase=0.5Ω, Zjord=0.5Ω → 230 A (±5 A)', () => {
    const result = calcEarthFaultTN(230, 0.5, 0.5);
    expect(result).toBeGreaterThanOrEqual(225);
    expect(result).toBeLessThanOrEqual(235);
  });

  it('higher impedance → lower fault current', () => {
    const low = calcEarthFaultTN(230, 0.5, 0.5);
    const high = calcEarthFaultTN(230, 1.0, 1.0);
    expect(high).toBeLessThan(low);
  });
});

// Fasit: L_P = 1/(3·ω²·C0·L) = 1/(3·98696·0.3e-6·10) ≈ 1.126 H
// Note: spec doc had a typo (wrote ω²=9870 instead of 98696), physically correct value is 1.126 H
describe('calcPetersen', () => {
  it('FASIT: 22kV, C0=0.3µF/km, L=10km → L_P ≈ 1.126 H (±0.01 H)', () => {
    const { L_P } = calcPetersen(22e3, 0.3e-6, 10, 50);
    expect(L_P).toBeGreaterThanOrEqual(1.116);
    expect(L_P).toBeLessThanOrEqual(1.136);
  });

  it('full compensation k=1.0 → I_rest = 0', () => {
    const { I_rest } = calcPetersen(22e3, 0.3e-6, 10, 50, 1.0);
    expect(I_rest).toBeCloseTo(0, 6);
  });

  it('partial compensation k=0.9 → I_rest = 10% of I_jord', () => {
    const { I_rest, I_jord } = calcPetersen(22e3, 0.3e-6, 10, 50, 0.9);
    expect(I_rest).toBeCloseTo(I_jord * 0.1, 6);
  });

  it('I_jord matches calcEarthFaultIT', () => {
    const { I_jord } = calcPetersen(22e3, 0.3e-6, 10, 50);
    expect(I_jord).toBeGreaterThanOrEqual(11.5);
    expect(I_jord).toBeLessThanOrEqual(12.5);
  });
});
