import { create } from 'zustand';
import type {
  GmxProject,
  Bus,
  Line,
  Transformer,
  Generator,
  Compensator,
  Protection,
  CompensationResult,
} from '../types/index.js';
import { runNewtonRaphson } from '../core/newton-raphson.js';
import { calcCompensation } from '../core/compensation.js';

export type PowerFlowStatus = 'idle' | 'running' | 'converged' | 'failed';
export type CompensationStatus = 'idle' | 'computing' | 'done' | 'failed';

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

interface NetworkState {
  project: GmxProject;
  powerFlowStatus: PowerFlowStatus;
  compensationStatus: CompensationStatus;
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
  removeGenerator: (id: string) => void;

  // Compensator actions
  addCompensator: (c: Compensator) => void;
  removeCompensator: (id: string) => void;

  // Protection actions
  addProtection: (p: Protection) => void;
  removeProtection: (id: string) => void;

  // Project-level actions
  loadProject: (p: GmxProject) => void;
  clearProject: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  project: emptyProject(),
  powerFlowStatus: 'idle',
  compensationStatus: 'idle',

  runPowerFlow: () => {
    set({ powerFlowStatus: 'running' });
    try {
      const result = runNewtonRaphson(get().project);
      set((s) => ({
        powerFlowStatus: result.converged ? 'converged' : 'failed',
        project: {
          ...s.project,
          results: { ...s.project.results, powerFlow: result },
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

  loadProject: (p) => set({ project: p }),

  clearProject: () => set({ project: emptyProject() }),
}));
