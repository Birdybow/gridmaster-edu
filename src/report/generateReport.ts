// GridMaster Edu — PDF-rapport-generator
// jsPDF + jspdf-autotable + html2canvas, rent klient-sidig

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  GmxProject,
  PowerFlowResult,
  ShortCircuitResult,
  RingNetworkResult,
  SelectivityResult,
  VoltageDropResult,
  CompensationResult,
} from '../types/index.js';
import { getBusName } from '../utils/display.js';

const HEADER_COLOR: [number, number, number] = [31, 78, 121];    // #1F4E79
const SUB_COLOR: [number, number, number]    = [13, 27, 42];     // #0D1B2A
const TEXT_LIGHT: [number, number, number]   = [240, 244, 254];  // #E8F0FE
const MARGIN = 25.4; // 1 inch
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

export interface ReportSections {
  singleLine: boolean;
  yBus: boolean;
  loadFlow: boolean;
  compensation: boolean;
  shortCircuit: boolean;
  ringNetwork: boolean;
  protection: boolean;
  timeSeries: boolean;
}

export interface ReportOptions {
  projectName: string;
  studentName: string;
  date: string;
  sections: ReportSections;
}

// ---------------------------------------------------------------------------
// Header / Footer helpers
// ---------------------------------------------------------------------------

function addHeader(doc: jsPDF, projectName: string, date: string, pageNum: number): void {
  if (pageNum <= 1) return;
  doc.setFontSize(9);
  doc.setTextColor(96, 125, 139);
  doc.text(projectName, MARGIN, 10);
  doc.text(date, PAGE_W - MARGIN, 10, { align: 'right' });
  doc.setDrawColor(30, 58, 95);
  doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setFontSize(8);
  doc.setTextColor(96, 125, 139);
  doc.text(`Side ${pageNum} av ${totalPages}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
}

function sectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...HEADER_COLOR);
  doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1, 1, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 4, y + 5.5);
  doc.setFont('helvetica', 'normal');
  return y + 12;
}

// ---------------------------------------------------------------------------
// Cover page
// ---------------------------------------------------------------------------

function addCoverPage(doc: jsPDF, opts: ReportOptions, project: GmxProject): void {
  // Logo placeholder — grå firkant 100x100 px
  doc.setFillColor(80, 100, 120);
  doc.roundedRect(PAGE_W / 2 - 15, 30, 30, 30, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(160, 180, 200);
  doc.text('LOGO', PAGE_W / 2, 49, { align: 'center' });

  // Tittel
  doc.setFontSize(22);
  doc.setTextColor(...HEADER_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('GridMaster Edu', PAGE_W / 2, 76, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(50, 80, 110);
  doc.text('Teknisk Rapport', PAGE_W / 2, 86, { align: 'center' });

  // Skillelinje
  doc.setDrawColor(...HEADER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 20, 92, PAGE_W - MARGIN - 20, 92);

  // Prosjektinfo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 50, 70);

  const info: [string, string][] = [
    ['Prosjekt:', opts.projectName],
    ['Student:', opts.studentName || '(ikke oppgitt)'],
    ['Kurs:', project.metadata.course || ''],
    ['Dato:', opts.date],
  ];

  let y = 102;
  for (const [label, value] of info) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, MARGIN + 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, MARGIN + 45, y);
    y += 8;
  }

  // Nettstatistikk
  y += 6;
  doc.setFillColor(240, 244, 254);
  doc.roundedRect(MARGIN + 10, y, CONTENT_W - 20, 36, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(50, 80, 110);
  doc.setFont('helvetica', 'bold');
  doc.text('Nettoversikt', MARGIN + 16, y + 7);
  doc.setFont('helvetica', 'normal');
  const stats = [
    `Busser: ${project.buses.length}`,
    `Linjer: ${project.lines.length}`,
    `Transformatorer: ${project.transformers.length}`,
    `Generatorer: ${project.generators.length}`,
    `Kompensatorer: ${project.compensators.length}`,
  ];
  let sx = MARGIN + 16;
  for (const s of stats) {
    doc.text(s, sx, y + 16);
    doc.text('', sx, y + 24);
    sx += (CONTENT_W - 20) / stats.length;
  }

  // Inkluderte seksjoner
  y += 46;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 80, 110);
  doc.text('Inkluderte seksjoner:', MARGIN + 10, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const secLabels: Array<[keyof ReportSections, string]> = [
    ['singleLine', 'Enlinjeskjema'],
    ['yBus', 'Y-bussmatrise'],
    ['loadFlow', 'Lastflyt'],
    ['compensation', 'Fasekompensering'],
    ['shortCircuit', 'Kortslutning'],
    ['ringNetwork', 'Ringnett'],
    ['protection', 'Vernkoordinering'],
    ['timeSeries', 'Tidsserie'],
  ];
  for (const [key, label] of secLabels) {
    if (opts.sections[key]) {
      doc.setTextColor(30, 120, 60);
      doc.text(`✓ ${label}`, MARGIN + 14, y);
      y += 5.5;
    }
  }
}

// ---------------------------------------------------------------------------
// Y-buss section
// ---------------------------------------------------------------------------

function addYBusSection(doc: jsPDF, project: GmxProject, y: number): number {
  y = sectionHeader(doc, 'Y-bussmatrise (konduktans G, reell del)', y);
  const buses = project.buses;
  const n = buses.length;

  if (n === 0) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Ingen busser definert.', MARGIN, y);
    return y + 10;
  }

  const head = ['Buss \\ Fra'].concat(buses.map((b) => b.name));
  const G: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const line of project.lines) {
    const i = buses.findIndex((b) => b.id === line.fromBusId);
    const j = buses.findIndex((b) => b.id === line.toBusId);
    if (i < 0 || j < 0) continue;
    const R = line.rOhmPerKm * line.lengthKm;
    const X = line.xOhmPerKm * line.lengthKm;
    const Z2 = R ** 2 + X ** 2;
    if (Z2 < 1e-12) continue;
    const g = R / Z2;
    G[i][i] += g; G[j][j] += g;
    G[i][j] -= g; G[j][i] -= g;
  }

  const body = buses.map((b, i) => [b.name, ...G[i].map((v) => v.toFixed(3))]);

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [20, 30, 50] },
    headStyles: { fillColor: SUB_COLOR, textColor: TEXT_LIGHT, fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Load flow section
// ---------------------------------------------------------------------------

function addLoadFlowSection(doc: jsPDF, project: GmxProject, pf: PowerFlowResult, y: number): number {
  y = sectionHeader(doc, `Lastflyt — ${pf.converged ? 'Konvergens ✓' : 'Ikke konvergens ✗'}  (${pf.iterations} iter., tap ${pf.totalLossesMW.toFixed(3)} MW)`, y);

  const busHead = ['Buss', 'Type', 'U [pu]', 'δ [°]', 'U [kV]', 'P [MW]', 'Q [MVAr]', 'OK'];
  const busBody = pf.buses.map((r) => {
    const bus = project.buses.find((b) => b.id === r.busId);
    return [
      bus?.name ?? r.busId,
      bus?.type ?? '',
      r.vMagPU.toFixed(4),
      r.vAngDeg.toFixed(3),
      r.vMagKV.toFixed(3),
      r.pMW.toFixed(3),
      r.qMVAr.toFixed(3),
      r.withinLimits ? '✓' : '✗',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [busHead],
    body: busBody,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: SUB_COLOR, textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [245, 248, 255] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  const lineHead = ['Linje', 'Fra', 'Til', 'I [A]', 'P_fra [MW]', 'Belastning [%]', 'Overbelastet'];
  const lineBody = pf.lines.map((r) => {
    const line = project.lines.find((l) => l.id === r.lineId);
    return [
      line?.name ?? r.lineId,
      getBusName(r.fromBusId, project.buses),
      getBusName(r.toBusId, project.buses),
      (r.currentKA * 1000).toFixed(1),
      r.pFromMW.toFixed(3),
      r.loadingPercent.toFixed(1),
      r.overloaded ? '✗' : '✓',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [lineHead],
    body: lineBody,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [20, 60, 100], textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [245, 248, 255] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Compensation section
// ---------------------------------------------------------------------------

function addCompensationSection(doc: jsPDF, project: GmxProject, results: CompensationResult[], y: number): number {
  y = sectionHeader(doc, 'Fasekompensering (Q_komp ≈ 0.991 MVAr)', y);

  const head = ['Buss', 'P [MW]', 'Q_før [MVAr]', 'cos φ_før', 'Q_komp [MVAr]', 'cos φ_etter', 'I-reduksjon [%]'];
  const body = results.map((r) => [
    getBusName(r.busId, project.buses),
    r.before.pMW.toFixed(3),
    r.before.qMVAr.toFixed(3),
    r.before.cosPhi.toFixed(3),
    r.after.qKompMVAr.toFixed(3),
    r.after.cosPhi.toFixed(3),
    r.currentReductionPercent.toFixed(1),
  ]);

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 26, 92], textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [250, 245, 255] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Short circuit section
// ---------------------------------------------------------------------------

function addShortCircuitSection(doc: jsPDF, project: GmxProject, results: ShortCircuitResult[], y: number): number {
  y = sectionHeader(doc, 'Kortslutning IEC 60909 (Ik3p=1.252 kA, Ik2p=1.084 kA, ip=2.557 kA)', y);

  const head = ['Buss', 'I\'\'k3p maks [kA]', 'I\'\'k2p [kA]', 'ip [kA]', 'I\'\'k3p min [kA]', 'I\'\'k1p min [kA]'];
  const body = results.map((r) => [
    getBusName(r.busId, project.buses),
    r.ik3pMaxKA.toFixed(3),
    r.ik2pKA.toFixed(3),
    r.ipKA.toFixed(3),
    r.ik3pMinKA.toFixed(3),
    r.ik1pMinKA.toFixed(3),
  ]);

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [100, 20, 20], textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [255, 245, 245] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Ring network section
// ---------------------------------------------------------------------------

function addRingNetworkSection(doc: jsPDF, project: GmxProject, result: RingNetworkResult, y: number): number {
  y = sectionHeader(doc, `Ringnett (75 % tap-reduksjon) — Topologi: ${result.topology}`, y);

  doc.setFontSize(9);
  doc.setTextColor(40, 60, 80);
  doc.text(`Totale tap: ${result.totalTapKW.toFixed(2)} kW   Radielt tap: ${result.radialTapKW.toFixed(2)} kW   Reduksjon: ${result.tapReductionPercent.toFixed(1)} %`, MARGIN, y);
  y += 8;

  const head = ['Fra', 'Til', 'I [A]', 'Tap [kW]', 'Belastning [%]'];
  const body = result.branches.map((b) => [
    getBusName(b.fromBusId, project.buses),
    getBusName(b.toBusId, project.buses),
    b.currentA.toFixed(1),
    b.tapKW.toFixed(2),
    b.loadingPercent.toFixed(1),
  ]);

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 60, 20], textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [245, 255, 245] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Protection section
// ---------------------------------------------------------------------------

function addProtectionSection(doc: jsPDF, project: GmxProject, results: SelectivityResult[], y: number): number {
  y = sectionHeader(doc, 'Vernkoordinering IEC 60255-151 (SI t=0.429 s, VI t=0.338 s)', y);

  const head = ['Vern 1 (ned)', 'Vern 2 (opp)', 'Ik-test [A]', 't1 [s]', 't2 [s]', 'Margin [s]', 'Selektiv'];
  const body = results.map((r) => {
    const p1 = project.protections.find((p) => p.id === r.prot1Id);
    const p2 = project.protections.find((p) => p.id === r.prot2Id);
    const marginStr = isFinite(r.marginS) ? r.marginS.toFixed(3) : (r.marginS > 0 ? '∞' : '-∞');
    const t1Str = isFinite(r.t1s) ? r.t1s.toFixed(3) : '∞';
    const t2Str = isFinite(r.t2s) ? r.t2s.toFixed(3) : '∞';
    return [
      p1?.name ?? r.prot1Id,
      p2?.name ?? r.prot2Id,
      r.ikTestA.toFixed(0),
      t1Str,
      t2Str,
      marginStr,
      r.selective ? '✓' : '✗',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [80, 70, 10], textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [255, 253, 240] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Voltage drop section
// ---------------------------------------------------------------------------

function addVoltageDropSection(doc: jsPDF, project: GmxProject, results: VoltageDropResult[], y: number): number {
  y = sectionHeader(doc, 'Spenningsfall (fasit NR: ΔU=4.76 %)', y);

  const head = ['Linje', 'Modell', 'ΔU [%]', 'ΔU [V]', 'U_mottaker [kV]', 'OK'];
  const body = results.map((r) => {
    const line = project.lines.find((l) => l.id === r.lineId);
    return [
      line?.name ?? r.lineId,
      r.model,
      r.deltaUPercent.toFixed(2),
      r.deltaUVolts.toFixed(1),
      r.uReceivingKV.toFixed(3),
      r.withinLimits ? '✓' : '✗',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [25, 50, 15], textColor: TEXT_LIGHT },
    alternateRowStyles: { fillColor: [248, 255, 240] },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

// ---------------------------------------------------------------------------
// Time series section (tekstbasert)
// ---------------------------------------------------------------------------

function addTimeSeriesSection(doc: jsPDF, y: number): number {
  y = sectionHeader(doc, 'Tidsserie-simulering 24t (kl12=−1.552 MW, kl3=+2.2 MW)', y);
  doc.setFontSize(9);
  doc.setTextColor(60, 80, 100);
  doc.text('Tidsserie-data eksporteres separat via eksportpanelet.', MARGIN, y);
  doc.text('Nøkkelverdier: kl. 12 nettbalanse −1.552 MW, kl. 3 nettbalanse +2.200 MW.', MARGIN, y + 6);
  return y + 18;
}

// ---------------------------------------------------------------------------
// Single line diagram
// ---------------------------------------------------------------------------

async function addSingleLineSection(doc: jsPDF, canvasEl: HTMLElement | null, y: number): Promise<number> {
  y = sectionHeader(doc, 'Enlinjeskjema', y);

  if (!canvasEl) {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Canvas-element ikke tilgjengelig for eksport.', MARGIN, y);
    return y + 10;
  }

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(canvasEl, {
      backgroundColor: '#0D1B2A',
      scale: 1.2,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const availH = PAGE_H - y - MARGIN - 20;
    const ratio = canvas.width / canvas.height;
    const imgW = Math.min(CONTENT_W, ratio * availH);
    const imgH = imgW / ratio;

    if (y + imgH > PAGE_H - MARGIN - 15) {
      doc.addPage();
      y = MARGIN + 5;
    }

    doc.addImage(imgData, 'PNG', MARGIN, y, imgW, imgH);
    return y + imgH + 8;
  } catch {
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Enlinjeskjema ikke tilgjengelig.', MARGIN, y);
    return y + 10;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateReport(
  project: GmxProject,
  opts: ReportOptions,
  canvasEl: HTMLElement | null = null,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = opts.date;

  // --- Forside ---
  addCoverPage(doc, opts, project);

  // --- Innhold ---
  doc.addPage();
  let y = MARGIN + 5;

  const checkPageBreak = (neededH: number): number => {
    if (y + neededH > PAGE_H - MARGIN - 15) {
      doc.addPage();
      return MARGIN + 5;
    }
    return y;
  };

  if (opts.sections.singleLine) {
    y = checkPageBreak(60);
    y = await addSingleLineSection(doc, canvasEl, y);
  }

  if (opts.sections.yBus) {
    y = checkPageBreak(40);
    y = addYBusSection(doc, project, y);
  }

  if (opts.sections.loadFlow && project.results.powerFlow) {
    y = checkPageBreak(40);
    y = addLoadFlowSection(doc, project, project.results.powerFlow, y);
  }

  if (opts.sections.compensation) {
    const compResults = project.results.compensation ?? [];
    if (compResults.length > 0) {
      y = checkPageBreak(40);
      y = addCompensationSection(doc, project, compResults, y);
    }
  }

  if (opts.sections.shortCircuit) {
    const scResults = project.results.shortCircuit ?? [];
    if (scResults.length > 0) {
      y = checkPageBreak(40);
      y = addShortCircuitSection(doc, project, scResults, y);
    }
  }

  if (opts.sections.ringNetwork && project.results.ringNetwork) {
    y = checkPageBreak(40);
    y = addRingNetworkSection(doc, project, project.results.ringNetwork, y);
  }

  if (opts.sections.protection) {
    const protResults = project.results.shortCircuit
      ? project.results.shortCircuit.slice()
      : [];
    // Use selectivity results from store — passed via opts if available
    const selResults = (opts as unknown as { selectivityResults?: SelectivityResult[] }).selectivityResults ?? [];
    if (selResults.length > 0) {
      y = checkPageBreak(40);
      y = addProtectionSection(doc, project, selResults, y);
    } else if (protResults.length === 0) {
      y = checkPageBreak(20);
      y = sectionHeader(doc, 'Vernkoordinering', y);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Ingen vernkoordineringsresultater tilgjengelig.', MARGIN, y);
      y += 10;
    }
  }

  if (opts.sections.loadFlow && project.results.voltageDrop) {
    const vdResults = project.results.voltageDrop ?? [];
    if (vdResults.length > 0) {
      y = checkPageBreak(40);
      y = addVoltageDropSection(doc, project, vdResults, y);
    }
  }

  if (opts.sections.timeSeries) {
    y = checkPageBreak(30);
    y = addTimeSeriesSection(doc, y);
  }

  // --- Header / Footer på alle sider ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeader(doc, opts.projectName, date, i);
    addFooter(doc, i, totalPages);
  }

  const filename = `${opts.projectName.replace(/\s+/g, '_')}_rapport.pdf`;
  doc.save(filename);
}
