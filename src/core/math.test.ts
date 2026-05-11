import { describe, it, expect } from 'vitest';
import { cadd, csub, cmul, cdiv, cabs, carg, cconj, cpolar } from './math.js';
import type { Complex } from '../types/index.js';

const EPSILON = 1e-10;
const near = (a: number, b: number) => Math.abs(a - b) < EPSILON;

describe('cadd', () => {
  it('adds real and imaginary parts separately', () => {
    const r = cadd([1, 2], [3, 4]);
    expect(r).toEqual([4, 6]);
  });
  it('adding zero returns same value', () => {
    const r = cadd([5, -3], [0, 0]);
    expect(r).toEqual([5, -3]);
  });
});

describe('csub', () => {
  it('subtracts real and imaginary parts', () => {
    const r = csub([5, 6], [2, 4]);
    expect(r).toEqual([3, 2]);
  });
  it('subtracting self gives zero', () => {
    const r = csub([3, 7], [3, 7]);
    expect(r).toEqual([0, 0]);
  });
});

describe('cmul', () => {
  it('multiplies (1+j)(1+j) = 2j', () => {
    const r = cmul([1, 1], [1, 1]);
    expect(r).toEqual([0, 2]);
  });
  it('multiplies by conjugate gives real result', () => {
    const a: Complex = [3, 4];
    const r = cmul(a, cconj(a));
    // (3+4j)(3-4j) = 9+16 = 25
    expect(r[0]).toBeCloseTo(25);
    expect(r[1]).toBeCloseTo(0);
  });
});

describe('cdiv', () => {
  it('divides (4+2j)/(1+1j) = (3-1j)', () => {
    const r = cdiv([4, 2], [1, 1]);
    expect(r[0]).toBeCloseTo(3);
    expect(r[1]).toBeCloseTo(-1);
  });
  it('throws on division by zero', () => {
    expect(() => cdiv([1, 2], [0, 0])).toThrow('cdiv: division by zero');
  });
});

describe('cabs', () => {
  it('3-4-5 triangle gives magnitude 5', () => {
    expect(cabs([3, 4])).toBeCloseTo(5);
  });
  it('pure real has magnitude equal to absolute value', () => {
    expect(cabs([-7, 0])).toBeCloseTo(7);
  });
});

describe('carg', () => {
  it('positive real axis has angle 0', () => {
    expect(carg([1, 0])).toBeCloseTo(0);
  });
  it('positive imaginary axis has angle π/2', () => {
    expect(carg([0, 1])).toBeCloseTo(Math.PI / 2);
  });
});

describe('cconj', () => {
  it('negates imaginary part', () => {
    expect(cconj([3, 5])).toEqual([3, -5]);
  });
  it('double conjugate returns original', () => {
    const a: Complex = [2, -7];
    expect(cconj(cconj(a))).toEqual(a);
  });
});

describe('cpolar', () => {
  it('unit vector at 0 gives [1, 0]', () => {
    const r = cpolar(1, 0);
    expect(near(r[0], 1)).toBe(true);
    expect(near(r[1], 0)).toBe(true);
  });
  it('unit vector at π/2 gives [0, 1]', () => {
    const r = cpolar(1, Math.PI / 2);
    expect(near(r[0], 0)).toBe(true);
    expect(near(r[1], 1)).toBe(true);
  });
  it('round-trip cabs(cpolar(r,θ)) == r', () => {
    const r = 5;
    expect(cabs(cpolar(r, 1.23))).toBeCloseTo(r);
  });
});
