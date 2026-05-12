import type { GmxProject } from '../types/index.js';

function now() {
  return new Date().toISOString();
}

/** Enkel radial: Slack → PV → PQ */
export const SCENARIO_RADIAL: GmxProject = {
  metadata: {
    version: '1.0',
    created: now(),
    modified: now(),
    student: '',
    school: 'Malakoff Videregående skole',
    course: '00TE13I',
    projectName: 'S1: Enkel radial',
    description: 'Trebusskjema med Slack, PV og PQ. Startpunkt for lastflytanalyse.',
  },
  system: { sBaseMVA: 100, fHz: 50, uBaseKV: { 22: 22 } },
  buses: [
    { id: 'b1', name: 'Slack', type: 'slack', voltageKV: 22, loadMW: 0, loadMVAr: 0, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 100, y: 200 } },
    { id: 'b2', name: 'Generator', type: 'PV', voltageKV: 22, loadMW: 0, loadMVAr: 0, genMW: 5, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 300, y: 200 } },
    { id: 'b3', name: 'Last', type: 'PQ', voltageKV: 22, loadMW: 8, loadMVAr: 4, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 500, y: 200 } },
  ],
  lines: [
    { id: 'l1', name: 'Linje 1', fromBusId: 'b1', toBusId: 'b2', lineType: 'overhead', lengthKm: 2, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 20 },
    { id: 'l2', name: 'Linje 2', fromBusId: 'b2', toBusId: 'b3', lineType: 'overhead', lengthKm: 3, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 20 },
  ],
  transformers: [],
  generators: [
    { id: 'g1', name: 'Vannkraftverk', busId: 'b2', generatorType: 'hydro_francis', ratedMVA: 10, ratedKV: 6.6, powerFactor: 0.9, xdSubtransientPU: 0.15, xdTransientPU: 0.20, xdSteadyStatePU: 1.0, pSetMW: 5, qMaxMVAr: 4, qMinMVAr: -2 },
  ],
  compensators: [],
  protections: [],
  results: {},
  canvas: { zoom: 1, panX: 0, panY: 0 },
};

/** Ringnett 3-buss */
export const SCENARIO_RING: GmxProject = {
  metadata: {
    version: '1.0',
    created: now(),
    modified: now(),
    student: '',
    school: 'Malakoff Videregående skole',
    course: '00TE13I',
    projectName: 'S3: Ringnett 3-buss',
    description: 'Trekantformet ringnett med N-1 redundans. Lær om strømfordeling og nullpunktet i ringet.',
  },
  system: { sBaseMVA: 100, fHz: 50, uBaseKV: { 22: 22 } },
  buses: [
    { id: 'b1', name: 'Slack', type: 'slack', voltageKV: 22, loadMW: 0, loadMVAr: 0, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 300, y: 100 } },
    { id: 'b2', name: 'Last A', type: 'PQ', voltageKV: 22, loadMW: 6, loadMVAr: 3, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 150, y: 320 } },
    { id: 'b3', name: 'Last B', type: 'PQ', voltageKV: 22, loadMW: 4, loadMVAr: 2, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 450, y: 320 } },
  ],
  lines: [
    { id: 'l1', name: 'Ring Slack→A', fromBusId: 'b1', toBusId: 'b2', lineType: 'overhead', lengthKm: 3, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 20 },
    { id: 'l2', name: 'Ring Slack→B', fromBusId: 'b1', toBusId: 'b3', lineType: 'overhead', lengthKm: 3, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 20 },
    { id: 'l3', name: 'Ring A→B', fromBusId: 'b2', toBusId: 'b3', lineType: 'overhead', lengthKm: 2, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 20 },
  ],
  transformers: [],
  generators: [],
  compensators: [],
  protections: [],
  results: {},
  canvas: { zoom: 1, panX: 0, panY: 0 },
};

/** Trafo + lavspent distribusjonsnett */
export const SCENARIO_TRAFO: GmxProject = {
  metadata: {
    version: '1.0',
    created: now(),
    modified: now(),
    student: '',
    school: 'Malakoff Videregående skole',
    course: '00TE13I',
    projectName: 'S4: Trafo + lavspent',
    description: '22 kV høyspentside → 0.4 kV lavspentside via 315 kVA trafo. Lær om spenningsfall på lavspent.',
  },
  system: { sBaseMVA: 100, fHz: 50, uBaseKV: { 22: 22, 0.4: 0.4 } },
  buses: [
    { id: 'b1', name: 'Nett 22kV', type: 'slack', voltageKV: 22, loadMW: 0, loadMVAr: 0, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 100, y: 200 } },
    { id: 'b2', name: 'LS 0.4kV', type: 'PQ', voltageKV: 0.4, loadMW: 0.1, loadMVAr: 0.05, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 350, y: 200 } },
    { id: 'b3', name: 'Bolig A', type: 'PQ', voltageKV: 0.4, loadMW: 0.05, loadMVAr: 0.02, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 550, y: 100 } },
    { id: 'b4', name: 'Bolig B', type: 'PQ', voltageKV: 0.4, loadMW: 0.06, loadMVAr: 0.03, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 550, y: 300 } },
  ],
  lines: [
    { id: 'l1', name: 'Kabel A', fromBusId: 'b2', toBusId: 'b3', lineType: 'cable', lengthKm: 0.1, rOhmPerKm: 0.206, xOhmPerKm: 0.106, bMuSPerKm: 160, ratingMVA: 0.5 },
    { id: 'l2', name: 'Kabel B', fromBusId: 'b2', toBusId: 'b4', lineType: 'cable', lengthKm: 0.15, rOhmPerKm: 0.206, xOhmPerKm: 0.106, bMuSPerKm: 160, ratingMVA: 0.5 },
  ],
  transformers: [
    { id: 't1', name: 'Distribusjonstrafo 315 kVA', fromBusId: 'b1', toBusId: 'b2', ratedMVA: 0.315, voltageHV_kV: 22, voltageLV_kV: 0.4, vectorGroup: 'Dyn11', ekPercent: 4.0, rrPercent: 1.0, noLoadLossKW: 0.5, loadLossKW: 3.5, noLoadCurrentPercent: 1.5, tapMin: -5, tapMax: 5, tapStep: 1, tapCurrent: 0 },
  ],
  generators: [],
  compensators: [],
  protections: [],
  results: {},
  canvas: { zoom: 1, panX: 0, panY: 0 },
};

/** Vannkraft + vindkraft mikronett */
export const SCENARIO_HYDRO_WIND: GmxProject = {
  metadata: {
    version: '1.0',
    created: now(),
    modified: now(),
    student: '',
    school: 'Malakoff Videregående skole',
    course: '00TE13I',
    projectName: 'S5: Vannkraft + vindkraft',
    description: 'Mikronett med vannkraft og vindkraft. Lær om tidsserie-simulering og energibalanse over 24 timer.',
  },
  system: { sBaseMVA: 100, fHz: 50, uBaseKV: { 11: 11 } },
  buses: [
    { id: 'b1', name: 'Slack', type: 'slack', voltageKV: 11, loadMW: 0, loadMVAr: 0, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 300, y: 150 } },
    { id: 'b2', name: 'Vannkraft', type: 'PV', voltageKV: 11, loadMW: 0, loadMVAr: 0, genMW: 5, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 100, y: 300 } },
    { id: 'b3', name: 'Vindpark', type: 'PV', voltageKV: 11, loadMW: 0, loadMVAr: 0, genMW: 3, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 500, y: 300 } },
    { id: 'b4', name: 'Last', type: 'PQ', voltageKV: 11, loadMW: 6, loadMVAr: 3, vSetPU: 1.0, vMaxPU: 1.05, vMinPU: 0.95, position: { x: 300, y: 400 } },
  ],
  lines: [
    { id: 'l1', name: 'Hydro→Slack', fromBusId: 'b2', toBusId: 'b1', lineType: 'overhead', lengthKm: 2, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 15 },
    { id: 'l2', name: 'Vind→Slack', fromBusId: 'b3', toBusId: 'b1', lineType: 'overhead', lengthKm: 2, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 10 },
    { id: 'l3', name: 'Slack→Last', fromBusId: 'b1', toBusId: 'b4', lineType: 'overhead', lengthKm: 1, rOhmPerKm: 0.3, xOhmPerKm: 0.35, bMuSPerKm: 2.8, ratingMVA: 20 },
  ],
  transformers: [],
  generators: [
    { id: 'g1', name: 'Vannkraftverk 5 MW', busId: 'b2', generatorType: 'hydro_francis', ratedMVA: 6, ratedKV: 6.6, powerFactor: 0.9, xdSubtransientPU: 0.15, xdTransientPU: 0.20, xdSteadyStatePU: 1.0, pSetMW: 5, qMaxMVAr: 3, qMinMVAr: -2 },
    { id: 'g2', name: 'Vindpark 3 MW', busId: 'b3', generatorType: 'wind', ratedMVA: 4, ratedKV: 0.69, powerFactor: 0.95, xdSubtransientPU: 0.15, xdTransientPU: 0.20, xdSteadyStatePU: 1.0, pSetMW: 3, qMaxMVAr: 2, qMinMVAr: -1, windRatedMW: 3, numTurbines: 2, cutInMs: 3, ratedWindMs: 12, cutOutMs: 25 },
  ],
  compensators: [],
  protections: [],
  results: {},
  canvas: { zoom: 1, panX: 0, panY: 0 },
};

export interface ScenarioMeta {
  id: string;
  name: string;
  description: string;
  goals: string[];
  expectedResult: string;
  project: GmxProject;
  icon: string;
  difficulty: 'Grunnleggende' | 'Middels' | 'Avansert';
}

export const ALL_SCENARIOS: ScenarioMeta[] = [
  {
    id: 'radial',
    name: 'S1: Enkel radial',
    icon: '⚡',
    difficulty: 'Grunnleggende',
    description: 'Trebusskjema med Slack, PV og PQ-buss. Startpunkt for lastflytanalyse.',
    goals: ['Kjøre Newton-Raphson lastflyt', 'Tolke spenningsresultat per buss', 'Forstå effektbalanse'],
    expectedResult: 'Konvergert NR på 3–5 iterasjoner. U_Last ≈ 0.97–0.99 pu.',
    project: SCENARIO_RADIAL,
  },
  {
    id: 'ring',
    name: 'S3: Ringnett 3-buss',
    icon: '⭕',
    difficulty: 'Middels',
    description: 'Trekantringnett med to lastbusser. Bruk Ringnett-verktøyet til å se strømdeling.',
    goals: ['Beregne strømfordeling i ringnett', 'Finne nullpunktet', 'Sammenligne radial vs. ring'],
    expectedResult: 'Last A får strøm fra begge sider. Ringnet gir N-1 redundans.',
    project: SCENARIO_RING,
  },
  {
    id: 'trafo',
    name: 'S4: Trafo + lavspent',
    icon: '🔌',
    difficulty: 'Middels',
    description: '22/0.4 kV distribusjonsnett med Dyn11-trafo og to husholdningslaster på lavspent.',
    goals: ['Forstå to-nivå-nett (22 kV og 0.4 kV)', 'Beregne spenningsfall på lavspent', 'Dimensjonere kabel'],
    expectedResult: 'ΔU på lavspent ≈ 2–4 %. Spenning ved Bolig A/B ≈ 0.96–0.98 pu.',
    project: SCENARIO_TRAFO,
  },
  {
    id: 'hydro-wind',
    name: 'S5: Vannkraft + vindkraft',
    icon: '🌬',
    difficulty: 'Avansert',
    description: 'Mikronett med 5 MW vannkraft og 3 MW vindpark. Kjør tidsserie for å se energibalanse.',
    goals: ['Forstå kombinasjon av regulerbar og ikke-regulerbar kraft', 'Kjøre 24t tidsserie', 'Vurdere over-/underskudd'],
    expectedResult: 'Natt: overskudd pga. vind. Dag: sol+ vind dekker last. Vannkraft regulerer.',
    project: SCENARIO_HYDRO_WIND,
  },
];
