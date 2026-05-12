import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { Transformer, TransformerVector } from '../../types/index.js';

interface FieldProps {
  label: string;
  unit?: string;
  hint: string;
  value: number | string;
  onChange: (v: string) => void;
  valid?: boolean;
  step?: string;
  type?: 'number' | 'text';
}

function Field({ label, unit, hint, value, onChange, valid, step, type = 'number' }: FieldProps) {
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
          type={type}
          value={value}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: '#131F2E',
            border: `1px solid ${isValid ? '#1E3A5F' : '#EF4444'}`,
            borderRadius: 4,
            color: '#E8F0FE',
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

const VECTOR_GROUPS: TransformerVector[] = ['Dyn11', 'Yyn0', 'YNyn0', 'Yd11', 'Dd0'];

export function TransformerEditor() {
  const selectedEdgeId = useNetworkStore((s) => s.selectedEdgeId);
  const transformers = useNetworkStore((s) => s.project.transformers);
  const buses = useNetworkStore((s) => s.project.buses);
  const updateTransformer = useNetworkStore((s) => s.updateTransformer);

  const trafo = transformers.find((t) => t.id === selectedEdgeId);
  if (!trafo) return null;

  function patch(p: Partial<Transformer>) {
    updateTransformer(trafo!.id, p);
  }

  const fromBus = buses.find((b) => b.id === trafo.fromBusId);
  const toBus = buses.find((b) => b.id === trafo.toBusId);

  return (
    <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ background: '#FFB74D', color: '#0D1B2A', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          🔄 Trafo
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FE' }}>Transformator-editor</span>
      </div>

      {fromBus && toBus && (
        <div style={{ fontSize: 11, color: '#607D8B', marginBottom: 10 }}>
          {fromBus.name} ({fromBus.voltageKV} kV) ↔ {toBus.name} ({toBus.voltageKV} kV)
        </div>
      )}

      <Field
        label="Navn"
        hint="Beskrivende navn på transformatoren"
        type="text"
        value={trafo.name}
        onChange={(v) => patch({ name: v })}
        valid={trafo.name.trim().length > 0}
      />

      <Field
        label="Yteevne"
        unit="MVA"
        hint="Nominell ytelse. Vanlige distribusjonstransformatorer: 0.1–1.6 MVA"
        value={trafo.ratedMVA}
        step="0.001"
        onChange={(v) => patch({ ratedMVA: parseFloat(v) || 0.315 })}
        valid={trafo.ratedMVA > 0}
      />

      <Field
        label="Spenning HV"
        unit="kV"
        hint="Høyspenningssidespesifikasjon (primær)"
        value={trafo.voltageHV_kV}
        step="1"
        onChange={(v) => patch({ voltageHV_kV: parseFloat(v) || 22 })}
        valid={trafo.voltageHV_kV > 0}
      />

      <Field
        label="Spenning LV"
        unit="kV"
        hint="Lavspenningssidespesifikasjon (sekundær)"
        value={trafo.voltageLV_kV}
        step="0.1"
        onChange={(v) => patch({ voltageLV_kV: parseFloat(v) || 0.4 })}
        valid={trafo.voltageLV_kV > 0}
      />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>Vektorgruppe</div>
        <select
          value={trafo.vectorGroup}
          onChange={(e) => patch({ vectorGroup: e.target.value as TransformerVector })}
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
          {VECTOR_GROUPS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
          💡 Dyn11: vanligst i Norge. D=delta HV, y=star LV, n=nøytral, 11=30° fase
        </div>
      </div>

      <Field
        label="Kortslutningsspenning ek"
        unit="%"
        hint="Spenning ved nominell kortslutningsstrøm. Typisk 4–6% for distribusjonstrafoer"
        value={trafo.ekPercent}
        step="0.1"
        onChange={(v) => patch({ ekPercent: parseFloat(v) || 4 })}
        valid={trafo.ekPercent > 0 && trafo.ekPercent < 20}
      />

      <Field
        label="Kobberlosser rr"
        unit="%"
        hint="Resistiv andel av kortslutningsspenning. Typisk 0.5–2%"
        value={trafo.rrPercent}
        step="0.01"
        onChange={(v) => patch({ rrPercent: parseFloat(v) || 1 })}
        valid={trafo.rrPercent >= 0}
      />

      <Field
        label="Tomgangslosser"
        unit="kW"
        hint="Kjernetap ved nominell spenning uten last"
        value={trafo.noLoadLossKW}
        step="0.1"
        onChange={(v) => patch({ noLoadLossKW: parseFloat(v) || 0 })}
        valid={trafo.noLoadLossKW >= 0}
      />

      <Field
        label="Kortslutningslosser"
        unit="kW"
        hint="Kobberlosser ved nominell last"
        value={trafo.loadLossKW}
        step="0.1"
        onChange={(v) => patch({ loadLossKW: parseFloat(v) || 0 })}
        valid={trafo.loadLossKW >= 0}
      />

      <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: 10, marginTop: 4 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4, fontWeight: 600 }}>TRINNKOBLER</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field
            label="Trinn min"
            hint="Laveste tappesteg"
            value={trafo.tapMin}
            step="1"
            onChange={(v) => patch({ tapMin: parseInt(v) || -5 })}
            valid={true}
          />
          <Field
            label="Trinn max"
            hint="Høyeste tappesteg"
            value={trafo.tapMax}
            step="1"
            onChange={(v) => patch({ tapMax: parseInt(v) || 5 })}
            valid={true}
          />
        </div>
        <Field
          label="Nåværende trinn"
          hint="Aktivt tappesteg (0 = nominalstilling)"
          value={trafo.tapCurrent}
          step="1"
          onChange={(v) => patch({ tapCurrent: parseInt(v) || 0 })}
          valid={trafo.tapCurrent >= trafo.tapMin && trafo.tapCurrent <= trafo.tapMax}
        />
      </div>
    </div>
  );
}
