import { describe, it, expect } from 'vitest';
import { getFlowState, getFlowColor, FLOW_COLORS } from './flow-color.js';

describe('flow-color — getFlowState', () => {
  it('idle når currentA = 0', () => {
    expect(getFlowState({ currentA: 0 })).toBe('idle');
  });

  it('idle når |currentA| < 0.1 (terskel)', () => {
    expect(getFlowState({ currentA: 0.05 })).toBe('idle');
    expect(getFlowState({ currentA: -0.05 })).toBe('idle');
  });

  it('normal når currentA > 0 (positiv retning)', () => {
    expect(getFlowState({ currentA: 1 })).toBe('normal');
    expect(getFlowState({ currentA: 100 })).toBe('normal');
  });

  it('reversed når currentA < 0 (negativ retning)', () => {
    expect(getFlowState({ currentA: -1 })).toBe('reversed');
    expect(getFlowState({ currentA: -83 })).toBe('reversed');
  });

  it('opposing når isOpposing=true uansett strømsign (positiv)', () => {
    expect(getFlowState({ currentA: 83, isOpposing: true })).toBe('opposing');
  });

  it('opposing når isOpposing=true uansett strømsign (negativ)', () => {
    expect(getFlowState({ currentA: -83, isOpposing: true })).toBe('opposing');
  });

  it('idle har prioritet over opposing når currentA ≈ 0', () => {
    expect(getFlowState({ currentA: 0, isOpposing: true })).toBe('idle');
  });
});

describe('flow-color — FLOW_COLORS', () => {
  it('normal er grønn #2E7D32', () => {
    expect(FLOW_COLORS.normal).toBe('#2E7D32');
  });

  it('opposing er oransje #F57C00', () => {
    expect(FLOW_COLORS.opposing).toBe('#F57C00');
  });

  it('reversed er rød #C62828', () => {
    expect(FLOW_COLORS.reversed).toBe('#C62828');
  });

  it('idle er grå #90A4AE', () => {
    expect(FLOW_COLORS.idle).toBe('#90A4AE');
  });
});

describe('flow-color — getFlowColor', () => {
  it('returnerer grønn for normal strøm', () => {
    expect(getFlowColor({ currentA: 83 })).toBe('#2E7D32');
  });

  it('returnerer rød for reversed strøm', () => {
    expect(getFlowColor({ currentA: -83 })).toBe('#C62828');
  });

  it('returnerer oransje for opposing strøm', () => {
    expect(getFlowColor({ currentA: 83, isOpposing: true })).toBe('#F57C00');
  });

  it('returnerer grå for idle strøm', () => {
    expect(getFlowColor({ currentA: 0 })).toBe('#90A4AE');
  });
});
