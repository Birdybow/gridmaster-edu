import { describe, it, expect } from 'vitest';
import { calcRingSymmetric, calcRingAsymmetric } from './ring-network.js';

// ---------------------------------------------------------------------------
// Fasit — symmetrisk 3-buss ringnett (fra arbeidsordre)
// A og B: V=1.0 p.u., 22 kV
// Last C: P=6 MW, Q=2 MVAr
// Z_AC = Z_CB = 1.5 + j1.75 Ω  (5 km, 0.30+j0.35 Ω/km)
// I_last = √(6²+2²)·1e6 / (√3·22000) = 166.0 A
// Symmetrisk: I_A = I_B = 83.0 A
// Tap per grein: 83²·1.5 = 10.345 kW  → total = 20.69 kW
// Radial tap: 166²·3.0 = 82.7 kW
// Tapreduksjon ≈ 75%
// ---------------------------------------------------------------------------

const R_AC = 1.5;
const X_AC = 1.75;
const Z_AC = Math.sqrt(R_AC ** 2 + X_AC ** 2);   // 2.302 Ω
const R_CB = 1.5;
const X_CB = 1.75;
const Z_CB = Math.sqrt(R_CB ** 2 + X_CB ** 2);

const P_MW = 6;
const Q_MVAr = 2;
const UN_V = 22_000;
const I_LOAD = (Math.sqrt(P_MW ** 2 + Q_MVAr ** 2) * 1e6) / (Math.sqrt(3) * UN_V);
// ≈ 166.0 A

describe('ring-network — calcRingSymmetric', () => {
  const res = calcRingSymmetric(I_LOAD, Z_AC, Z_CB, R_AC, R_CB);

  it('I_load er ≈ 166 A', () => {
    expect(I_LOAD).toBeCloseTo(166.0, 0);
  });

  it('I_A ≈ 83 A (±1 A)', () => {
    expect(res.IA).toBeGreaterThanOrEqual(82);
    expect(res.IA).toBeLessThanOrEqual(84);
  });

  it('I_B ≈ 83 A (±1 A)', () => {
    expect(res.IB).toBeGreaterThanOrEqual(82);
    expect(res.IB).toBeLessThanOrEqual(84);
  });

  it('I_A + I_B = I_load', () => {
    expect(res.IA + res.IB).toBeCloseTo(I_LOAD, 3);
  });

  it('Total tap ≈ 20.6 kW (±0.5 kW)', () => {
    expect(res.totalTap).toBeGreaterThanOrEqual(20.1);
    expect(res.totalTap).toBeLessThanOrEqual(21.1);
  });

  it('Radial tap ≈ 82.7 kW', () => {
    expect(res.radialTap).toBeCloseTo(82.7, 0);
  });

  it('Tapreduksjon ≈ 75% (±2%)', () => {
    expect(res.tapReductionPercent).toBeGreaterThanOrEqual(73);
    expect(res.tapReductionPercent).toBeLessThanOrEqual(77);
  });

  it('tapAC = tapCB (symmetrisk)', () => {
    expect(res.tapAC).toBeCloseTo(res.tapCB, 3);
  });
});

describe('ring-network — calcRingAsymmetric (VA=VB gir samme som symmetric)', () => {
  const res = calcRingAsymmetric(I_LOAD, Z_AC, Z_CB, R_AC, R_CB, 0);

  it('I_A ≈ 83 A når VA=VB', () => {
    expect(res.IA).toBeGreaterThanOrEqual(82);
    expect(res.IA).toBeLessThanOrEqual(84);
  });

  it('I_B ≈ 83 A når VA=VB', () => {
    expect(res.IB).toBeGreaterThanOrEqual(82);
    expect(res.IB).toBeLessThanOrEqual(84);
  });

  it('Total tap ≈ 20.6 kW', () => {
    expect(res.totalTap).toBeGreaterThanOrEqual(20.1);
    expect(res.totalTap).toBeLessThanOrEqual(21.1);
  });
});

describe('ring-network — calcRingAsymmetric med ulik impedans', () => {
  // Z_AC = 2*Z_CB: mer impedans fra A → mer strøm fra B
  const Z_AC2 = 2 * Z_CB;
  const R_AC2 = 2 * R_CB;
  const res = calcRingAsymmetric(I_LOAD, Z_AC2, Z_CB, R_AC2, R_CB, 0);

  it('I_A < I_B (mer impedans fra A → mindre strøm fra A)', () => {
    expect(res.IA).toBeLessThan(res.IB);
  });

  it('I_A + I_B = I_load', () => {
    expect(res.IA + res.IB).toBeCloseTo(I_LOAD, 3);
  });

  it('Tapreduksjon fortsatt positiv', () => {
    expect(res.tapReductionPercent).toBeGreaterThan(0);
  });
});

describe('ring-network — kanttilfeller', () => {
  it('Ingen last → ingen tap', () => {
    const res = calcRingSymmetric(0, Z_AC, Z_CB, R_AC, R_CB);
    expect(res.IA).toBe(0);
    expect(res.IB).toBe(0);
    expect(res.totalTap).toBe(0);
    expect(res.tapReductionPercent).toBe(0);
  });

  it('Kun én grein (Z_CB → 0) → alt fra A', () => {
    const res = calcRingSymmetric(I_LOAD, Z_AC, 1e-9, R_AC, 1e-9);
    expect(res.IA).toBeCloseTo(0, 0);
    expect(res.IB).toBeCloseTo(I_LOAD, 0);
  });
});
