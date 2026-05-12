// GridMaster Edu — REN-advarselssystem (Norsk Elektroteknisk Norm)
// Ref: REN blad 4004, 6002, 7002, 9001

import type { GmxProject, VoltageDropResult, ShortCircuitResult, SelectivityResult } from '../types/index.js';

export type RenSeverity = 'ok' | 'warning' | 'error';
export type RenArea = 'cable' | 'voltage_drop' | 'short_circuit' | 'protection' | 'earthing';

export interface RenResult {
  id: string;
  area: RenArea;
  severity: RenSeverity;
  componentId?: string;
  message: string;
  reference: string;
}

// ---------------------------------------------------------------------------
// Pure check functions — testable in isolation
// ---------------------------------------------------------------------------

/** REN blad 4004 §3.3: Ib ≤ In ≤ Iz
 *  - ib: faktisk belastningsstrøm (A)
 *  - in_: vern-/sikringsnominalstrøm (A)
 *  - iz: kabelens strømkapasitet (A)
 */
export function checkCable(ib: number, in_: number, iz: number): RenSeverity {
  if (ib > in_) return 'error';       // overbelastning: last > vern
  if (in_ > iz) return 'error';       // vern beskytter ikke kabelen
  if (iz - in_ < iz * 0.10) return 'warning';  // < 10% margin
  return 'ok';
}

/** REN blad 6002 §4.1: Spenningsfall-grenser
 *  ΔU% < 4% → ok, 4–10% → warning, ≥ 10% → error
 */
export function checkVoltageDrop(deltaUPercent: number): RenSeverity {
  const abs = Math.abs(deltaUPercent);
  if (abs >= 10) return 'error';
  if (abs >= 4) return 'warning';
  return 'ok';
}

/** REN blad 7002 §2.2: Kortslutningsvern utløser < 5 s (NEK 400-4-41)
 *  Krav: Ik3p ≥ 2 × Ia (vern-øyeblikkstrøm, type C = 10 × In)
 *  - ik3pA: trepolet kortslutningsstrøm (A)
 *  - iaA: vern-øyeblikkstrøm (A) = 10 × In for type C
 */
export function checkShortCircuit(ik3pA: number, iaA: number): RenSeverity {
  if (ik3pA >= iaA * 2) return 'ok';
  return 'error';
}

/** REN blad 7002 §5.1: Selektivitet — oppstrøms vern må ha Δt ≥ 200 ms
 *  - tUpstreamS: utløsningstid oppstrøms vern (s)
 *  - tDownstreamS: utløsningstid nedstrøms vern (s)
 */
export function checkProtectionSelectivity(tUpstreamS: number, tDownstreamS: number): RenSeverity {
  const delta = tUpstreamS - tDownstreamS;
  if (delta >= 0.200) return 'ok';
  return 'error';
}

/** REN blad 9001 §3.2: Jordmotstand
 *  - IT-nett: Rjord ≤ 100 Ω
 *  - TN-nett: Rjord ≤ 50 Ω
 */
export function checkEarthing(rOhm: number, networkType: 'IT' | 'TN' | 'Petersen'): RenSeverity {
  const limit = networkType === 'TN' ? 50 : 100;
  return rOhm <= limit ? 'ok' : 'error';
}

// ---------------------------------------------------------------------------
// Project-level validation
// ---------------------------------------------------------------------------

let _idCounter = 0;
function nextId(): string {
  return `ren-${++_idCounter}`;
}

export function validateRen(
  project: GmxProject,
  vdResults: VoltageDropResult[] = [],
  scResults: ShortCircuitResult[] = [],
  selResults: SelectivityResult[] = [],
): RenResult[] {
  const results: RenResult[] = [];

  // --- Cable checks ---
  for (const line of project.lines) {
    const inA = (line as unknown as Record<string, number>).inA as number | undefined;
    const izA = (line as unknown as Record<string, number>).izA as number | undefined;
    if (inA === undefined || izA === undefined) continue;

    // Derive approximate load current from voltage drop results
    const vd = vdResults.find((r) => r.lineId === line.id);
    if (vd) {
      // Approximate Ib from power flow if available — use 0 as fallback
      const ib = 0; // Placeholder; real app would use line current from power flow
      const sev = checkCable(ib, inA, izA);
      if (sev !== 'ok') {
        results.push({
          id: nextId(),
          area: 'cable',
          severity: sev,
          componentId: line.id,
          message: `Linje "${line.name}": kabelregel Ib ≤ In ≤ Iz ikke oppfylt (In=${inA}A, Iz=${izA}A)`,
          reference: 'REN blad 4004 §3.3',
        });
      }
    }
  }

  // --- Voltage drop checks ---
  for (const vd of vdResults) {
    const sev = checkVoltageDrop(vd.deltaUPercent);
    if (sev !== 'ok') {
      const line = project.lines.find((l) => l.id === vd.lineId);
      const label = sev === 'error' ? 'Brudd på forskrift' : 'Nær grense';
      results.push({
        id: nextId(),
        area: 'voltage_drop',
        severity: sev,
        componentId: vd.lineId,
        message: `${label}: ΔU = ${vd.deltaUPercent.toFixed(2)}% på linje "${line?.name ?? vd.lineId}"`,
        reference: 'REN blad 6002 §4.1',
      });
    }
  }

  // --- Short circuit checks ---
  for (const sc of scResults) {
    const bus = project.buses.find((b) => b.id === sc.busId);
    const cbRatingKA = bus?.cbRatingKA ?? 0;
    if (cbRatingKA > 0) {
      const sev = checkShortCircuit(sc.ik3pMaxKA * 1000, cbRatingKA * 1000);
      if (sev !== 'ok') {
        results.push({
          id: nextId(),
          area: 'short_circuit',
          severity: sev,
          componentId: sc.busId,
          message: `Bryterevne utilstrekkelig: Ik3p=${(sc.ik3pMaxKA * 1000).toFixed(0)} A < 2×Ia`,
          reference: 'REN blad 7002 §2.2',
        });
      }
    }
  }

  // --- Protection selectivity checks ---
  for (const sel of selResults) {
    const sev = checkProtectionSelectivity(sel.t2s, sel.t1s);
    if (sev !== 'ok') {
      results.push({
        id: nextId(),
        area: 'protection',
        severity: sev,
        componentId: sel.prot2Id,
        message: `Selektivitetssvikt: Δt = ${(sel.marginS * 1000).toFixed(0)} ms < 200 ms`,
        reference: 'REN blad 7002 §5.1',
      });
    }
  }

  // --- Earthing checks ---
  for (const bus of project.buses) {
    const rOhm = (bus as unknown as Record<string, number>).earthingResistanceOhm as number | undefined;
    const nt = bus.neutralTreatment;
    if (rOhm !== undefined && (nt === 'isolated' || nt === 'solid' || nt === 'resistance')) {
      const netType: 'IT' | 'TN' = nt === 'solid' ? 'TN' : 'IT';
      const sev = checkEarthing(rOhm, netType);
      if (sev !== 'ok') {
        results.push({
          id: nextId(),
          area: 'earthing',
          severity: sev,
          componentId: bus.id,
          message: `Jordmotstand ${rOhm} Ω overskrider grense for ${netType}-nett`,
          reference: 'REN blad 9001 §3.2',
        });
      }
    }
  }

  return results;
}
