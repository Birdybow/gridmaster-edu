import { calcWind, calcSolar } from './production.js';
import type { Generator } from '../types/index.js';

/** Norwegian typical load profile [% of peak, hours 0-23] */
export const LOAD_PROFILE_PCT = [
  40, 35, 30, 28, 27, 28, 35, 55, 75, 85, 90, 88,
  85, 82, 80, 85, 90, 95, 100, 98, 92, 80, 70, 55,
];

/** Typical diurnal wind speed profile [m/s, hours 0-23] */
export const WIND_SPEED_PROFILE = [
  8, 9, 9, 8, 7, 7, 6, 6, 5, 5, 6, 7,
  7, 6, 6, 7, 8, 9, 9, 8, 8, 9, 9, 8,
];

export interface TimeStep {
  hour: number;
  pMW: number;
  qMVAr: number;
}

export interface ProductionTimeStep {
  hour: number;
  hydro: number;
  wind: number;
  solar: number;
  nuclear: number;
  thermal: number;
  total: number;
}

export interface BalanceStep {
  hour: number;
  production: number;
  load: number;
  balance: number;
}

/**
 * Calculates 24-hour load profile from peak MW and power factor.
 */
export function calcLoadProfile(pMaxMW: number, cosPhi: number): TimeStep[] {
  const tanPhi = Math.tan(Math.acos(cosPhi));
  return LOAD_PROFILE_PCT.map((pct, hour) => {
    const pMW = pMaxMW * pct / 100;
    return { hour, pMW, qMVAr: pMW * tanPhi };
  });
}

/**
 * Calculates 24-hour production profile from all generators.
 * Hydro/nuclear/thermal are constant; wind and solar vary by hour.
 */
export function calcProductionProfile(generators: Generator[]): ProductionTimeStep[] {
  const steps: ProductionTimeStep[] = [];

  for (let hour = 0; hour < 24; hour++) {
    let hydro = 0;
    let wind = 0;
    let solar = 0;
    let nuclear = 0;
    let thermal = 0;

    for (const gen of generators) {
      const type = gen.generatorType;

      if (type === 'hydro_francis' || type === 'hydro_pelton' || type === 'hydro_kaplan') {
        hydro += gen.pSetMW;
      } else if (type === 'wind') {
        const vci = gen.cutInMs ?? 3;
        const vr = gen.ratedWindMs ?? 12;
        const vco = gen.cutOutMs ?? 25;
        const pn = gen.windRatedMW ?? gen.pSetMW;
        const n = gen.numTurbines ?? 1;
        const v = WIND_SPEED_PROFILE[hour];
        wind += calcWind(v, vci, vr, vco, pn, n);
      } else if (type === 'solar') {
        const pPeak = gen.solarPeakMW ?? gen.pSetMW;
        solar += calcSolar(pPeak, hour);
      } else if (type === 'nuclear') {
        const util = (gen.utilizationPct ?? 100) / 100;
        nuclear += gen.pSetMW * util;
      } else if (type === 'thermal') {
        const util = (gen.utilizationPct ?? 100) / 100;
        thermal += gen.pSetMW * util;
      }
    }

    const total = hydro + wind + solar + nuclear + thermal;
    steps.push({ hour, hydro, wind, solar, nuclear, thermal, total });
  }

  return steps;
}

/**
 * Computes energy balance (production - load) for each hour.
 * Positive = surplus, negative = deficit.
 */
export function calcEnergyBalance(
  load: TimeStep[],
  production: ProductionTimeStep[],
): BalanceStep[] {
  return load.map((ls, i) => ({
    hour: ls.hour,
    production: production[i].total,
    load: ls.pMW,
    balance: production[i].total - ls.pMW,
  }));
}
