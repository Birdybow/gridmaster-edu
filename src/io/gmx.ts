import type {
  GmxProject,
  Bus,
  Line,
  Transformer,
  VoltageLevel,
  BusType,
  LineType,
  CloudProjectSummary,
} from '../types/index.js';
import { supabase } from '../lib/supabase.js';
import { migrateProject } from './migration.js';
export type { MigrationResult } from './migration.js';
export { needsMigration } from './migration.js';

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

/** Serialise a GmxProject to a .gmx file and trigger browser download. */
export function saveProject(project: GmxProject): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.metadata.projectName ?? 'project'}.gmx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export interface LoadResult {
  project: GmxProject;
  migrated: boolean;
  fromVersion: string;
  toVersion: string;
}

/** Read a .gmx file chosen by the user, migrate if needed, and return result. */
export async function loadProject(file: File): Promise<LoadResult> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);
  const validated = validateProject(raw);
  const migResult = migrateProject(validated);
  return {
    project: migResult.project,
    migrated: migResult.migrated,
    fromVersion: migResult.fromVersion,
    toVersion: migResult.toVersion,
  };
}

/** Load without migration (backwards compat for cloud) */
export async function loadProjectRaw(file: File): Promise<GmxProject> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);
  return validateProject(raw);
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * Validate and narrow unknown JSON data to GmxProject.
 * Throws a descriptive error if any required field is missing or invalid.
 */
export function validateProject(data: unknown): GmxProject {
  if (typeof data !== 'object' || data === null) {
    throw new Error('validateProject: data is not an object');
  }
  const d = data as Record<string, unknown>;

  const required = ['metadata', 'system', 'buses', 'lines', 'transformers'];
  for (const key of required) {
    if (!(key in d)) {
      throw new Error(`validateProject: missing required field "${key}"`);
    }
  }

  const project = data as GmxProject;

  // Ensure optional arrays exist
  if (!Array.isArray(project.generators)) project.generators = [];
  if (!Array.isArray(project.compensators)) project.compensators = [];
  if (!Array.isArray(project.protections)) project.protections = [];
  if (!project.results) project.results = {};
  if (!project.canvas) project.canvas = { zoom: 1, panX: 0, panY: 0 };

  return project;
}

// ---------------------------------------------------------------------------
// Cloud storage (Supabase)
// ---------------------------------------------------------------------------

export async function saveToCloud(project: GmxProject): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      student_name: project.metadata.student,
      project_name: project.metadata.projectName,
      course: project.metadata.course,
      gmx_data: project,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Skylagring feilet: ${error.message}`);
  return data.id as string;
}

export async function loadFromCloud(id: string): Promise<GmxProject> {
  const { data, error } = await supabase
    .from('projects')
    .select('gmx_data')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Lasting fra sky feilet: ${error.message}`);
  if (!data) throw new Error(`Prosjekt ikke funnet: ${id}`);
  return validateProject(data.gmx_data);
}

export async function listCloudProjects(): Promise<CloudProjectSummary[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_name, student_name, course, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Henting av prosjektliste feilet: ${error.message}`);
  if (!data) return [];

  return data.map((r) => ({
    id: r.id as string,
    projectName: r.project_name as string,
    studentName: r.student_name as string,
    course: r.course as string,
    updatedAt: r.updated_at as string,
  }));
}

// ---------------------------------------------------------------------------
// importLegacyGmx — convert Gemini scenario JSON to GmxProject
// ---------------------------------------------------------------------------

type LegacyBus = {
  id: string;
  name?: string;
  type?: string;
  Vn_kV?: number;
  V_pu?: number;
  P_load_MW?: number;
  Q_load_MVAr?: number;
};

type LegacyLine = {
  id: string;
  name?: string;
  from_bus?: string;
  to_bus?: string;
  length_km?: number;
  R_ohm_per_km?: number;
  X_ohm_per_km?: number;
  I_max_A?: number;
};

type LegacyTrafo = {
  id: string;
  name?: string;
  from_bus?: string;
  to_bus?: string;
  Sn_MVA?: number;
  Vn_hv_kV?: number;
  Vn_lv_kV?: number;
  ek_percent?: number;
  Pcu_kW?: number;
};

type LegacySystem = {
  base_MVA?: number;
  frequency?: number;
};

type LegacyCanvasNode = { id: string; position: { x: number; y: number } };

type LegacyCanvas = {
  nodes?: LegacyCanvasNode[];
};

type LegacyDoc = {
  metadata?: { name?: string; description?: string };
  system?: LegacySystem;
  buses?: LegacyBus[];
  lines?: LegacyLine[];
  transformers?: LegacyTrafo[];
  canvas?: LegacyCanvas;
};

function requireField<T>(obj: Record<string, unknown>, field: string, context: string): T {
  if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
    throw new Error(
      `importLegacyGmx: required field "${field}" is missing in ${context}`
    );
  }
  return obj[field] as T;
}

/**
 * Convert a Gemini-format scenario JSON to the canonical GmxProject type.
 * Field mapping documented in GridMaster_Sprint1_v1.1.docx §4.
 */
export function importLegacyGmx(raw: unknown): GmxProject {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('importLegacyGmx: input is not an object');
  }
  const doc = raw as LegacyDoc;

  const sys = doc.system ?? {};
  const sBaseMVA = (sys.base_MVA as number | undefined) ?? 10;
  const fHz = (sys.frequency as number | undefined) ?? 50;

  // Build canvas position lookup
  const posMap = new Map<string, { x: number; y: number }>();
  for (const node of doc.canvas?.nodes ?? []) {
    posMap.set(node.id, node.position);
  }

  // Map buses
  const buses: Bus[] = (doc.buses ?? []).map((b) => {
    const bObj = b as Record<string, unknown>;
    const id = requireField<string>(bObj, 'id', 'bus');
    const rawType = (b.type ?? 'PQ') as string;
    const busType: BusType =
      rawType === 'slack' ? 'slack' : rawType.toUpperCase() === 'PV' ? 'PV' : 'PQ';
    const voltageKV = (b.Vn_kV ?? 22) as VoltageLevel;
    const pos = posMap.get(id) ?? { x: 100, y: 200 };

    return {
      id,
      name: b.name ?? id,
      type: busType,
      voltageKV,
      loadMW: b.P_load_MW ?? 0,
      loadMVAr: b.Q_load_MVAr ?? 0,
      vSetPU: b.V_pu ?? 1.0,
      vMaxPU: 1.1,
      vMinPU: 0.9,
      position: pos,
    };
  });

  // Map lines
  const lines: Line[] = (doc.lines ?? []).map((l) => {
    const lObj = l as Record<string, unknown>;
    const id = requireField<string>(lObj, 'id', 'line');
    const fromBusId = requireField<string>(lObj, 'from_bus', `line ${id}`);
    const toBusId = requireField<string>(lObj, 'to_bus', `line ${id}`);
    const vn = buses.find((b) => b.id === fromBusId)?.voltageKV ?? 22;
    const iMaxA = l.I_max_A ?? 0;
    // ratingMVA = I_max_A * Vn_kV / 1000 * sqrt(3) for 3-phase, simplified here
    const ratingMVA = (iMaxA * vn * Math.sqrt(3)) / 1000;

    return {
      id,
      name: l.name ?? id,
      fromBusId,
      toBusId,
      lineType: 'overhead' as LineType,
      lengthKm: l.length_km ?? 1,
      rOhmPerKm: l.R_ohm_per_km ?? 0,
      xOhmPerKm: l.X_ohm_per_km ?? 0,
      bMuSPerKm: 0,
      ratingMVA,
    };
  });

  // Map transformers
  const transformers: Transformer[] = (doc.transformers ?? []).map((t) => {
    const tObj = t as Record<string, unknown>;
    const id = requireField<string>(tObj, 'id', 'transformer');
    const fromBusId = requireField<string>(tObj, 'from_bus', `transformer ${id}`);
    const toBusId = requireField<string>(tObj, 'to_bus', `transformer ${id}`);

    return {
      id,
      name: t.name ?? id,
      fromBusId,
      toBusId,
      ratedMVA: t.Sn_MVA ?? 1,
      voltageHV_kV: t.Vn_hv_kV ?? 22,
      voltageLV_kV: t.Vn_lv_kV ?? 0.4,
      vectorGroup: 'Dyn11',
      ekPercent: t.ek_percent ?? 4,
      rrPercent: 1,
      noLoadLossKW: 0,
      loadLossKW: t.Pcu_kW ?? 0,
      noLoadCurrentPercent: 0,
      tapMin: -10,
      tapMax: 10,
      tapStep: 2.5,
      tapCurrent: 0,
    };
  });

  const projectName = doc.metadata?.name ?? 'Importert scenario';

  return {
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      student: '',
      school: 'Malakoff Videregående skole',
      course: '00TE13I',
      projectName,
      description: doc.metadata?.description,
    },
    system: {
      sBaseMVA,
      fHz,
      uBaseKV: {},
    },
    buses,
    lines,
    transformers,
    generators: [],
    compensators: [],
    protections: [],
    results: {},
    canvas: { zoom: 1, panX: 0, panY: 0 },
  };
}
