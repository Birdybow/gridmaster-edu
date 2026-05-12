import { describe, it, expect } from 'vitest';
import { calcVoltageDrop, calcVoltageDropPi } from './voltage-drop.js';

// ---------------------------------------------------------------------------
// Simple model
// ---------------------------------------------------------------------------
describe('calcVoltageDrop — enkel modell', () => {
  it('Scenario 1: I=148A R=3Ω X=3.5Ω cosφ=0.928 Un=22kV → ΔU%≈4.76%', () => {
    const res = calcVoltageDrop(148, 3.0, 3.5, 0.928, 22_000);
    expect(res.deltaUPercent).toBeCloseTo(4.76, 1); // ±0.1%
    expect(res.model).toBe('simple');
  });

  it('deltaUVolts ≈ 1048 V for scenario 1', () => {
    const res = calcVoltageDrop(148, 3.0, 3.5, 0.928, 22_000);
    expect(res.deltaUVolts).toBeCloseTo(1048, 0); // ±0.5 V
  });

  it('withinLimits=true ved ΔU%=4.76% (< 10%)', () => {
    const res = calcVoltageDrop(148, 3.0, 3.5, 0.928, 22_000);
    expect(res.withinLimits).toBe(true);
  });

  it('withinLimits=false ved ΔU% ≥ 10%', () => {
    // Høy last: I=500A, R=5Ω, X=5Ω, cosφ=0.9, Un=22kV → ΔU ≈ 8327V ≈ 37.8%
    const res = calcVoltageDrop(500, 5.0, 5.0, 0.9, 22_000);
    expect(res.withinLimits).toBe(false);
    expect(res.renReference).toContain('overskrider');
  });

  it('ΔU=0 ved I=0', () => {
    const res = calcVoltageDrop(0, 3.0, 3.5, 0.928, 22_000);
    expect(res.deltaUPercent).toBe(0);
  });

  it('uReceivingKV = (Un − ΔU) / 1000', () => {
    const res = calcVoltageDrop(148, 3.0, 3.5, 0.928, 22_000);
    expect(res.uReceivingKV).toBeCloseTo((22_000 - res.deltaUVolts) / 1000, 3);
  });

  it('deltaUPU = deltaUVolts / Un', () => {
    const res = calcVoltageDrop(148, 3.0, 3.5, 0.928, 22_000);
    expect(res.deltaUPU).toBeCloseTo(res.deltaUVolts / 22_000, 6);
  });
});

// ---------------------------------------------------------------------------
// Pi-model
// ---------------------------------------------------------------------------
describe('calcVoltageDropPi — pi-modell (100 km FeAl 95mm²)', () => {
  // 100 km luftlinje FeAl 95mm²: R=30Ω, X=33Ω, B=290μS
  // P=20MW, Q=8MVAr, Un=66kV
  // Fasit: ΔU% ≈ 18.75% (beregnet i DEVLOG beslutning 19)
  const R = 30, X = 33, B = 290e-6;
  const P = 20e6, Q = 8e6, Un = 66_000;

  it('ΔU% ≈ 18.75% for 100km FeAl95 med 20MW/8MVAr ved 66kV', () => {
    const res = calcVoltageDropPi(P, Q, Un, R, X, B, Un);
    expect(res.deltaUPercent).toBeCloseTo(18.75, 1);
  });

  it('withinLimits=false (ΔU% ≫ 10%)', () => {
    const res = calcVoltageDropPi(P, Q, Un, R, X, B, Un);
    expect(res.withinLimits).toBe(false);
  });

  it('uReceivingKV < Un/1000 (spenningsfall, ikke stigning)', () => {
    const res = calcVoltageDropPi(P, Q, Un, R, X, B, Un);
    expect(res.uReceivingKV).toBeLessThan(Un / 1000);
  });

  it('modell=pi', () => {
    const res = calcVoltageDropPi(P, Q, Un, R, X, B, Un);
    expect(res.model).toBe('pi');
  });

  it('Pi-modell gir lavere ΔU% enn enkel modell (kapasitanseffekt)', () => {
    // Simple model approximation with same apparent current
    const I = Math.sqrt(P * P + Q * Q) / (Math.sqrt(3) * Un);
    const cosPhi = P / Math.sqrt(P * P + Q * Q);
    const simple = calcVoltageDrop(I, R, X, cosPhi, Un);
    const pi = calcVoltageDropPi(P, Q, Un, R, X, B, Un);
    expect(pi.deltaUPercent).toBeLessThan(simple.deltaUPercent);
  });

  it('Ferranti-effekt: |ΔU%| < 1% ved P=0 Q=0 (kapasitiv spenningsstigning)', () => {
    // With no load, shunt capacitance causes slight receiving-end voltage rise (Ferranti).
    // ΔU is small but negative → |ΔU%| stays well under 1%.
    const res = calcVoltageDropPi(0, 0, Un, R, X, B, Un);
    expect(Math.abs(res.deltaUPercent)).toBeLessThan(1);
  });
});
