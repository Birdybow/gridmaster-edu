import type { GmxProject, ValidationResult, ValidationMessage } from '../types/index.js';

/** Union-Find for connectivity check */
function buildUnionFind(ids: string[]): { find: (a: string) => string; union: (a: string, b: string) => void } {
  const parent: Record<string, string> = {};
  for (const id of ids) parent[id] = id;

  function find(a: string): string {
    if (parent[a] !== a) parent[a] = find(parent[a]);
    return parent[a];
  }

  function union(a: string, b: string) {
    parent[find(a)] = find(b);
  }

  return { find, union };
}

export function validateNetwork(project: GmxProject): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  const { buses, lines, transformers } = project;

  // --- ERRORS ---

  // Ingen slack-buss
  const slackBuses = buses.filter((b) => b.type === 'slack');
  if (buses.length > 0 && slackBuses.length === 0) {
    errors.push({ code: 'NO_SLACK', message: 'Nettet mangler en slack-buss (referansebuss).', type: 'error' });
  }

  // Mer enn én slack-buss
  if (slackBuses.length > 1) {
    errors.push({
      code: 'MULTIPLE_SLACK',
      message: `Nettet har ${slackBuses.length} slack-busser. Kun én er tillatt.`,
      type: 'error',
    });
  }

  // Linje med lengde = 0
  for (const line of lines) {
    if (line.lengthKm <= 0) {
      errors.push({
        code: 'ZERO_LENGTH_LINE',
        message: `Linje "${line.name}" har lengde 0 km.`,
        type: 'error',
        componentId: line.id,
      });
    }
  }

  // Linje mellom busser med ulike spenningsnivåer uten trafo
  for (const line of lines) {
    const fromBus = buses.find((b) => b.id === line.fromBusId);
    const toBus = buses.find((b) => b.id === line.toBusId);
    if (fromBus && toBus && fromBus.voltageKV !== toBus.voltageKV) {
      // Check if there's a transformer between them
      const hasTrafo = transformers.some(
        (t) =>
          (t.fromBusId === line.fromBusId && t.toBusId === line.toBusId) ||
          (t.fromBusId === line.toBusId && t.toBusId === line.fromBusId),
      );
      if (!hasTrafo) {
        errors.push({
          code: 'VOLTAGE_MISMATCH',
          message: `Linje "${line.name}" kobler busser med ulik spenning (${fromBus.voltageKV} kV ↔ ${toBus.voltageKV} kV) uten transformator.`,
          type: 'error',
          componentId: line.id,
        });
      }
    }
  }

  // Isolert node (ikke koblet til resten av nettet)
  if (buses.length > 1) {
    const allIds = buses.map((b) => b.id);
    const uf = buildUnionFind(allIds);

    for (const line of lines) {
      if (buses.some((b) => b.id === line.fromBusId) && buses.some((b) => b.id === line.toBusId)) {
        uf.union(line.fromBusId, line.toBusId);
      }
    }
    for (const t of transformers) {
      if (buses.some((b) => b.id === t.fromBusId) && buses.some((b) => b.id === t.toBusId)) {
        uf.union(t.fromBusId, t.toBusId);
      }
    }

    const roots = new Set(allIds.map((id) => uf.find(id)));
    if (roots.size > 1) {
      // Find isolated buses
      const rootCounts: Record<string, number> = {};
      for (const id of allIds) {
        const r = uf.find(id);
        rootCounts[r] = (rootCounts[r] ?? 0) + 1;
      }
      // The biggest component is the main network; others are isolated
      const mainRoot = Object.entries(rootCounts).sort((a, b) => b[1] - a[1])[0][0];
      for (const id of allIds) {
        if (uf.find(id) !== mainRoot) {
          const bus = buses.find((b) => b.id === id);
          errors.push({
            code: 'ISOLATED_NODE',
            message: `Buss "${bus?.name ?? id}" er isolert og ikke koblet til resten av nettet.`,
            type: 'error',
            componentId: id,
          });
        }
      }
    }
  }

  // --- WARNINGS ---

  // Nett med kun én buss
  if (buses.length === 1) {
    warnings.push({ code: 'SINGLE_BUS', message: 'Nettet har kun én buss. Legg til flere busser og linjer.', type: 'warning' });
  }

  // PV-buss uten generator
  for (const bus of buses.filter((b) => b.type === 'PV')) {
    const hasGen = project.generators.some((g) => g.busId === bus.id);
    if (!hasGen) {
      warnings.push({
        code: 'PV_NO_GENERATOR',
        message: `PV-buss "${bus.name}" har ingen tilkoblet generator.`,
        type: 'warning',
        componentId: bus.id,
      });
    }
  }

  // Linje med B = 0
  for (const line of lines) {
    if (line.bMuSPerKm === 0) {
      warnings.push({
        code: 'ZERO_SUSCEPTANCE',
        message: `Linje "${line.name}" har kapasitans B = 0 µS/km.`,
        type: 'warning',
        componentId: line.id,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
