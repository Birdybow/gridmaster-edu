import { describe, it, expect } from 'vitest';
import { migrateProject, needsMigration } from './migration.js';
import type { GmxProject } from '../types/index.js';

function minimalProject(version: string): GmxProject {
  return {
    metadata: {
      version,
      created: '2024-01-01T00:00:00.000Z',
      modified: '2024-01-01T00:00:00.000Z',
      student: 'Test',
      school: 'Testskole',
      course: 'TEST01',
      projectName: 'Testprosjekt',
    },
    system: { sBaseMVA: 100, fHz: 50, uBaseKV: {} },
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

describe('migration', () => {
  it('prosjekt allerede v12 → ingen migrasjon', () => {
    const p = minimalProject('12.0');
    const res = migrateProject(p);
    expect(res.migrated).toBe(false);
    expect(res.toVersion).toBe('12.0');
  });

  it('v1.0 → v12.0 migrerer alle steg', () => {
    const p = minimalProject('1.0');
    const res = migrateProject(p);
    expect(res.migrated).toBe(true);
    expect(res.fromVersion).toBe('1.0');
    expect(res.project.metadata.version).toBe('12.0');
  });

  it('v3.5 → v12.0 migrerer fra sprint 3.5', () => {
    const p = minimalProject('3.5');
    const res = migrateProject(p);
    expect(res.migrated).toBe(true);
    expect(res.project.metadata.version).toBe('12.0');
  });

  it('generators og compensators opprettholdes ved migrasjon', () => {
    const p = minimalProject('1.0');
    const res = migrateProject(p);
    expect(Array.isArray(res.project.generators)).toBe(true);
    expect(Array.isArray(res.project.compensators)).toBe(true);
  });

  it('protections eksisterer etter migrasjon fra v6', () => {
    const p = minimalProject('6.0');
    const res = migrateProject(p);
    expect(Array.isArray(res.project.protections)).toBe(true);
  });

  it('needsMigration returnerer true for gammel versjon', () => {
    expect(needsMigration(minimalProject('3.5'))).toBe(true);
    expect(needsMigration(minimalProject('11.0'))).toBe(true);
  });

  it('needsMigration returnerer false for v12', () => {
    expect(needsMigration(minimalProject('12.0'))).toBe(false);
  });

  it('system-defaults settes korrekt i v11→v12', () => {
    const p = minimalProject('11.0');
    const res = migrateProject(p);
    expect(res.project.system.sBaseMVA).toBe(100);
    expect(res.project.system.fHz).toBe(50);
  });

  it('migrasjonsresultat beholder originalfelter', () => {
    const p = minimalProject('5.0');
    (p as unknown as Record<string, unknown>).extraField = 'keepMe';
    const res = migrateProject(p);
    expect(res.project.metadata.projectName).toBe('Testprosjekt');
  });

  it('migrering fra v1 gir riktig fromVersion og toVersion', () => {
    const res = migrateProject(minimalProject('1.0'));
    expect(res.fromVersion).toBe('1.0');
    expect(res.toVersion).toBe('12.0');
  });
});
