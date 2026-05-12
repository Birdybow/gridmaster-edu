// GridMaster Edu — .gmx-prosjektfil migrasjonsmotor v1→v12
// Kjedet migrasjonsstruktur: hvert steg løfter én majorversjon.

import type { GmxProject } from '../types/index.js';

export interface MigrationResult {
  project: GmxProject;
  migrated: boolean;
  fromVersion: string;
  toVersion: string;
}

const CURRENT_VERSION = '12.0';

function semver(v: string): number {
  const major = parseFloat(v.split('.')[0]);
  return isNaN(major) ? 0 : major;
}

// ---------------------------------------------------------------------------
// Step-migrations — each function upgrades one major version
// ---------------------------------------------------------------------------

function migrateV1ToV2(p: GmxProject): GmxProject {
  return {
    ...p,
    generators: p.generators ?? [],
    compensators: p.compensators ?? [],
    metadata: { ...p.metadata, version: '2.0' },
  };
}

function migrateV2ToV3(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '3.0' },
  };
}

function migrateV3ToV4(p: GmxProject): GmxProject {
  return {
    ...p,
    results: { ...p.results },
    metadata: { ...p.metadata, version: '4.0' },
  };
}

function migrateV4ToV5(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '5.0' },
  };
}

function migrateV5ToV6(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '6.0' },
  };
}

function migrateV6ToV7(p: GmxProject): GmxProject {
  return {
    ...p,
    protections: p.protections ?? [],
    metadata: { ...p.metadata, version: '7.0' },
  };
}

function migrateV7ToV8(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '8.0' },
  };
}

function migrateV8ToV9(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '9.0' },
  };
}

function migrateV9ToV10(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '10.0' },
  };
}

function migrateV10ToV11(p: GmxProject): GmxProject {
  return {
    ...p,
    metadata: { ...p.metadata, version: '11.0' },
  };
}

function migrateV11ToV12(p: GmxProject): GmxProject {
  // v12: ensure system.sBaseMVA and system.uBaseKV defaults
  const sys = p.system ?? { sBaseMVA: 100, fHz: 50, uBaseKV: {} };
  return {
    ...p,
    system: {
      sBaseMVA: sys.sBaseMVA ?? 100,
      fHz: sys.fHz ?? 50,
      uBaseKV: sys.uBaseKV ?? {},
    },
    metadata: { ...p.metadata, version: '12.0' },
  };
}

const MIGRATIONS: Array<{ from: number; fn: (p: GmxProject) => GmxProject }> = [
  { from: 1, fn: migrateV1ToV2 },
  { from: 2, fn: migrateV2ToV3 },
  { from: 3, fn: migrateV3ToV4 },
  { from: 4, fn: migrateV4ToV5 },
  { from: 5, fn: migrateV5ToV6 },
  { from: 6, fn: migrateV6ToV7 },
  { from: 7, fn: migrateV7ToV8 },
  { from: 8, fn: migrateV8ToV9 },
  { from: 9, fn: migrateV9ToV10 },
  { from: 10, fn: migrateV10ToV11 },
  { from: 11, fn: migrateV11ToV12 },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function migrateProject(raw: GmxProject): MigrationResult {
  const fromVersion = raw.metadata?.version ?? '1.0';
  let current = semver(fromVersion);
  const target = semver(CURRENT_VERSION);

  if (current >= target) {
    return { project: raw, migrated: false, fromVersion, toVersion: fromVersion };
  }

  let p: GmxProject = { ...raw };

  for (const step of MIGRATIONS) {
    if (current < target && current === step.from) {
      p = step.fn(p);
      current = step.from + 1;
    }
  }

  return {
    project: p,
    migrated: true,
    fromVersion,
    toVersion: CURRENT_VERSION,
  };
}

export function needsMigration(project: GmxProject): boolean {
  const v = semver(project.metadata?.version ?? '1.0');
  return v < semver(CURRENT_VERSION);
}
