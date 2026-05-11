import { describe, it, expect } from 'vitest';
import { runNewtonRaphson } from './newton-raphson.js';
import { importLegacyGmx } from '../io/gmx.js';
import s1raw from '../scenarios/Enkel_radial_Kilde_Porsgrunn_til_Last_Skien.json';
import s2raw from '../scenarios/Trestjernenett_Distribusjonsknutepunkt.json';
import s3raw from '../scenarios/trafo_Distribusjon_til_Lavspent.json';

// ---------------------------------------------------------------------------
// Scenario 1: 2-buss radial 22 kV, S_base=10 MVA
// Line: R=3.0 Ω, X=3.5 Ω, P=5 MW, Q=2 MVAr
//
// Analytisk løsning via 2-ordens ligning (kvadratisk metode):
//   |y|²·u² − (|y|² + 2·(P·G + Q·B)) · u + |S|² = 0
//   u = V₂² → V₂ ≈ 0.9520 pu, I ≈ 148 A, ΔU ≈ 4.80 %
//
// NB: Fasit i Sprint2-dok. og scenario-JSON oppgir 133 A / 2.1 % — disse er
// feilaktige håndberegninger. Korrekt NR-resultat er verifisert analytisk og
// er konsistent med physisk S = P+jQ injeksjon. Se DEVLOG beslutning 9.
// ---------------------------------------------------------------------------

const scenario1 = importLegacyGmx(s1raw);
const scenario2 = importLegacyGmx(s2raw);
const scenario3 = importLegacyGmx(s3raw);

describe('Newton-Raphson — Scenario 1: 2-buss radial', () => {
  it('konvergerer', () => {
    const result = runNewtonRaphson(scenario1);
    expect(result.converged).toBe(true);
  });

  it('konvergerer på < 10 iterasjoner', () => {
    const result = runNewtonRaphson(scenario1);
    expect(result.iterations).toBeLessThan(10);
  });

  it('buss 2 spenning ≈ 0.952 p.u. (analytisk fasit)', () => {
    const result = runNewtonRaphson(scenario1);
    const bus2 = result.buses.find((b) => b.busId === 'bus_2');
    expect(bus2).toBeDefined();
    expect(bus2!.vMagPU).toBeCloseTo(0.9520, 2);
  });

  it('spenningsfall på buss 2 ≈ 4.8 % (analytisk fasit)', () => {
    const result = runNewtonRaphson(scenario1);
    const bus2 = result.buses.find((b) => b.busId === 'bus_2');
    const dU = (1 - bus2!.vMagPU) * 100;
    expect(dU).toBeCloseTo(4.8, 1);
  });

  it('linjestrøm ≈ 148 A (±5 A)', () => {
    const result = runNewtonRaphson(scenario1);
    const line = result.lines[0];
    const iA = line.currentKA * 1000;
    expect(iA).toBeGreaterThan(143);
    expect(iA).toBeLessThan(153);
  });

  it('aktive tap > 0 (ohm-tap)', () => {
    const result = runNewtonRaphson(scenario1);
    expect(result.totalLossesMW).toBeGreaterThan(0);
  });

  it('iterasjonslogg har ≥ 1 oppføring', () => {
    const result = runNewtonRaphson(scenario1);
    expect(result.iterationLog.length).toBeGreaterThanOrEqual(1);
  });

  it('max mismatch ved konvergens < 1e-4 p.u.', () => {
    const result = runNewtonRaphson(scenario1);
    expect(result.maxMismatchPU).toBeLessThan(1e-4);
  });

  it('slack-buss spenning uendret = 1.0 p.u.', () => {
    const result = runNewtonRaphson(scenario1);
    const slack = result.buses.find((b) => b.busId === 'bus_1');
    expect(slack!.vMagPU).toBeCloseTo(1.0, 6);
  });
});

describe('Newton-Raphson — Scenario 2: Trestjernenett', () => {
  it('konvergerer', () => {
    const result = runNewtonRaphson(scenario2);
    expect(result.converged).toBe(true);
  });

  it('alle PQ-busser har spenning < 1 p.u. (lastede busser)', () => {
    const result = runNewtonRaphson(scenario2);
    const pqBuses = result.buses.filter((b) => b.busId !== 'bus_center');
    for (const b of pqBuses) {
      expect(b.vMagPU).toBeLessThan(1.0);
    }
  });

  it('alle linjer har positiv aktiv effekt fra slack', () => {
    const result = runNewtonRaphson(scenario2);
    for (const l of result.lines) {
      expect(l.pFromMW).toBeGreaterThan(0);
    }
  });

  it('total aktiv last ≈ sum av linjenes effektflyt inn (±tap)', () => {
    const result = runNewtonRaphson(scenario2);
    const totalLoad = scenario2.buses
      .filter((b) => b.type === 'PQ')
      .reduce((s, b) => s + b.loadMW, 0);
    // Total inngående effekt fra slack ≈ totalLoad + tap
    const totalIn = result.lines.reduce((s, l) => s + l.pFromMW, 0);
    expect(totalIn).toBeGreaterThan(totalLoad - 0.1);
    expect(totalIn).toBeLessThan(totalLoad + 1.0); // tap ≤ 1 MW
  });
});

describe('Newton-Raphson — Scenario 3: Trafo 22kV → 0.4kV', () => {
  it('konvergerer', () => {
    const result = runNewtonRaphson(scenario3);
    expect(result.converged).toBe(true);
  });

  it('LS-buss spenning < 1 p.u.', () => {
    const result = runNewtonRaphson(scenario3);
    const ls = result.buses.find((b) => b.busId === 'bus_ls_load');
    expect(ls).toBeDefined();
    expect(ls!.vMagPU).toBeLessThan(1.0);
  });

  it('linje LS har positiv strøm', () => {
    const result = runNewtonRaphson(scenario3);
    const ls = result.lines.find((l) => l.lineId === 'line_ls');
    expect(ls).toBeDefined();
    expect(ls!.currentKA).toBeGreaterThan(0);
  });
});

describe('Newton-Raphson — Jacobian diagonal-tegn', () => {
  // Verifiserer at implementasjonen bruker korrekte fortegn i Jacobi-matrisen
  // ved å sjekke at korreksjonene går i riktig retning (spenning faller for last)
  it('buss 2 delta er negativ (spenning sakker etter slack)', () => {
    const result = runNewtonRaphson(scenario1);
    const bus2 = result.buses.find((b) => b.busId === 'bus_2');
    expect(bus2!.vAngDeg).toBeLessThan(0); // lagging angle under load
  });
});
