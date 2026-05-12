import { describe, it, expect } from 'vitest';
import { calcIk3p, calcIk2p, calcImpact, calcIk3pMin, calcZThevenin, calcContributions } from './short-circuit.js';
import type { GmxProject } from '../types/index.js';

// ---------------------------------------------------------------------------
// Fasit-nett  (IEC 60909 eksempel fra Sprint 5 arbeidsordre)
//   Generator: Sn=10MVA, Un=22kV, x''d=0.15 p.u.
//   Linje fra gen-buss til feilsted: R=3.0Ω, X=3.5Ω
//   Z_gen = j·0.15·(22²/10) = j7.26Ω
//   Z_k   = 3.0 + j10.76Ω,  |Z_k| = 11.17Ω
// ---------------------------------------------------------------------------

// Pure-function tests don't need a project

describe('calcIk3p — trepolt maks (S5-01)', () => {
  it('fasit: |Z_k|=11.17Ω, Un=22kV → I′′k3p≈1.252 kA', () => {
    const ik = calcIk3p(11.17, 22_000);
    expect(ik).toBeCloseTo(1.252, 1);
  });

  it('c=1.00 (min) gir lavere verdi enn c=1.10 (maks)', () => {
    expect(calcIk3p(11.17, 22_000, 1.00)).toBeLessThan(calcIk3p(11.17, 22_000, 1.10));
  });

  it('dobler Un → dobler I′′k3p', () => {
    const i1 = calcIk3p(10, 22_000);
    const i2 = calcIk3p(10, 44_000);
    expect(i2).toBeCloseTo(i1 * 2, 5);
  });

  it('dobler Z_k → halverer I′′k3p', () => {
    const i1 = calcIk3p(11.17, 22_000);
    const i2 = calcIk3p(22.34, 22_000);
    expect(i2).toBeCloseTo(i1 / 2, 5);
  });
});

describe('calcIk2p — topolt (S5-02)', () => {
  it('fasit: I′′k3p=1.252 → I′′k2p≈1.084 kA', () => {
    expect(calcIk2p(1.252)).toBeCloseTo(1.084, 1);
  });

  it('I′′k2p = 0.866 · I′′k3p', () => {
    const ik3p = 2.0;
    expect(calcIk2p(ik3p)).toBeCloseTo(0.866 * ik3p, 3);
  });
});

describe('calcImpact — støtstrøm ip (S5-03)', () => {
  it('fasit: R/X=0.279, I′′k3p=1.252 → ip≈2.557 kA (±0.05)', () => {
    const rOverX = 3.0 / 10.76;
    const ip = calcImpact(1.252, rOverX);
    expect(ip).toBeCloseTo(2.557, 1);
  });

  it('κ maks (R/X→0) → ip = 2.0 · I′′k3p', () => {
    // κ = 1.02 + 0.98 ≈ 2.0 when R/X=0
    const ip = calcImpact(1.0, 0);
    expect(ip).toBeCloseTo(2.0 * Math.sqrt(2), 2);
  });

  it('κ min (R/X→∞) → ip ≈ 1.02·√2·I′′k3p', () => {
    const ip = calcImpact(1.0, 100);
    expect(ip).toBeCloseTo(1.02 * Math.sqrt(2), 2);
  });

  it('ip > √2 · I′′k3p alltid (κ>1)', () => {
    expect(calcImpact(1.252, 0.279)).toBeGreaterThan(Math.sqrt(2) * 1.252);
  });
});

describe('calcIk3pMin — minimal kortslutningsstrøm (S5-04)', () => {
  it('tempFactor=1.0 → I′′k3p_min = I′′k3p(c=1.00)', () => {
    const min = calcIk3pMin(11.17, 22_000, 1.0);
    const ref = calcIk3p(11.17, 22_000, 1.0);
    expect(min).toBeCloseTo(ref, 6);
  });

  it('PEX tempFactor=1.28 → impedans øker → I′′k3p_min reduseres', () => {
    const base = calcIk3pMin(11.17, 22_000, 1.0);
    const warm = calcIk3pMin(11.17, 22_000, 1.28);
    expect(warm).toBeLessThan(base);
  });

  it('PVC tempFactor=1.20 gir verdi mellom 1.0 og 1.28', () => {
    const t10 = calcIk3pMin(11.17, 22_000, 1.0);
    const t12 = calcIk3pMin(11.17, 22_000, 1.20);
    const t128 = calcIk3pMin(11.17, 22_000, 1.28);
    expect(t12).toBeLessThan(t10);
    expect(t12).toBeGreaterThan(t128);
  });
});

// ---------------------------------------------------------------------------
// Z_thevenin fra nettverk (krever et GmxProject-objekt)
// ---------------------------------------------------------------------------

function makeFasitProject(): GmxProject {
  const genBusId = 'bus-gen';
  const faultBusId = 'bus-fault';
  return {
    metadata: { version: '1', created: '', modified: '', student: '', school: '', course: '', projectName: '' },
    system: { sBaseMVA: 100, fHz: 50, uBaseKV: { 22: 22 } },
    buses: [
      { id: genBusId,   name: 'Gen',   type: 'PV',    voltageKV: 22, loadMW: 0, loadMVAr: 0, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 0, y: 0 } },
      { id: faultBusId, name: 'Fault', type: 'PQ',    voltageKV: 22, loadMW: 0, loadMVAr: 0, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 1, y: 0 } },
    ],
    lines: [
      {
        id: 'line-1', name: 'L1', fromBusId: genBusId, toBusId: faultBusId,
        lineType: 'overhead', lengthKm: 10,
        // Total R=3Ω, X=3.5Ω → per km: 0.30 Ω/km, 0.35 Ω/km
        rOhmPerKm: 0.30, xOhmPerKm: 0.35, bMuSPerKm: 0, ratingMVA: 20,
      },
    ],
    transformers: [],
    generators: [
      {
        id: 'gen-1', name: 'G1', busId: genBusId, generatorType: 'hydro_francis',
        ratedMVA: 10, ratedKV: 22, powerFactor: 0.90,
        xdSubtransientPU: 0.15, xdTransientPU: 0.20, xdSteadyStatePU: 1.0,
        pSetMW: 8, qMaxMVAr: 5, qMinMVAr: -2,
      },
    ],
    compensators: [], protections: [],
    results: {},
    canvas: { zoom: 1, panX: 0, panY: 0 },
  };
}

describe('calcZThevenin — Thevenin-impedans fra Z-buss', () => {
  it('fasit: |Z_thevenin| ≈ 11.17 Ω (±0.1 Ω)', () => {
    const proj = makeFasitProject();
    const zTh = calcZThevenin(proj, 'bus-fault');
    expect(zTh).not.toBeNull();
    const mag = Math.sqrt(zTh!.re ** 2 + zTh!.im ** 2);
    expect(mag).toBeCloseTo(11.17, 0);
  });

  it('Re(Z_thevenin) ≈ 3.0 Ω (resistans fra linje)', () => {
    const zTh = calcZThevenin(makeFasitProject(), 'bus-fault');
    expect(zTh!.re).toBeCloseTo(3.0, 0);
  });

  it('Im(Z_thevenin) ≈ 10.76 Ω (generatorreaktans + linjereaktans)', () => {
    const zTh = calcZThevenin(makeFasitProject(), 'bus-fault');
    expect(zTh!.im).toBeCloseTo(10.76, 0);
  });

  it('R/X = 3.0/10.76 ≈ 0.279', () => {
    const zTh = calcZThevenin(makeFasitProject(), 'bus-fault');
    expect(zTh!.re / zTh!.im).toBeCloseTo(0.279, 1);
  });

  it('manglende feilsted-buss gir null', () => {
    expect(calcZThevenin(makeFasitProject(), 'ukjent-buss')).toBeNull();
  });
});

describe('Full kortslutningsberegning — fasit-nett ende til ende', () => {
  it('I′′k3p = 1.252 kA (±0.01 kA)', () => {
    const proj = makeFasitProject();
    const zTh = calcZThevenin(proj, 'bus-fault')!;
    const zkMag = Math.sqrt(zTh.re ** 2 + zTh.im ** 2);
    expect(calcIk3p(zkMag, 22_000)).toBeCloseTo(1.252, 1);
  });

  it('I′′k2p = 1.084 kA (±0.01 kA)', () => {
    const proj = makeFasitProject();
    const zTh = calcZThevenin(proj, 'bus-fault')!;
    const zkMag = Math.sqrt(zTh.re ** 2 + zTh.im ** 2);
    const ik3p = calcIk3p(zkMag, 22_000);
    expect(calcIk2p(ik3p)).toBeCloseTo(1.084, 1);
  });

  it('ip = 2.557 kA (±0.05 kA)', () => {
    const proj = makeFasitProject();
    const zTh = calcZThevenin(proj, 'bus-fault')!;
    const zkMag = Math.sqrt(zTh.re ** 2 + zTh.im ** 2);
    const ik3p = calcIk3p(zkMag, 22_000);
    const rOverX = zTh.re / zTh.im;
    const ip = calcImpact(ik3p, rOverX);
    expect(ip).toBeCloseTo(2.557, 1);
  });
});

describe('calcContributions — bidrag per generator', () => {
  it('ett nettverk med én generator: bidrag ≈ I′′k3p', () => {
    const proj = makeFasitProject();
    const contribs = calcContributions(proj, 'bus-fault');
    expect(contribs).toHaveLength(1);
    expect(contribs[0].ik3pKA).toBeCloseTo(1.252, 1);
    expect(contribs[0].sourceId).toBe('gen-1');
  });
});
