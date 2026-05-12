import { create } from 'zustand';
import type {
  GmxProject,
  Bus,
  BusType,
  Line,
  LineType,
  Transformer,
  Generator,
  Compensator,
  Protection,
  CompensationResult,
  ValidationResult,
} from '../types/index.js';
import { runNewtonRaphson } from '../core/newton-raphson.js';
import { calcCompensation } from '../core/compensation.js';
import { validateNetwork as _validateNetwork } from '../validation/network-validator.js';

export type PowerFlowStatus = 'idle' | 'running' | 'converged' | 'failed';
export type CompensationStatus = 'idle' | 'computing' | 'done' | 'failed';

export type PlacingMode =
  | { kind: 'bus'; busType: BusType }
  | { kind: 'line'; lineType: LineType }
  | { kind: 'transformer' }
  | { kind: 'generator' }
  | { kind: 'compensator' }
  | null;

function now(): string {
  return new Date().toISOString();
}

function emptyProject(): GmxProject {
  return {
    metadata: {
      version: '1.0',
      created: now(),
      modified: now(),
      student: '',
      school: 'Malakoff Videregående skole',
      course: '00TE13I',
      projectName: 'Nytt prosjekt',
    },
    system: {
      sBaseMVA: 100,
      fHz: 50,
      uBaseKV: { 22: 22, 0.4: 0.4 },
    },
    buses: [],
    lines: [],
    transformers: [],
    generators: [],
    compensators: [],
    protections: [],
    results: {},
    canvas: { zoom: 1, panX: 0, panY: 0 },
  };
}

function defaultBus(type: BusType, x: number, y: number): Bus {
  const id = crypto.randomUUID();
  const base: Bus = {
    id,
    name: type === 'slack' ? 'Slack' : type === 'PV' ? 'Gen' : 'Last',
    type,
    voltageKV: 22,
    loadMW: type === 'PQ' ? 1.0 : 0,
    loadMVAr: type === 'PQ' ? 0.5 : 0,
    genMW: type !== 'PQ' ? 5.0 : undefined,
    vSetPU: 1.0,
    vMaxPU: 1.05,
    vMinPU: 0.95,
    position: { x, y },
  };
  return base;
}

function defaultLine(fromId: string, toId: string, lineType: LineType, idx: number): Line {
  const isOverhead = lineType === 'overhead';
  return {
    id: crypto.randomUUID(),
    name: `Linje ${idx}`,
    fromBusId: fromId,
    toBusId: toId,
    lineType,
    lengthKm: 1.0,
    rOhmPerKm: isOverhead ? 0.30 : 0.206,
    xOhmPerKm: isOverhead ? 0.35 : 0.106,
    bMuSPerKm: isOverhead ? 2.8 : 160,
    ratingMVA: 10,
  };
}

function defaultTransformer(fromId: string, toId: string, idx: number): Transformer {
  return {
    id: crypto.randomUUID(),
    name: `Trafo ${idx}`,
    fromBusId: fromId,
    toBusId: toId,
    ratedMVA: 0.315,
    voltageHV_kV: 22,
    voltageLV_kV: 0.4,
    vectorGroup: 'Dyn11',
    ekPercent: 4.0,
    rrPercent: 1.0,
    noLoadLossKW: 0.5,
    loadLossKW: 3.5,
    noLoadCurrentPercent: 1.5,
    tapMin: -5,
    tapMax: 5,
    tapStep: 1,
    tapCurrent: 0,
  };
}

function defaultGenerator(busId: string, idx: number): Generator {
  return {
    id: crypto.randomUUID(),
    name: `Generator ${idx}`,
    busId,
    generatorType: 'hydro_francis',
    ratedMVA: 10,
    ratedKV: 6.6,
    powerFactor: 0.90,
    xdSubtransientPU: 0.15,
    xdTransientPU: 0.20,
    xdSteadyStatePU: 1.0,
    pSetMW: 5.0,
    qMaxMVAr: 5.0,
    qMinMVAr: -2.0,
  };
}


interface NetworkState {
  project: GmxProject;
  powerFlowStatus: PowerFlowStatus;
  compensationStatus: CompensationStatus;
  showResults: boolean;
  showCompensationResults: boolean;

  // Builder state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  lineDrawingMode: LineType | null;
  lineDrawingFromId: string | null;
  placingMode: PlacingMode;
  validationResult: ValidationResult | null;

  setShowResults: (v: boolean) => void;
  setShowCompensationResults: (v: boolean) => void;

  // Selection
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setLineDrawingMode: (mode: LineType | null) => void;
  setLineDrawingFromId: (id: string | null) => void;
  setPlacingMode: (mode: PlacingMode) => void;

  runPowerFlow: () => void;
  runCompensation: (busId: string, cosPhi2: number, steps: number) => void;

  // Bus actions
  addBus: (bus: Bus) => void;
  removeBus: (id: string) => void;
  updateBus: (id: string, patch: Partial<Bus>) => void;

  // Line actions
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  updateLine: (id: string, patch: Partial<Line>) => void;

  // Transformer actions
  addTransformer: (t: Transformer) => void;
  removeTransformer: (id: string) => void;
  updateTransformer: (id: string, patch: Partial<Transformer>) => void;

  // Generator actions
  addGenerator: (g: Generator) => void;
  updateGenerator: (id: string, patch: Partial<Generator>) => void;
  removeGenerator: (id: string) => void;

  // Compensator actions
  addCompensator: (c: Compensator) => void;
  removeCompensator: (id: string) => void;

  // Protection actions
  addProtection: (p: Protection) => void;
  removeProtection: (id: string) => void;

  // Builder actions
  addBusAtPosition: (type: BusType, x: number, y: number) => string;
  addLineFromConnect: (fromId: string, toId: string, lineType: LineType) => string;
  addTransformerFromConnect: (fromId: string, toId: string) => string;
  addGeneratorToBus: (busId: string) => string;
  addCompensatorToBus: (busId: string) => string;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  validateNetwork: () => ValidationResult;

  // Project-level actions
  loadProject: (p: GmxProject) => void;
  clearProject: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  project: emptyProject(),
  powerFlowStatus: 'idle',
  compensationStatus: 'idle',
  showResults: false,
  showCompensationResults: false,

  selectedNodeId: null,
  selectedEdgeId: null,
  lineDrawingMode: null,
  lineDrawingFromId: null,
  placingMode: null,
  validationResult: null,

  setShowResults: (v) => set({ showResults: v }),
  setShowCompensationResults: (v) => set({ showCompensationResults: v }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setLineDrawingMode: (mode) => set({ lineDrawingMode: mode, lineDrawingFromId: null }),
  setLineDrawingFromId: (id) => set({ lineDrawingFromId: id }),
  setPlacingMode: (mode) => set({ placingMode: mode }),

  runPowerFlow: () => {
    const result = _validateNetwork(get().project);
    set({ validationResult: result });
    if (!result.valid) return;

    set({ powerFlowStatus: 'running' });
    try {
      const pfResult = runNewtonRaphson(get().project);
      set((s) => ({
        powerFlowStatus: pfResult.converged ? 'converged' : 'failed',
        showResults: true,
        project: {
          ...s.project,
          results: { ...s.project.results, powerFlow: pfResult },
          metadata: { ...s.project.metadata, modified: now() },
        },
      }));
    } catch {
      set({ powerFlowStatus: 'failed' });
    }
  },

  runCompensation: (busId, cosPhi2, steps) => {
    const { project } = get();
    const bus = project.buses.find((b) => b.id === busId);
    if (!bus) return;

    const connectedLine = project.lines.find(
      (l) => l.fromBusId === busId || l.toBusId === busId,
    );
    const rTotal = connectedLine
      ? connectedLine.rOhmPerKm * connectedLine.lengthKm
      : 0;

    const pMW = bus.loadMW;
    const q1MVAr = bus.loadMVAr;
    const sMVA = Math.sqrt(pMW ** 2 + q1MVAr ** 2);
    const cosPhi1 = sMVA > 0 ? pMW / sMVA : 1;

    const calc = calcCompensation(pMW, cosPhi1, cosPhi2, bus.voltageKV, rTotal, steps);
    const ts = now();

    const compensatorId =
      project.compensators.find((c) => c.busId === busId)?.id ??
      crypto.randomUUID();

    const compensator: Compensator = {
      id: compensatorId,
      name: `Q_komp ${bus.name}`,
      busId,
      type: 'capacitor',
      totalMVAr: calc.qKompMVAr,
      steps,
      stepSizeMVAr: calc.qKompMVAr / steps,
      stepsEnabled: steps,
    };

    const compResult: CompensationResult = {
      timestamp: ts,
      busId,
      before: {
        pMW,
        qMVAr: q1MVAr,
        sMVA,
        cosPhi: cosPhi1,
        phi1Deg: calc.phi1Deg,
        lineCurrentA: calc.i1A,
        lineLossesMW: calc.pLoss1W / 1e6,
      },
      after: {
        qKompMVAr: calc.qKompMVAr,
        qResidualMVAr: calc.q2MVAr,
        sMVA: calc.s2MVA,
        cosPhi: calc.cosPhi2Actual,
        phi2Deg: calc.phi2Deg,
        lineCurrentA: calc.i2A,
        lineLossesMW: calc.pLoss2W / 1e6,
      },
      currentReductionPercent: calc.currentReductionPct,
      lossReductionPercent: calc.lossReductionPct,
    };

    const updatedBuses = project.buses.map((b) =>
      b.id === busId ? { ...b, loadMVAr: Math.max(0, calc.q2MVAr) } : b,
    );
    const updatedCompensators = project.compensators.find((c) => c.id === compensatorId)
      ? project.compensators.map((c) => (c.id === compensatorId ? compensator : c))
      : [...project.compensators, compensator];
    const prevComp = project.results.compensation ?? [];
    const updatedCompResults = [
      ...prevComp.filter((r) => r.busId !== busId),
      compResult,
    ];

    set((s) => ({
      compensationStatus: 'computing',
      powerFlowStatus: 'running',
      project: {
        ...s.project,
        buses: updatedBuses,
        compensators: updatedCompensators,
        results: {
          ...s.project.results,
          compensation: updatedCompResults,
        },
        metadata: { ...s.project.metadata, modified: ts },
      },
    }));

    try {
      const pfResult = runNewtonRaphson(get().project);
      set((s) => ({
        compensationStatus: 'done',
        powerFlowStatus: pfResult.converged ? 'converged' : 'failed',
        showResults: true,
        showCompensationResults: true,
        project: {
          ...s.project,
          results: { ...s.project.results, powerFlow: pfResult },
          metadata: { ...s.project.metadata, modified: ts },
        },
      }));
    } catch {
      set({ compensationStatus: 'failed', powerFlowStatus: 'failed' });
    }
  },

  addBus: (bus) =>
    set((s) => ({
      project: {
        ...s.project,
        buses: [...s.project.buses, bus],
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  removeBus: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        buses: s.project.buses.filter((b) => b.id !== id),
        lines: s.project.lines.filter(
          (l) => l.fromBusId !== id && l.toBusId !== id
        ),
        transformers: s.project.transformers.filter(
          (t) => t.fromBusId !== id && t.toBusId !== id
        ),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  updateBus: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        buses: s.project.buses.map((b) =>
          b.id === id ? { ...b, ...patch } : b
        ),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  addLine: (line) =>
    set((s) => ({
      project: {
        ...s.project,
        lines: [...s.project.lines, line],
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  removeLine: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        lines: s.project.lines.filter((l) => l.id !== id),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  updateLine: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        lines: s.project.lines.map((l) =>
          l.id === id ? { ...l, ...patch } : l
        ),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  addTransformer: (t) =>
    set((s) => ({
      project: {
        ...s.project,
        transformers: [...s.project.transformers, t],
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  removeTransformer: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        transformers: s.project.transformers.filter((t) => t.id !== id),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  updateTransformer: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        transformers: s.project.transformers.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        ),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  addGenerator: (g) =>
    set((s) => ({
      project: {
        ...s.project,
        generators: [...s.project.generators, g],
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  updateGenerator: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        generators: s.project.generators.map((g) => g.id === id ? { ...g, ...patch } : g),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  removeGenerator: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        generators: s.project.generators.filter((g) => g.id !== id),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  addCompensator: (c) =>
    set((s) => ({
      project: {
        ...s.project,
        compensators: [...s.project.compensators, c],
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  removeCompensator: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        compensators: s.project.compensators.filter((c) => c.id !== id),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  addProtection: (p) =>
    set((s) => ({
      project: {
        ...s.project,
        protections: [...s.project.protections, p],
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  removeProtection: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        protections: s.project.protections.filter((p) => p.id !== id),
        metadata: { ...s.project.metadata, modified: now() },
      },
    })),

  // --- Builder actions ---

  addBusAtPosition: (type, x, y) => {
    const bus = defaultBus(type, x, y);
    set((s) => ({
      project: {
        ...s.project,
        buses: [...s.project.buses, bus],
        metadata: { ...s.project.metadata, modified: now() },
      },
      selectedNodeId: bus.id,
      selectedEdgeId: null,
      placingMode: null,
    }));
    return bus.id;
  },

  addLineFromConnect: (fromId, toId, lineType) => {
    const { project } = get();
    const line = defaultLine(fromId, toId, lineType, project.lines.length + 1);
    set((s) => ({
      project: {
        ...s.project,
        lines: [...s.project.lines, line],
        metadata: { ...s.project.metadata, modified: now() },
      },
      selectedEdgeId: line.id,
      selectedNodeId: null,
      lineDrawingMode: null,
      lineDrawingFromId: null,
    }));
    return line.id;
  },

  addTransformerFromConnect: (fromId, toId) => {
    const { project } = get();
    const t = defaultTransformer(fromId, toId, project.transformers.length + 1);
    set((s) => ({
      project: {
        ...s.project,
        transformers: [...s.project.transformers, t],
        metadata: { ...s.project.metadata, modified: now() },
      },
      selectedEdgeId: t.id,
      selectedNodeId: null,
    }));
    return t.id;
  },

  addGeneratorToBus: (busId) => {
    const { project } = get();
    const g = defaultGenerator(busId, project.generators.length + 1);
    set((s) => ({
      project: {
        ...s.project,
        generators: [...s.project.generators, g],
        metadata: { ...s.project.metadata, modified: now() },
      },
    }));
    return g.id;
  },

  addCompensatorToBus: (busId) => {
    const { project } = get();
    const c: Compensator = {
      id: crypto.randomUUID(),
      name: `Kondensator ${project.compensators.length + 1}`,
      busId,
      type: 'capacitor',
      totalMVAr: 1.0,
      steps: 3,
      stepSizeMVAr: 1.0 / 3,
      stepsEnabled: 3,
    };
    set((s) => ({
      project: {
        ...s.project,
        compensators: [...s.project.compensators, c],
        metadata: { ...s.project.metadata, modified: now() },
      },
      selectedNodeId: `comp_${c.id}`,
      selectedEdgeId: null,
      placingMode: null,
    }));
    return c.id;
  },

  deleteNode: (id) => {
    if (id.startsWith('comp_')) {
      const compId = id.slice(5);
      set((s) => ({
        project: {
          ...s.project,
          compensators: s.project.compensators.filter((c) => c.id !== compId),
          metadata: { ...s.project.metadata, modified: now() },
        },
        selectedNodeId: null,
      }));
    } else {
      // Bus node
      set((s) => ({
        project: {
          ...s.project,
          buses: s.project.buses.filter((b) => b.id !== id),
          lines: s.project.lines.filter((l) => l.fromBusId !== id && l.toBusId !== id),
          transformers: s.project.transformers.filter((t) => t.fromBusId !== id && t.toBusId !== id),
          metadata: { ...s.project.metadata, modified: now() },
        },
        selectedNodeId: null,
      }));
    }
  },

  deleteEdge: (id) => {
    const { project } = get();
    const isLine = project.lines.some((l) => l.id === id);
    if (isLine) {
      set((s) => ({
        project: {
          ...s.project,
          lines: s.project.lines.filter((l) => l.id !== id),
          metadata: { ...s.project.metadata, modified: now() },
        },
        selectedEdgeId: null,
      }));
    } else {
      set((s) => ({
        project: {
          ...s.project,
          transformers: s.project.transformers.filter((t) => t.id !== id),
          metadata: { ...s.project.metadata, modified: now() },
        },
        selectedEdgeId: null,
      }));
    }
  },

  validateNetwork: () => {
    const result = _validateNetwork(get().project);
    set({ validationResult: result });
    return result;
  },

  loadProject: (p) => set({ project: p, validationResult: null }),

  clearProject: () => set({ project: emptyProject(), validationResult: null, selectedNodeId: null, selectedEdgeId: null }),
}));
