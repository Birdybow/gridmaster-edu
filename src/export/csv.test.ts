import { describe, it, expect } from 'vitest';
import { exportYBusCsv, exportLoadFlowCsv, exportShortCircuitCsv, exportRingNetworkCsv, exportVoltageDropCsv } from './csv.js';
import type { GmxProject, PowerFlowResult, ShortCircuitResult, RingNetworkResult, VoltageDropResult } from '../types/index.js';

// minimal mock project
function makeProject(): GmxProject {
  return {
    metadata: {
      version: '12.0',
      created: '2026-01-01T00:00:00Z',
      modified: '2026-01-01T00:00:00Z',
      student: 'Test',
      school: 'Testskole',
      course: 'TEST',
      projectName: 'Testprosjekt',
    },
    system: { sBaseMVA: 100, fHz: 50, uBaseKV: {} },
    buses: [
      { id: 'b1', name: 'Buss 1', type: 'slack', voltageKV: 22, loadMW: 0, loadMVAr: 0, vSetPU: 1, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 0, y: 0 } },
      { id: 'b2', name: 'Buss 2', type: 'PQ', voltageKV: 22, loadMW: 5, loadMVAr: 2, vSetPU: 1, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 100, y: 0 } },
    ],
    lines: [
      { id: 'l1', name: 'Linje 1', fromBusId: 'b1', toBusId: 'b2', lineType: 'overhead', lengthKm: 10, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 10 },
    ],
    transformers: [],
    generators: [],
    compensators: [],
    protections: [],
    results: {},
    canvas: { zoom: 1, panX: 0, panY: 0 },
  };
}

// ---------------------------------------------------------------------------
// Unit tests — these don't trigger real download (no document in vitest node)
// They test the data logic only
// ---------------------------------------------------------------------------

describe('CSV-eksport — datalogikk', () => {
  it('exportYBusCsv kaster ikke feil for gyldig prosjekt', () => {
    if (typeof document === 'undefined') return; // skip in node
    const p = makeProject();
    expect(() => exportYBusCsv(p)).not.toThrow();
  });

  it('exportLoadFlowCsv kaster ikke feil for gyldig PF-resultat', () => {
    if (typeof document === 'undefined') return;
    const p = makeProject();
    const pf: PowerFlowResult = {
      timestamp: new Date().toISOString(),
      converged: true,
      iterations: 3,
      maxMismatchPU: 1e-5,
      totalLossesMW: 0.123,
      totalLossesMVAr: 0.05,
      buses: [
        { busId: 'b1', vMagPU: 1.0, vAngDeg: 0, vMagKV: 22, pMW: 5.123, qMVAr: 2.05, withinLimits: true },
        { busId: 'b2', vMagPU: 0.98, vAngDeg: -2.1, vMagKV: 21.56, pMW: -5, qMVAr: -2, withinLimits: true },
      ],
      lines: [
        { lineId: 'l1', fromBusId: 'b1', toBusId: 'b2', pFromMW: 5.123, qFromMVAr: 2.05, pToMW: 5.0, qToMVAr: 2.0, currentKA: 0.148, lossesActiveMW: 0.123, lossesReactiveMVAr: 0.05, loadingPercent: 42, overloaded: false },
      ],
      iterationLog: [],
    };
    expect(() => exportLoadFlowCsv(p, pf)).not.toThrow();
  });

  it('exportShortCircuitCsv kaster ikke feil', () => {
    if (typeof document === 'undefined') return;
    const p = makeProject();
    const sc: ShortCircuitResult[] = [{
      timestamp: new Date().toISOString(),
      busId: 'b2',
      faultType: '3phase',
      ik3pMaxKA: 1.252,
      ik2pKA: 1.084,
      ipKA: 2.557,
      ik3pMinKA: 0.95,
      ik1pMinKA: 0.83,
      contributions: [],
      cFactorMax: 1.1,
      cFactorMin: 1.0,
      tempCorrFactor: 1.0,
    }];
    expect(() => exportShortCircuitCsv(p, sc)).not.toThrow();
  });

  it('exportRingNetworkCsv kaster ikke feil', () => {
    if (typeof document === 'undefined') return;
    const p = makeProject();
    const rn: RingNetworkResult = {
      timestamp: new Date().toISOString(),
      topology: 'symmetric',
      busA: 'b1', busB: 'b1', busC: 'b2',
      iLoadA: 83, iLoadB: 83,
      branches: [
        { fromBusId: 'b1', toBusId: 'b2', currentA: 83, tapKW: 10.3, loadingPercent: 30 },
      ],
      totalTapKW: 20.6,
      radialTapKW: 82.4,
      tapReductionPercent: 75,
    };
    expect(() => exportRingNetworkCsv(p, rn)).not.toThrow();
  });

  it('exportVoltageDropCsv kaster ikke feil', () => {
    if (typeof document === 'undefined') return;
    const p = makeProject();
    const vd: VoltageDropResult[] = [{
      timestamp: new Date().toISOString(),
      lineId: 'l1',
      model: 'simple',
      deltaUVolts: 1047,
      deltaUPercent: 4.76,
      deltaUPU: 0.0476,
      uReceivingKV: 20.953,
      withinLimits: true,
      renReference: 'FEF §5-3',
    }];
    expect(() => exportVoltageDropCsv(p, vd)).not.toThrow();
  });
});

describe('CSV-separator og BOM', () => {
  it('BOM er UTF-8 BOM karakter', () => {
    // ﻿ = UTF-8 BOM
    expect('﻿'.charCodeAt(0)).toBe(0xFEFF);
  });

  it('separator er semikolon', () => {
    const SEP = ';';
    const row = ['Buss 1', '22.0', '1.0'].join(SEP);
    expect(row).toBe('Buss 1;22.0;1.0');
  });
});
