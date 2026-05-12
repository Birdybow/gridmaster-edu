import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { Compensator } from '../../types/index.js';

interface FieldProps {
  label: string;
  unit?: string;
  hint: string;
  value: number | string;
  onChange: (v: string) => void;
  valid?: boolean;
  step?: string;
  readOnly?: boolean;
}

function Field({ label, unit, hint, value, onChange, valid, step, readOnly }: FieldProps) {
  const isValid = valid !== false;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <label style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600 }}>{label}</label>
        {unit && <span style={{ fontSize: 10, color: '#607D8B' }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isValid ? '#4CAF50' : '#EF4444', flexShrink: 0 }} />
        <input
          type="number"
          value={value}
          step={step}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: readOnly ? '#0D1B2A' : '#131F2E',
            border: `1px solid ${isValid ? '#1E3A5F' : '#EF4444'}`,
            borderRadius: 4,
            color: readOnly ? '#607D8B' : '#E8F0FE',
            padding: '4px 8px',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3, lineHeight: 1.4 }}>💡 {hint}</div>
    </div>
  );
}

export function CompensatorEditor() {
  const selectedNodeId = useNetworkStore((s) => s.selectedNodeId);
  const compensators = useNetworkStore((s) => s.project.compensators);
  const buses = useNetworkStore((s) => s.project.buses);
  const removeCompensator = useNetworkStore((s) => s.removeCompensator);
  const addCompensator = useNetworkStore((s) => s.addCompensator);

  // selectedNodeId for compensator is 'comp_<id>'
  const compId = selectedNodeId?.startsWith('comp_') ? selectedNodeId.slice(5) : null;
  const comp = compId ? compensators.find((c) => c.id === compId) : null;
  const bus = comp ? buses.find((b) => b.id === comp.busId) : null;

  if (!comp) return null;

  function patch(p: Partial<Compensator>) {
    if (!comp) return;
    removeCompensator(comp.id);
    const updated = { ...comp, ...p };
    if (p.totalMVAr !== undefined || p.steps !== undefined) {
      const total = p.totalMVAr ?? comp.totalMVAr;
      const steps = p.steps ?? comp.steps;
      updated.stepSizeMVAr = steps > 0 ? total / steps : 0;
    }
    addCompensator(updated);
  }

  const typeLabel = comp.type === 'capacitor' ? 'Kondensator' : comp.type === 'reactor' ? 'Reaktor' : 'STATCOM';

  return (
    <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ background: '#AB47BC', color: '#FFF', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          🔵 {typeLabel}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FE' }}>Kompensator-editor</span>
      </div>

      {bus && (
        <div style={{ fontSize: 11, color: '#607D8B', marginBottom: 10 }}>
          Tilkoblet: {bus.name}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>Type</div>
        <select
          value={comp.type}
          onChange={(e) => patch({ type: e.target.value as Compensator['type'] })}
          style={{
            width: '100%',
            background: '#131F2E',
            border: '1px solid #1E3A5F',
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '4px 8px',
            fontSize: 12,
          }}
        >
          <option value="capacitor">Kondensatorbank</option>
          <option value="reactor">Reaktor</option>
          <option value="statcom">STATCOM</option>
        </select>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
          💡 Kondensator: leverer reaktiv effekt (Q+). Reaktor: absorberer Q.
        </div>
      </div>

      <Field
        label="Total kapasitet"
        unit="MVAr"
        hint="Total reaktiv kapasitet for alle trinn tilsammen"
        value={comp.totalMVAr}
        step="0.1"
        onChange={(v) => patch({ totalMVAr: parseFloat(v) || 0 })}
        valid={comp.totalMVAr > 0}
      />

      <Field
        label="Antall trinn"
        unit=""
        hint="Antall kobling-trinn. Gir mulighet for stegvis regulering"
        value={comp.steps}
        step="1"
        onChange={(v) => patch({ steps: parseInt(v) || 1 })}
        valid={comp.steps >= 1}
      />

      <Field
        label="Trinnstørrelse"
        unit="MVAr"
        hint="Kapasitet per trinn (beregnes automatisk)"
        value={comp.stepSizeMVAr.toFixed(4)}
        step="0.001"
        onChange={() => {}}
        readOnly
        valid={true}
      />

      <Field
        label="Aktive trinn"
        unit=""
        hint="Antall trinn som er koblet inn nå"
        value={comp.stepsEnabled}
        step="1"
        onChange={(v) => patch({ stepsEnabled: Math.min(comp.steps, Math.max(0, parseInt(v) || 0)) })}
        valid={comp.stepsEnabled >= 0 && comp.stepsEnabled <= comp.steps}
      />

      <div style={{ padding: '8px', background: '#131F2E', borderRadius: 6, fontSize: 11, color: '#607D8B', marginTop: 4 }}>
        Aktiv kapasitet: {(comp.stepSizeMVAr * comp.stepsEnabled).toFixed(3)} MVAr
      </div>

      <button
        onClick={() => removeCompensator(comp.id)}
        style={{
          marginTop: 12,
          background: '#3B1A1A',
          border: '1px solid #EF4444',
          borderRadius: 5,
          color: '#EF4444',
          padding: '5px 12px',
          cursor: 'pointer',
          fontSize: 11,
          width: '100%',
        }}
      >
        Fjern kondensatorbank
      </button>
    </div>
  );
}
