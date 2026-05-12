import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcTripTime } from '../../core/protection.js';
import type { OcCurve, Protection } from '../../types/index.js';

const CURVE_LABELS: Record<OcCurve, string> = {
  standard_inverse: 'Standard invers (IEC)',
  very_inverse: 'Veldig invers',
  extremely_inverse: 'Ekstremt invers',
  definite_time: 'Definit tid',
};

export function ProtectionEditor() {
  const selectedEdgeId = useNetworkStore((s) => s.selectedEdgeId);
  const lines = useNetworkStore((s) => s.project.lines);
  const buses = useNetworkStore((s) => s.project.buses);
  const protections = useNetworkStore((s) => s.project.protections);
  const scResults = useNetworkStore((s) => s.project.results.shortCircuit);
  const addProtection = useNetworkStore((s) => s.addProtection);
  const updateProtection = useNetworkStore((s) => s.updateProtection);
  const removeProtection = useNetworkStore((s) => s.removeProtection);

  const line = lines.find((l) => l.id === selectedEdgeId);
  if (!line) return null;

  const prot = protections.find((p) => p.protectedLineId === selectedEdgeId);
  const toBus = buses.find((b) => b.id === line.toBusId);
  const scResult = scResults?.find((r) => r.busId === line.toBusId);
  const ik3pMinA = scResult ? scResult.ik3pMinKA * 1000 : null;
  const inA = toBus && (toBus.loadMW || toBus.loadMVAr)
    ? (Math.sqrt(toBus.loadMW ** 2 + toBus.loadMVAr ** 2) * 1e6) / (Math.sqrt(3) * toBus.voltageKV * 1000)
    : null;

  function handleAdd() {
    const newProt: Protection = {
      id: crypto.randomUUID(),
      name: `Vern ${line!.name}`,
      busId: line!.fromBusId,
      protectedLineId: line!.id,
      type: 'overcurrent',
      pickupCurrentA: inA ? Math.round(inA * 1.3) : 100,
      timeDelayS: 0.3,
      tms: 0.1,
      curve: 'standard_inverse',
      instantTrip: false,
    };
    addProtection(newProt);
  }

  if (!prot) {
    return (
      <div style={{ padding: '12px 14px', borderTop: '1px solid #1E3A5F' }}>
        <div style={{ color: '#607D8B', fontSize: 11, marginBottom: 8 }}>Overstrømsvern</div>
        <button
          onClick={handleAdd}
          style={{ ...btnStyle, background: '#0F3B1E', border: '1px solid #2E7D32', width: '100%' }}
        >
          + Legg til overstrømsvern
        </button>
      </div>
    );
  }

  const tms = prot.tms ?? 0.1;
  const curve = prot.curve ?? 'standard_inverse';
  const tripTimeAtIk = ik3pMinA !== null ? calcTripTime(tms, prot.pickupCurrentA, ik3pMinA, curve) : null;
  const isSensitive = ik3pMinA !== null ? prot.pickupCurrentA < ik3pMinA : null;
  const isSafeFromOverload = inA !== null ? prot.pickupCurrentA > inA * 1.2 : null;

  function update(patch: Partial<Protection>) {
    updateProtection(prot!.id, patch);
  }

  return (
    <div style={{ padding: '12px 14px', borderTop: '1px solid #1E3A5F' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 700 }}>🛡 Overstrømsvern</span>
        <button
          onClick={() => removeProtection(prot.id)}
          style={{ background: 'none', border: 'none', color: '#EF5350', cursor: 'pointer', fontSize: 11 }}
        >
          Fjern
        </button>
      </div>

      <label style={labelStyle}>Navn</label>
      <input
        value={prot.name}
        onChange={(e) => update({ name: e.target.value })}
        style={inputStyle}
      />

      <label style={labelStyle}>Utløsestrøm I_s [A]</label>
      <input
        type="number"
        min={1}
        step={10}
        value={prot.pickupCurrentA}
        onChange={(e) => update({ pickupCurrentA: +e.target.value })}
        style={inputStyle}
      />
      {inA !== null && (
        <div style={{ fontSize: 10, color: isSafeFromOverload ? '#4CAF50' : '#FFB74D', marginBottom: 6 }}>
          {isSafeFromOverload
            ? `✓ I_s > 1.2 × I_n (${Math.round(inA)} A)`
            : `⚠ I_s bør være > ${Math.round(inA * 1.2)} A  (1.2 × I_n)`}
        </div>
      )}

      <label style={labelStyle}>Kurve</label>
      <select
        value={curve}
        onChange={(e) => update({ curve: e.target.value as OcCurve })}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        {(Object.keys(CURVE_LABELS) as OcCurve[]).map((k) => (
          <option key={k} value={k}>{CURVE_LABELS[k]}</option>
        ))}
      </select>

      {curve !== 'definite_time' ? (
        <>
          <label style={labelStyle}>TMS (0.05 – 1.0)</label>
          <input
            type="number"
            min={0.05}
            max={1.0}
            step={0.05}
            value={tms}
            onChange={(e) => update({ tms: +e.target.value })}
            style={inputStyle}
          />
        </>
      ) : (
        <>
          <label style={labelStyle}>Tidsforsinkelse [s]</label>
          <input
            type="number"
            min={0}
            max={5}
            step={0.05}
            value={prot.timeDelayS}
            onChange={(e) => update({ timeDelayS: +e.target.value })}
            style={inputStyle}
          />
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input
          type="checkbox"
          id={`instantTrip_${prot.id}`}
          checked={prot.instantTrip}
          onChange={(e) => update({ instantTrip: e.target.checked })}
        />
        <label
          htmlFor={`instantTrip_${prot.id}`}
          style={{ color: '#9E9E9E', fontSize: 11, cursor: 'pointer' }}
        >
          Momentanutkobling (I &gt; I_instant)
        </label>
      </div>

      {prot.instantTrip && (
        <>
          <label style={labelStyle}>I_instant [A]</label>
          <input
            type="number"
            min={1}
            step={50}
            value={prot.instantCurrentA ?? 800}
            onChange={(e) => update({ instantCurrentA: +e.target.value })}
            style={inputStyle}
          />
          <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 8 }}>
            Typisk 8–12 × I_n. Utløser umiddelbart (t ≈ 0).
          </div>
        </>
      )}

      {ik3pMinA !== null && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: '#0A1520', borderRadius: 4, border: '1px solid #1E3A5F' }}>
          <div style={{ color: '#607D8B', fontSize: 10, marginBottom: 4 }}>Kortslutningskontroll (Sprint 5)</div>
          <div style={{ color: '#9E9E9E', fontSize: 10 }}>
            I&#x2033;k3p_min = {(ik3pMinA / 1000).toFixed(3)} kA
          </div>
          <div style={{ fontSize: 10, color: isSensitive ? '#4CAF50' : '#EF5350', marginTop: 2 }}>
            {isSensitive
              ? '✓ Vernet er følsomt nok (I_s < I″k3p_min)'
              : '✗ Ikke følsomt nok — I_s ≥ I″k3p_min'}
          </div>
          {tripTimeAtIk !== null && isFinite(tripTimeAtIk) && (
            <div style={{ fontSize: 10, color: '#4FC3F7', marginTop: 2 }}>
              t(I&#x2033;k3p_min) = {tripTimeAtIk.toFixed(3)} s
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#607D8B', fontSize: 10, marginBottom: 2,
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1A2A3A', border: '1px solid #374151', borderRadius: 4,
  color: '#E8F0FE', padding: '4px 8px', fontSize: 12, marginBottom: 8, boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
  background: '#0D3B66', color: '#E8F0FE', border: '1px solid #1565C0',
  borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer',
};
