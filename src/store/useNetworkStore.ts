import { create } from 'zustand';
import type {
  GmxProject,
  Bus,
  Line,
  Transformer,
  Generator,
  Compensator,
  Protection,
} from '../types/index.js';

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

export const useNetworkStore = create<NetworkState>((set) => ({
  project: emptyProject(),

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
