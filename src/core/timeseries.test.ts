import { describe, it, expect } from 'vitest';
import {
  calcLoadProfile,
  calcProductionProfile,
  calcEnergyBalance,
  LOAD_PROFILE_PCT,
  WIND_SPEED_PROFILE,
} from './timeseries.js';
import type { Generator } from '../types/index.js';

const HYDRO_GEN: Generator = {
  id: 'g1',
  name: 'Hydro',
  busId: 'b1',
  generatorType: 'hydro_francis',
  ratedMVA: 6,
  ratedKV: 11,
  powerFactor: 0.9,
  xdSubtransientPU: 0.2,
  xdTransientPU: 0.25,
  xdSteadyStatePU: 1.2,
  pSetMW: 5,
  qMaxMVAr: 2,
  qMinMVAr: -2,
};

const SOLAR_GEN: Generator = {
  id: 'g2',
  name: 'Sol',
  busId: 'b2',
  generatorType: 'solar',
  ratedMVA: 2.5,
  ratedKV: 0.4,
  powerFactor: 1.0,
  xdSubtransientPU: 0.1,
  xdTransientPU: 0.1,
  xdSteadyStatePU: 0.1,
  pSetMW: 2,
  qMaxMVAr: 0,
  qMinMVAr: 0,
  solarPeakMW: 2,
};

describe('LOAD_PROFILE_PCT', () => {
  it('has 24 entries', () => {
    expect(LOAD_PROFILE_PCT).toHaveLength(24);
  });

  it('peak at hour 18 (100%)', () => {
    expect(LOAD_PROFILE_PCT[18]).toBe(100);
  });

  it('minimum at hour 4 (27%)', () => {
    expect(LOAD_PROFILE_PCT[4]).toBe(27);
  });
});

describe('WIND_SPEED_PROFILE', () => {
  it('has 24 entries', () => {
    expect(WIND_SPEED_PROFILE).toHaveLength(24);
  });

  it('night wind > day wind (hour 1 > hour 8)', () => {
    expect(WIND_SPEED_PROFILE[1]).toBeGreaterThan(WIND_SPEED_PROFILE[8]);
  });
});

describe('calcLoadProfile', () => {
  const pMax = 10;
  const cosPhi = 0.9;
  const load = calcLoadProfile(pMax, cosPhi);

  it('returns 24 steps', () => {
    expect(load).toHaveLength(24);
  });

  it('kl 12: P_last = 8.5 MW', () => {
    expect(load[12].pMW).toBeCloseTo(8.5, 5);
  });

  it('kl 3: P_last = 2.8 MW', () => {
    expect(load[3].pMW).toBeCloseTo(2.8, 5);
  });

  it('kl 18: P_last = 10 MW (peak)', () => {
    expect(load[18].pMW).toBeCloseTo(10.0, 5);
  });

  it('Q > 0 for cosφ < 1', () => {
    expect(load[12].qMVAr).toBeGreaterThan(0);
  });

  it('Q scales with P', () => {
    const tanPhi = Math.tan(Math.acos(cosPhi));
    expect(load[12].qMVAr).toBeCloseTo(load[12].pMW * tanPhi, 5);
  });
});

describe('calcProductionProfile — fasitsvar', () => {
  // P_max=10, cosφ=0.9, P_hydro=5 MW, P_sol_peak=2 MW
  const load = calcLoadProfile(10, 0.9);
  const production = calcProductionProfile([HYDRO_GEN, SOLAR_GEN]);
  const balance = calcEnergyBalance(load, production);

  it('kl 12: Balanse = -1.552 MW (±0.05)', () => {
    expect(balance[12].balance).toBeCloseTo(-1.552, 1);
  });

  it('kl 3: Balanse = +2.2 MW (±0.05)', () => {
    expect(balance[3].balance).toBeCloseTo(2.2, 1);
  });

  it('kl 3: sol = 0 MW (natt)', () => {
    expect(production[3].solar).toBe(0);
  });

  it('kl 12: sol > 0 MW (dag)', () => {
    expect(production[12].solar).toBeGreaterThan(0);
  });

  it('hydro konstant alle timer', () => {
    const hydroVals = production.map((s) => s.hydro);
    expect(Math.max(...hydroVals)).toBeCloseTo(Math.min(...hydroVals), 5);
  });
});

describe('calcProductionProfile — wind', () => {
  const WIND_GEN: Generator = {
    id: 'gw',
    name: 'Vind',
    busId: 'bw',
    generatorType: 'wind',
    ratedMVA: 5,
    ratedKV: 0.69,
    powerFactor: 0.95,
    xdSubtransientPU: 0.15,
    xdTransientPU: 0.2,
    xdSteadyStatePU: 1.0,
    pSetMW: 3,
    qMaxMVAr: 1,
    qMinMVAr: -1,
    windRatedMW: 3,
    numTurbines: 1,
    cutInMs: 3,
    ratedWindMs: 12,
    cutOutMs: 25,
  };

  const prod = calcProductionProfile([WIND_GEN]);

  it('returns 24 steps', () => {
    expect(prod).toHaveLength(24);
  });

  it('wind varies across hours', () => {
    const vals = prod.map((s) => s.wind);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    expect(max).toBeGreaterThan(min);
  });
});

describe('calcEnergyBalance', () => {
  const load = calcLoadProfile(10, 0.9);
  const prod = calcProductionProfile([HYDRO_GEN]);
  const bal = calcEnergyBalance(load, prod);

  it('returns 24 steps', () => {
    expect(bal).toHaveLength(24);
  });

  it('balance = production - load', () => {
    for (const step of bal) {
      expect(step.balance).toBeCloseTo(step.production - step.load, 10);
    }
  });

  it('hour index matches', () => {
    bal.forEach((s, i) => expect(s.hour).toBe(i));
  });
});
