import { describe, it, expect } from 'vitest';
import { buildYBus } from './ybus.js';
import type { Bus, Line, PerUnitSystem } from '../types/index.js';

const sys: PerUnitSystem = { sBaseMVA: 10, fHz: 50, uBaseKV: { 22: 22 } };

function bus(id: string, kv = 22 as const): Bus {
  return {
    id,
    name: id,
    type: 'PQ',
    voltageKV: kv,
    loadMW: 0,
    loadMVAr: 0,
    vSetPU: 1.0,
    vMaxPU: 1.1,
    vMinPU: 0.9,
    position: { x: 0, y: 0 },
  };
}

function line(id: string, from: string, to: string, rKm: number, xKm: number, len = 1): Line {
  return {
    id,
    name: id,
    fromBusId: from,
    toBusId: to,
    lineType: 'overhead',
    lengthKm: len,
    rOhmPerKm: rKm,
    xOhmPerKm: xKm,
    bMuSPerKm: 0,
    ratingMVA: 10,
  };
}

describe('buildYBus — 2-buss, Z=0.3+j0.35 Ω (1 km)', () => {
  // Z_base = 22²/10 = 48.4 Ω
  // z_pu = 0.3/48.4 + j*0.35/48.4 = 0.0061983 + j0.0072314
  // |z|² = 0.0061983² + 0.0072314² = 9.072e-5
  // y_series = 0.0061983/9.072e-5 - j*0.0072314/9.072e-5 = 68.32 - j79.72

  const buses = [bus('b1'), bus('b2')];
  const lines = [line('l1', 'b1', 'b2', 0.30, 0.35, 1)];

  it('diagonal equals series admittance (no shunt)', () => {
    const { Y } = buildYBus(buses, lines, [], sys);
    expect(Y[0][0][0]).toBeCloseTo(68.32, 1);
    expect(Y[0][0][1]).toBeCloseTo(-79.72, 1);
  });

  it('off-diagonal is negative of series admittance', () => {
    const { Y } = buildYBus(buses, lines, [], sys);
    expect(Y[0][1][0]).toBeCloseTo(-68.32, 1);
    expect(Y[0][1][1]).toBeCloseTo(79.72, 1);
  });

  it('Y matrix is symmetric: Y[0][1] == Y[1][0]', () => {
    const { Y } = buildYBus(buses, lines, [], sys);
    expect(Y[0][1][0]).toBeCloseTo(Y[1][0][0], 8);
    expect(Y[0][1][1]).toBeCloseTo(Y[1][0][1], 8);
  });

  it('row sum is zero (KCL)', () => {
    const { Y } = buildYBus(buses, lines, [], sys);
    for (let i = 0; i < 2; i++) {
      const sumG = Y[i][0][0] + Y[i][1][0];
      const sumB = Y[i][0][1] + Y[i][1][1];
      expect(Math.abs(sumG)).toBeLessThan(1e-8);
      expect(Math.abs(sumB)).toBeLessThan(1e-8);
    }
  });
});

describe('buildYBus — 2-buss med shunt (pi-modell, B≠0)', () => {
  const buses = [bus('b1'), bus('b2')];
  const linesB: Line[] = [{
    id: 'l1', name: 'l1',
    fromBusId: 'b1', toBusId: 'b2',
    lineType: 'overhead', lengthKm: 1,
    rOhmPerKm: 0.30, xOhmPerKm: 0.35, bMuSPerKm: 2.0,
    ratingMVA: 10,
  }];

  it('diagonal includes shunt contribution', () => {
    const { Y: Yno } = buildYBus(buses, [line('l1', 'b1', 'b2', 0.30, 0.35, 1)], [], sys);
    const { Y: Ysh } = buildYBus(buses, linesB, [], sys);
    // With B=2 μS/km, bPU = 2e-6 * 48.4 = 9.68e-5; shunt adds j*(bPU/2) to diagonal
    expect(Ysh[0][0][1]).toBeCloseTo(Yno[0][0][1] + 9.68e-5 / 2, 4);
  });

  it('off-diagonal unchanged by shunt', () => {
    const { Y: Yno } = buildYBus(buses, [line('l1', 'b1', 'b2', 0.30, 0.35, 1)], [], sys);
    const { Y: Ysh } = buildYBus(buses, linesB, [], sys);
    expect(Ysh[0][1][0]).toBeCloseTo(Yno[0][1][0], 8);
    expect(Ysh[0][1][1]).toBeCloseTo(Yno[0][1][1], 8);
  });
});

describe('buildYBus — transformer', () => {
  const buses3 = [bus('b1', 22), { ...bus('b2'), voltageKV: 0.4 as const }];
  const trafo = {
    id: 't1', name: 't1',
    fromBusId: 'b1', toBusId: 'b2',
    ratedMVA: 0.315,
    voltageHV_kV: 22, voltageLV_kV: 0.4,
    vectorGroup: 'Dyn11' as const,
    ekPercent: 4.0,
    rrPercent: 1.0,
    noLoadLossKW: 0,
    loadLossKW: 3.2,
    noLoadCurrentPercent: 0,
    tapMin: -10, tapMax: 10, tapStep: 2.5, tapCurrent: 0,
  };

  it('adds admittance to both diagonal elements', () => {
    const { Y } = buildYBus(buses3, [], [trafo], sys);
    // Verify non-zero diagonal — exact values tested in NR integration
    expect(Y[0][0][0]).toBeGreaterThan(0);
    expect(Y[1][1][0]).toBeGreaterThan(0);
  });

  it('off-diagonal is negative and equal in magnitude to diagonal contribution', () => {
    const { Y } = buildYBus(buses3, [], [trafo], sys);
    expect(Y[0][1][0]).toBeCloseTo(-Y[0][0][0], 8);
    expect(Y[0][1][1]).toBeCloseTo(-Y[0][0][1], 8);
  });
});

describe('buildYBus — busIndex mapping', () => {
  it('maps bus IDs to correct indices', () => {
    const buses = [bus('alpha'), bus('beta'), bus('gamma')];
    const { busIndex } = buildYBus(buses, [], [], sys);
    expect(busIndex.get('alpha')).toBe(0);
    expect(busIndex.get('beta')).toBe(1);
    expect(busIndex.get('gamma')).toBe(2);
  });
});
