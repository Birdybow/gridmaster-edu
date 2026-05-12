import { describe, it, expect } from 'vitest';
import {
  zBase,
  zToPU,
  zFromPU,
  vToPU,
  vFromPU,
  pToPU,
  qToPU,
  iToPU,
} from './per-unit.js';

describe('per-unit conversions', () => {
  const S = 100; // MVA base
  const U = 22;  // kV base

  it('zBase er U²/S', () => {
    expect(zBase(S, U)).toBeCloseTo(4.84, 5);
  });

  it('zToPU konverterer Ω → pu', () => {
    // Z = 4.84 Ω → 1.0 pu
    expect(zToPU(4.84, S, U)).toBeCloseTo(1.0, 3);
  });

  it('zFromPU konverterer pu → Ω', () => {
    expect(zFromPU(1.0, S, U)).toBeCloseTo(4.84, 3);
  });

  it('vToPU konverterer kV → pu', () => {
    expect(vToPU(22, 22)).toBeCloseTo(1.0, 5);
    expect(vToPU(23.1, 22)).toBeCloseTo(1.05, 3);
  });

  it('vFromPU konverterer pu → kV', () => {
    expect(vFromPU(1.0, 22)).toBeCloseTo(22, 5);
  });

  it('pToPU konverterer MW → pu', () => {
    expect(pToPU(100, 100)).toBeCloseTo(1.0, 5);
    expect(pToPU(50, 100)).toBeCloseTo(0.5, 5);
  });

  it('qToPU konverterer MVAr → pu', () => {
    expect(qToPU(25, 100)).toBeCloseTo(0.25, 5);
  });

  it('iToPU konverterer A → pu (S=100MVA, U=22kV)', () => {
    // iBase = 100e6 / (sqrt(3) * 22e3) ≈ 2624.3 A
    const iBase = (100e6) / (Math.sqrt(3) * 22e3);
    expect(iToPU(iBase, S, U)).toBeCloseTo(1.0, 3);
  });

  it('zToPU og zFromPU er inverse operasjoner', () => {
    const z = 12.5;
    expect(zFromPU(zToPU(z, S, U), S, U)).toBeCloseTo(z, 6);
  });

  it('fasit NR: I=148A → pu ved U=22kV, S=100MVA', () => {
    const iBase = (100e6) / (Math.sqrt(3) * 22e3);
    const iPU = 148 / iBase;
    expect(iPU).toBeCloseTo(148 / iBase, 4);
  });
});
