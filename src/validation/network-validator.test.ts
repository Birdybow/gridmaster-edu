import { describe, it, expect } from 'vitest';
import { validateNetwork } from './network-validator.js';
import type { GmxProject, Bus, Line } from '../types/index.js';

function makeProject(overrides: Partial<GmxProject> = {}): GmxProject {
  return {
    metadata: {
      version: '1.0',
      created: '2025-01-01T00:00:00Z',
      modified: '2025-01-01T00:00:00Z',
      student: 'Test',
      school: 'Test',
      course: 'Test',
      projectName: 'Test',
    },
    system: { sBaseMVA: 100, fHz: 50, uBaseKV: { 22: 22 } },
    buses: [],
    lines: [],
    transformers: [],
    generators: [],
    compensators: [],
    protections: [],
    results: {},
    canvas: { zoom: 1, panX: 0, panY: 0 },
    ...overrides,
  };
}

function makeBus(id: string, type: Bus['type'], kv: Bus['voltageKV'] = 22): Bus {
  return {
    id,
    name: `Bus ${id}`,
    type,
    voltageKV: kv,
    loadMW: 0,
    loadMVAr: 0,
    vSetPU: 1.0,
    vMaxPU: 1.05,
    vMinPU: 0.95,
    position: { x: 0, y: 0 },
  };
}

function makeLine(id: string, from: string, to: string, lengthKm = 1.0): Line {
  return {
    id,
    name: `Line ${id}`,
    fromBusId: from,
    toBusId: to,
    lineType: 'overhead',
    lengthKm,
    rOhmPerKm: 0.3,
    xOhmPerKm: 0.35,
    bMuSPerKm: 2.8,
    ratingMVA: 10,
  };
}

describe('validateNetwork', () => {
  it('nett uten busser — ingen feil', () => {
    const result = validateNetwork(makeProject());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('nett uten slack-buss — feil NO_SLACK', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'PQ'), makeBus('b2', 'PQ')],
      lines: [makeLine('l1', 'b1', 'b2')],
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'NO_SLACK')).toBe(true);
  });

  it('nett med to slack-busser — feil MULTIPLE_SLACK', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack'), makeBus('b2', 'slack')],
      lines: [makeLine('l1', 'b1', 'b2')],
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MULTIPLE_SLACK')).toBe(true);
  });

  it('isolert node — feil ISOLATED_NODE', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack'), makeBus('b2', 'PQ'), makeBus('b3', 'PQ')],
      lines: [makeLine('l1', 'b1', 'b2')],
      // b3 har ingen linjer
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'ISOLATED_NODE' && e.componentId === 'b3')).toBe(true);
  });

  it('gyldig 3-buss nett — OK', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack'), makeBus('b2', 'PV'), makeBus('b3', 'PQ')],
      lines: [makeLine('l1', 'b1', 'b2'), makeLine('l2', 'b2', 'b3')],
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('linje med lengde 0 — feil ZERO_LENGTH_LINE', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack'), makeBus('b2', 'PQ')],
      lines: [makeLine('l1', 'b1', 'b2', 0)],
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'ZERO_LENGTH_LINE' && e.componentId === 'l1')).toBe(true);
  });

  it('linje mellom ulike spenningsnivåer uten trafo — feil VOLTAGE_MISMATCH', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack', 22), makeBus('b2', 'PQ', 0.4)],
      lines: [makeLine('l1', 'b1', 'b2')],
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'VOLTAGE_MISMATCH')).toBe(true);
  });

  it('enkelt-buss nett — advarsel SINGLE_BUS', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack')],
    });
    const result = validateNetwork(project);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === 'SINGLE_BUS')).toBe(true);
  });

  it('PV-buss uten generator — advarsel PV_NO_GENERATOR', () => {
    const project = makeProject({
      buses: [makeBus('b1', 'slack'), makeBus('b2', 'PV')],
      lines: [makeLine('l1', 'b1', 'b2')],
    });
    const result = validateNetwork(project);
    expect(result.warnings.some((w) => w.code === 'PV_NO_GENERATOR')).toBe(true);
  });
});
