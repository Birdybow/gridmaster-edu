// GridMaster Edu — CSV-eksport (separator ';', UTF-8 BOM for norsk Excel)
import type {
  GmxProject,
  PowerFlowResult,
  ShortCircuitResult,
  RingNetworkResult,
  VoltageDropResult,
} from '../types/index.js';
import { getBusName } from '../utils/display.js';

const SEP = ';';
const BOM = '﻿';

function row(...cells: (string | number | undefined | null)[]): string {
  return cells.map((c) => String(c ?? '')).join(SEP);
}

function download(filename: string, content: string): void {
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Y-buss
// ---------------------------------------------------------------------------

export function exportYBusCsv(project: GmxProject): void {
  const { buses, lines, transformers } = project;
  const n = buses.length;
  const lines2: string[] = [];

  lines2.push(row('Y-bussmatrise', project.metadata.projectName));
  lines2.push(row('Generert', new Date().toLocaleString('nb-NO')));
  lines2.push('');

  // Header rad
  const header = ['Buss\\Fra'].concat(buses.map((b) => b.name));
  lines2.push(header.join(SEP));

  // Enkel admittans-beregning (diagonaldominant)
  const Y: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const line of lines) {
    const i = buses.findIndex((b) => b.id === line.fromBusId);
    const j = buses.findIndex((b) => b.id === line.toBusId);
    if (i < 0 || j < 0) continue;
    const R = line.rOhmPerKm * line.lengthKm;
    const X = line.xOhmPerKm * line.lengthKm;
    const Z2 = R ** 2 + X ** 2;
    if (Z2 < 1e-12) continue;
    const g = R / Z2;
    Y[i][i] += g;
    Y[j][j] += g;
    Y[i][j] -= g;
    Y[j][i] -= g;
  }

  for (const t of transformers) {
    const i = buses.findIndex((b) => b.id === t.fromBusId);
    const j = buses.findIndex((b) => b.id === t.toBusId);
    if (i < 0 || j < 0) continue;
    const Zbase = (t.voltageHV_kV ** 2) / t.ratedMVA;
    const Xpu = (t.ekPercent / 100) * Zbase;
    if (Xpu < 1e-12) continue;
    const g = 1 / Xpu;
    Y[i][i] += g;
    Y[j][j] += g;
    Y[i][j] -= g;
    Y[j][i] -= g;
  }

  for (let i = 0; i < n; i++) {
    const cells = [buses[i].name].concat(Y[i].map((v) => v.toFixed(4)));
    lines2.push(cells.join(SEP));
  }

  download(`${project.metadata.projectName}_ybuss.csv`, lines2.join('\n'));
}

// ---------------------------------------------------------------------------
// Lastflyt
// ---------------------------------------------------------------------------

export function exportLoadFlowCsv(project: GmxProject, pf: PowerFlowResult): void {
  const { buses, lines } = project;
  const csvLines: string[] = [];

  csvLines.push(row('Lastflyt-resultater', project.metadata.projectName));
  csvLines.push(row('Konvergens', pf.converged ? 'Ja' : 'Nei'));
  csvLines.push(row('Iterasjoner', pf.iterations));
  csvLines.push(row('Totale tap', `${pf.totalLossesMW.toFixed(3)} MW`));
  csvLines.push('');

  csvLines.push(row('BUSSER'));
  csvLines.push(row('Buss', 'Type', 'U [pu]', 'δ [°]', 'U [kV]', 'P [MW]', 'Q [MVAr]', 'Innenfor grenser'));
  for (const r of pf.buses) {
    const bus = buses.find((b) => b.id === r.busId);
    csvLines.push(row(
      bus?.name ?? r.busId,
      bus?.type ?? '',
      r.vMagPU.toFixed(4),
      r.vAngDeg.toFixed(3),
      r.vMagKV.toFixed(3),
      r.pMW.toFixed(3),
      r.qMVAr.toFixed(3),
      r.withinLimits ? 'Ja' : 'Nei',
    ));
  }

  csvLines.push('');
  csvLines.push(row('LINJER'));
  csvLines.push(row('Linje', 'Fra', 'Til', 'I [A]', 'P_fra [MW]', 'Q_fra [MVAr]', 'Belastning [%]', 'Overbelastet'));
  for (const r of pf.lines) {
    const line = lines.find((l) => l.id === r.lineId);
    const fromName = getBusName(r.fromBusId, buses);
    const toName = getBusName(r.toBusId, buses);
    csvLines.push(row(
      line?.name ?? r.lineId,
      fromName,
      toName,
      (r.currentKA * 1000).toFixed(1),
      r.pFromMW.toFixed(3),
      r.qFromMVAr.toFixed(3),
      r.loadingPercent.toFixed(1),
      r.overloaded ? 'Ja' : 'Nei',
    ));
  }

  download(`${project.metadata.projectName}_lastflyt.csv`, csvLines.join('\n'));
}

// ---------------------------------------------------------------------------
// Kortslutning
// ---------------------------------------------------------------------------

export function exportShortCircuitCsv(project: GmxProject, results: ShortCircuitResult[]): void {
  const { buses } = project;
  const csvLines: string[] = [];

  csvLines.push(row('Kortslutningsresultater', project.metadata.projectName));
  csvLines.push(row('Generert', new Date().toLocaleString('nb-NO')));
  csvLines.push('');
  csvLines.push(row('Buss', 'I\'\'k3p maks [kA]', 'I\'\'k2p [kA]', 'ip [kA]', 'I\'\'k3p min [kA]', 'I\'\'k1p min [kA]'));

  for (const r of results) {
    const busName = getBusName(r.busId, buses);
    csvLines.push(row(
      busName,
      r.ik3pMaxKA.toFixed(3),
      r.ik2pKA.toFixed(3),
      r.ipKA.toFixed(3),
      r.ik3pMinKA.toFixed(3),
      r.ik1pMinKA.toFixed(3),
    ));
  }

  download(`${project.metadata.projectName}_kortslutning.csv`, csvLines.join('\n'));
}

// ---------------------------------------------------------------------------
// Ringnett
// ---------------------------------------------------------------------------

export function exportRingNetworkCsv(project: GmxProject, result: RingNetworkResult): void {
  const { buses } = project;
  const csvLines: string[] = [];

  csvLines.push(row('Ringnett-resultater', project.metadata.projectName));
  csvLines.push(row('Topologi', result.topology));
  csvLines.push(row('Totale tap [kW]', result.totalTapKW.toFixed(2)));
  csvLines.push(row('Radielt tap [kW]', result.radialTapKW.toFixed(2)));
  csvLines.push(row('Tap-reduksjon [%]', result.tapReductionPercent.toFixed(1)));
  csvLines.push('');
  csvLines.push(row('GRENER'));
  csvLines.push(row('Fra', 'Til', 'I [A]', 'Tap [kW]', 'Belastning [%]'));

  for (const b of result.branches) {
    csvLines.push(row(
      getBusName(b.fromBusId, buses),
      getBusName(b.toBusId, buses),
      b.currentA.toFixed(1),
      b.tapKW.toFixed(2),
      b.loadingPercent.toFixed(1),
    ));
  }

  download(`${project.metadata.projectName}_ringnett.csv`, csvLines.join('\n'));
}

// ---------------------------------------------------------------------------
// Spenningsfall
// ---------------------------------------------------------------------------

export function exportVoltageDropCsv(project: GmxProject, results: VoltageDropResult[]): void {
  const { lines } = project;
  const csvLines: string[] = [];

  csvLines.push(row('Spenningsfall-resultater', project.metadata.projectName));
  csvLines.push('');
  csvLines.push(row('Linje', 'Modell', 'ΔU [V]', 'ΔU [%]', 'ΔU [pu]', 'U_mottaker [kV]', 'Innenfor grenser', 'REN-ref'));

  for (const r of results) {
    const line = lines.find((l) => l.id === r.lineId);
    csvLines.push(row(
      line?.name ?? r.lineId,
      r.model,
      r.deltaUVolts.toFixed(1),
      r.deltaUPercent.toFixed(2),
      r.deltaUPU.toFixed(4),
      r.uReceivingKV.toFixed(3),
      r.withinLimits ? 'Ja' : 'Nei',
      r.renReference,
    ));
  }

  download(`${project.metadata.projectName}_spenningsfall.csv`, csvLines.join('\n'));
}
