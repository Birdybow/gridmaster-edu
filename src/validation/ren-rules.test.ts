import { describe, it, expect } from 'vitest';
import {
  checkCable,
  checkVoltageDrop,
  checkShortCircuit,
  checkProtectionSelectivity,
  checkEarthing,
  validateRen,
} from './ren-rules.js';
import type { GmxProject } from '../types/index.js';

function emptyProject(): GmxProject {
  return {
    metadata: {
      version: '13.0', created: '2026-01-01T00:00:00Z',
      modified: '2026-01-01T00:00:00Z', student: '', school: '', course: '',
      projectName: 'Test',
    },
    system: { sBaseMVA: 100, fHz: 50, uBaseKV: {} },
    buses: [], lines: [], transformers: [], generators: [],
    compensators: [], protections: [], results: {},
    canvas: { zoom: 1, panX: 0, panY: 0 },
  };
}

// ---------------------------------------------------------------------------
describe('checkCable', () => {
  it('Ib=18, In=20, Iz=27 → ok', () => {
    expect(checkCable(18, 20, 27)).toBe('ok');
  });

  it('Ib=18, In=20, Iz=22 → warning (margin < 10%)', () => {
    // Iz-In = 2, 10% av 22 = 2.2 → margin ikke ok
    expect(checkCable(18, 20, 22)).toBe('warning');
  });

  it('Ib=21, In=20, Iz=27 → error (Ib > In)', () => {
    expect(checkCable(21, 20, 27)).toBe('error');
  });

  it('In > Iz → error', () => {
    expect(checkCable(10, 30, 25)).toBe('error');
  });

  it('god margin → ok', () => {
    expect(checkCable(10, 16, 25)).toBe('ok');
  });

  it('Ib=0, In=16, Iz=25 → ok', () => {
    expect(checkCable(0, 16, 25)).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
describe('checkVoltageDrop', () => {
  it('3.5% → ok', () => {
    expect(checkVoltageDrop(3.5)).toBe('ok');
  });

  it('4.76% → warning (NR-fasit)', () => {
    expect(checkVoltageDrop(4.76)).toBe('warning');
  });

  it('11% → error', () => {
    expect(checkVoltageDrop(11)).toBe('error');
  });

  it('akkurat 4% → warning (grense)', () => {
    expect(checkVoltageDrop(4.0)).toBe('warning');
  });

  it('akkurat 10% → error (grense)', () => {
    expect(checkVoltageDrop(10.0)).toBe('error');
  });

  it('0% → ok', () => {
    expect(checkVoltageDrop(0)).toBe('ok');
  });

  it('negativ ΔU (spenningstigning) → ok', () => {
    expect(checkVoltageDrop(-3)).toBe('ok');
  });

  it('negativ ΔU stor → warning', () => {
    expect(checkVoltageDrop(-6)).toBe('warning');
  });
});

// ---------------------------------------------------------------------------
describe('checkShortCircuit', () => {
  it('Ik3p=1252A mot 16A C-vern (Ia=160A) → ok', () => {
    expect(checkShortCircuit(1252, 160)).toBe('ok');
  });

  it('Ik3p=1252A mot 63A C-vern (Ia=630A) → error', () => {
    expect(checkShortCircuit(1252, 630)).toBe('error');
  });

  it('stor Ik, lite vern → ok', () => {
    expect(checkShortCircuit(5000, 100)).toBe('ok');
  });

  it('Ik akkurat 2×Ia → ok (grense)', () => {
    expect(checkShortCircuit(400, 200)).toBe('ok');
  });

  it('Ik litt under 2×Ia → error', () => {
    expect(checkShortCircuit(399, 200)).toBe('error');
  });
});

// ---------------------------------------------------------------------------
describe('checkProtectionSelectivity', () => {
  it('SI t=0.629 opp, VI t=0.338 ned → ok (Δ=291ms)', () => {
    expect(checkProtectionSelectivity(0.629, 0.338)).toBe('ok');
  });

  it('SI t=0.429 opp, VI t=0.338 ned → error (Δ=91ms)', () => {
    expect(checkProtectionSelectivity(0.429, 0.338)).toBe('error');
  });

  it('akkurat 200ms margin → ok (grense)', () => {
    expect(checkProtectionSelectivity(0.538, 0.338)).toBe('ok');
  });

  it('199ms margin → error', () => {
    expect(checkProtectionSelectivity(0.537, 0.338)).toBe('error');
  });

  it('null-margin → error', () => {
    expect(checkProtectionSelectivity(0.5, 0.5)).toBe('error');
  });

  it('negativ margin → error', () => {
    expect(checkProtectionSelectivity(0.3, 0.5)).toBe('error');
  });
});

// ---------------------------------------------------------------------------
describe('checkEarthing', () => {
  it('R=80Ω, IT-nett → ok', () => {
    expect(checkEarthing(80, 'IT')).toBe('ok');
  });

  it('R=120Ω, IT-nett → error', () => {
    expect(checkEarthing(120, 'IT')).toBe('error');
  });

  it('R=60Ω, TN-nett → error', () => {
    expect(checkEarthing(60, 'TN')).toBe('error');
  });

  it('R=40Ω, TN-nett → ok', () => {
    expect(checkEarthing(40, 'TN')).toBe('ok');
  });

  it('R=100Ω, IT-nett → ok (grense)', () => {
    expect(checkEarthing(100, 'IT')).toBe('ok');
  });

  it('R=50Ω, TN-nett → ok (grense)', () => {
    expect(checkEarthing(50, 'TN')).toBe('ok');
  });

  it('Petersen behandles som IT', () => {
    expect(checkEarthing(80, 'Petersen')).toBe('ok');
    expect(checkEarthing(120, 'Petersen')).toBe('error');
  });
});

// ---------------------------------------------------------------------------
describe('validateRen', () => {
  it('tomt prosjekt returnerer []', () => {
    expect(validateRen(emptyProject())).toEqual([]);
  });

  it('prosjekt uten beregningsresultater → []', () => {
    const p = emptyProject();
    p.buses = [{
      id: 'b1', name: 'B1', type: 'slack', voltageKV: 22,
      loadMW: 0, loadMVAr: 0, vSetPU: 1, vMaxPU: 1.05, vMinPU: 0.95,
      position: { x: 0, y: 0 },
    }];
    expect(validateRen(p)).toEqual([]);
  });

  it('spenningsfall-advarsel opprettes ved ΔU=5%', () => {
    const p = emptyProject();
    p.lines = [{
      id: 'l1', name: 'L1', fromBusId: 'b1', toBusId: 'b2',
      lineType: 'overhead', lengthKm: 10, rOhmPerKm: 0.3,
      xOhmPerKm: 0.35, bMuSPerKm: 0, ratingMVA: 5,
    }];
    const vd = [{
      timestamp: '', lineId: 'l1', model: 'simple' as const,
      deltaUVolts: 0, deltaUPercent: 5.0, deltaUPU: 0.05,
      uReceivingKV: 21, withinLimits: false, renReference: '',
    }];
    const res = validateRen(p, vd);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].area).toBe('voltage_drop');
    expect(res[0].severity).toBe('warning');
  });

  it('spenningsfall-feil opprettes ved ΔU=11%', () => {
    const p = emptyProject();
    p.lines = [{
      id: 'l1', name: 'L1', fromBusId: 'b1', toBusId: 'b2',
      lineType: 'overhead', lengthKm: 10, rOhmPerKm: 0.3,
      xOhmPerKm: 0.35, bMuSPerKm: 0, ratingMVA: 5,
    }];
    const vd = [{
      timestamp: '', lineId: 'l1', model: 'simple' as const,
      deltaUVolts: 0, deltaUPercent: 11.0, deltaUPU: 0.11,
      uReceivingKV: 19.6, withinLimits: false, renReference: '',
    }];
    const res = validateRen(p, vd);
    expect(res.some((r) => r.severity === 'error')).toBe(true);
  });

  it('selektivitetssvikt gir RenResult', () => {
    const p = emptyProject();
    const sel = [{
      prot1Id: 'pr1', prot2Id: 'pr2',
      ikTestA: 500, t1s: 0.338, t2s: 0.429,
      marginS: 0.091, selective: false, sensitive1: true,
    }];
    const res = validateRen(p, [], [], sel);
    expect(res.some((r) => r.area === 'protection' && r.severity === 'error')).toBe(true);
  });

  it('referansestreng er satt for alle resultater', () => {
    const p = emptyProject();
    p.lines = [{
      id: 'l1', name: 'L1', fromBusId: 'b1', toBusId: 'b2',
      lineType: 'overhead', lengthKm: 10, rOhmPerKm: 0.3,
      xOhmPerKm: 0.35, bMuSPerKm: 0, ratingMVA: 5,
    }];
    const vd = [{
      timestamp: '', lineId: 'l1', model: 'simple' as const,
      deltaUVolts: 0, deltaUPercent: 5.0, deltaUPU: 0.05,
      uReceivingKV: 21, withinLimits: false, renReference: '',
    }];
    const res = validateRen(p, vd);
    for (const r of res) {
      expect(r.reference).toBeTruthy();
    }
  });
});
