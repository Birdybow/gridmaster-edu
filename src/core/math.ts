import type { Complex } from '../types/index.js';

/** Add two complex numbers: a + b */
export function cadd(a: Complex, b: Complex): Complex {
  return [a[0] + b[0], a[1] + b[1]];
}

/** Subtract two complex numbers: a - b */
export function csub(a: Complex, b: Complex): Complex {
  return [a[0] - b[0], a[1] - b[1]];
}

/** Multiply two complex numbers: a * b */
export function cmul(a: Complex, b: Complex): Complex {
  return [
    a[0] * b[0] - a[1] * b[1],
    a[0] * b[1] + a[1] * b[0],
  ];
}

/** Divide two complex numbers: a / b. Throws if b is zero. */
export function cdiv(a: Complex, b: Complex): Complex {
  const denom = b[0] * b[0] + b[1] * b[1];
  if (denom === 0) throw new Error('cdiv: division by zero');
  return [
    (a[0] * b[0] + a[1] * b[1]) / denom,
    (a[1] * b[0] - a[0] * b[1]) / denom,
  ];
}

/** Magnitude (absolute value) of a complex number */
export function cabs(a: Complex): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

/** Phase angle of a complex number in radians */
export function carg(a: Complex): number {
  return Math.atan2(a[1], a[0]);
}

/** Complex conjugate: (a + jb)* = a - jb */
export function cconj(a: Complex): Complex {
  return [a[0], -a[1]];
}

/** Construct complex number from polar form: r∠θ → (r·cos θ, r·sin θ) */
export function cpolar(r: number, theta: number): Complex {
  return [r * Math.cos(theta), r * Math.sin(theta)];
}
