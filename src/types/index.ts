// GridMaster Edu — Canonical TypeScript types (datamodell v1.0)
// This file is the single source of truth for all network types.

/** UUID v4 string identifier */
export type GmxId = string;

/** ISO 8601 timestamp string */
export type ISOTimestamp = string;

/** Complex number as [real, imaginary] tuple */
export type Complex = [number, number];

/** Norwegian nominal voltage levels in kV */
export type VoltageLevel = 0.23 | 0.4 | 11 | 22 | 66 | 132 | 300 | 420;

/** Bus type for power flow classification */
export type BusType = 'slack' | 'PV' | 'PQ';

/** Physical line construction type */
export type LineType = 'overhead' | 'cable';

/** Transformer vector group (winding connection) */
export type TransformerVector = 'Dyn11' | 'Yyn0' | 'YNyn0' | 'Yd11' | 'Dd0';

/** Primary energy source type */
export type GeneratorType =
  | 'hydro_francis'
  | 'hydro_pelton'
  | 'hydro_kaplan'
  | 'wind'
  | 'nuclear'
  | 'thermal'
  | 'solar';

/** Neutral earthing method */
export type NeutralTreatment = 'isolated' | 'petersen' | 'solid' | 'resistance';

/** Protective relay function */
export type ProtectionType =
  | 'overcurrent'
  | 'differential'
  | 'distance'
  | 'earth_fault'
  | 'directional';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export interface GmxMetadata {
  version: string;
  created: ISOTimestamp;
  modified: ISOTimestamp;
  student: string;
  school: string;
  course: string;
  projectName: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Per-unit system
// ---------------------------------------------------------------------------

export interface PerUnitSystem {
  sBaseMVA: number;
  fHz: number;
  uBaseKV: Partial<Record<VoltageLevel, number>>;
}

export interface PerUnitValues {
  v: number;
  delta: number;
  p: number;
  q: number;
}

// ---------------------------------------------------------------------------
// Topology
// ---------------------------------------------------------------------------

export interface Bus {
  id: GmxId;
  name: string;
  type: BusType;
  voltageKV: VoltageLevel;
  loadMW: number;
  loadMVAr: number;
  genMW?: number;
  genMVArMax?: number;
  genMVArMin?: number;
  vSetPU: number;
  vMaxPU: number;
  vMinPU: number;
  position: { x: number; y: number };
  neutralTreatment?: NeutralTreatment;
  description?: string;
}

export interface Line {
  id: GmxId;
  name: string;
  fromBusId: GmxId;
  toBusId: GmxId;
  lineType: LineType;
  lengthKm: number;
  rOhmPerKm: number;
  xOhmPerKm: number;
  bMuSPerKm: number;
  ratingMVA: number;
  cableRef?: string;
  spans?: number;
  iceLoadZone?: 1 | 2 | 3;
  description?: string;
}

export interface Transformer {
  id: GmxId;
  name: string;
  fromBusId: GmxId;
  toBusId: GmxId;
  ratedMVA: number;
  voltageHV_kV: number;
  voltageLV_kV: number;
  vectorGroup: TransformerVector;
  ekPercent: number;
  rrPercent: number;
  noLoadLossKW: number;
  loadLossKW: number;
  noLoadCurrentPercent: number;
  tapMin: number;
  tapMax: number;
  tapStep: number;
  tapCurrent: number;
  description?: string;
}

export interface Generator {
  id: GmxId;
  name: string;
  busId: GmxId;
  generatorType: GeneratorType;
  ratedMVA: number;
  ratedKV: number;
  powerFactor: number;
  xdSubtransientPU: number;
  xdTransientPU: number;
  xdSteadyStatePU: number;
  pSetMW: number;
  qMaxMVAr: number;
  qMinMVAr: number;
  headM?: number;
  flowM3s?: number;
  efficiencyPct?: number;
  pvCurve?: Array<{ vMs: number; pKW: number }>;
  cutInMs?: number;
  cutOutMs?: number;
  ratedWindMs?: number;
  description?: string;
}

export interface Compensator {
  id: GmxId;
  name: string;
  busId: GmxId;
  type: 'capacitor' | 'reactor' | 'statcom';
  totalMVAr: number;
  steps: number;
  stepSizeMVAr: number;
  stepsEnabled: number;
  description?: string;
}

export interface Protection {
  id: GmxId;
  name: string;
  busId: GmxId;
  protectedLineId?: GmxId;
  type: ProtectionType;
  pickupCurrentA: number;
  timeDelayS: number;
  instantTrip: boolean;
  instantCurrentA?: number;
  zone1OhmPrimary?: number;
  zone2OhmPrimary?: number;
  zone3OhmPrimary?: number;
  description?: string;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface BusResult {
  busId: GmxId;
  vMagPU: number;
  vAngDeg: number;
  vMagKV: number;
  pMW: number;
  qMVAr: number;
  withinLimits: boolean;
}

export interface LineResult {
  lineId: GmxId;
  fromBusId: GmxId;
  toBusId: GmxId;
  pFromMW: number;
  qFromMVAr: number;
  pToMW: number;
  qToMVAr: number;
  currentKA: number;
  lossesActiveMW: number;
  lossesReactiveMVAr: number;
  loadingPercent: number;
  overloaded: boolean;
}

export interface IterationStep {
  iteration: number;
  maxMismatchP: number;
  maxMismatchQ: number;
  busDeltas: Record<GmxId, { dV: number; dDelta: number }>;
}

export interface PowerFlowResult {
  timestamp: ISOTimestamp;
  converged: boolean;
  iterations: number;
  maxMismatchPU: number;
  totalLossesMW: number;
  totalLossesMVAr: number;
  buses: BusResult[];
  lines: LineResult[];
  iterationLog: IterationStep[];
}

export interface ShortCircuitResult {
  timestamp: ISOTimestamp;
  busId: GmxId;
  faultType: '3phase' | '2phase' | '1phase';
  ik3pMaxKA: number;
  ik2pKA: number;
  ipKA: number;
  ik3pMinKA: number;
  ik1pMinKA: number;
  contributions: Array<{ sourceId: GmxId; ik3pKA: number }>;
  cFactorMax: number;
  cFactorMin: number;
  tempCorrFactor: number;
}

export interface CompensationResult {
  timestamp: ISOTimestamp;
  busId: GmxId;
  before: {
    pMW: number;
    qMVAr: number;
    sMVA: number;
    cosPhi: number;
    phi1Deg: number;
    lineCurrentA: number;
    lineLossesMW: number;
  };
  after: {
    qKompMVAr: number;
    qResidualMVAr: number;
    sMVA: number;
    cosPhi: number;
    phi2Deg: number;
    lineCurrentA: number;
    lineLossesMW: number;
  };
  currentReductionPercent: number;
  lossReductionPercent: number;
}

export interface VoltageDropResult {
  timestamp: ISOTimestamp;
  lineId: GmxId;
  model: 'simple' | 'pi';
  deltaUVolts: number;
  deltaUPercent: number;
  deltaUPU: number;
  uReceivingKV: number;
  withinLimits: boolean;
  renReference: string;
}

// ---------------------------------------------------------------------------
// Builder / Validation
// ---------------------------------------------------------------------------

export interface ValidationMessage {
  code: string;
  message: string;
  type: 'error' | 'warning';
  componentId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

// ---------------------------------------------------------------------------
// Cloud storage
// ---------------------------------------------------------------------------

export interface CloudProjectSummary {
  id: string;
  projectName: string;
  studentName: string;
  course: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Root project file
// ---------------------------------------------------------------------------

export interface GmxProject {
  metadata: GmxMetadata;
  system: PerUnitSystem;
  buses: Bus[];
  lines: Line[];
  transformers: Transformer[];
  generators: Generator[];
  compensators: Compensator[];
  protections: Protection[];
  results: {
    powerFlow?: PowerFlowResult;
    shortCircuit?: ShortCircuitResult[];
    compensation?: CompensationResult[];
    voltageDrop?: VoltageDropResult[];
  };
  canvas: {
    zoom: number;
    panX: number;
    panY: number;
  };
}
