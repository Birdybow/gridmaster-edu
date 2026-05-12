import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { GeneratorType } from '../../types/index.js';

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

const GEN_TYPES: { value: GeneratorType; label: string }[] = [
  { value: 'hydro_francis', label: 'Vannkraft Francis' },
  { value: 'hydro_pelton', label: 'Vannkraft Pelton' },
  { value: 'hydro_kaplan', label: 'Vannkraft Kaplan' },
  { value: 'wind', label: 'Vindkraft' },
  { value: 'nuclear', label: 'Kjernekraft' },
  { value: 'thermal', label: 'Termisk' },
  { value: 'solar', label: 'Solkraft' },
];

export function GeneratorEditor() {
  const selectedNodeId = useNetworkStore((s) => s.selectedNodeId);
  const generators = useNetworkStore((s) => s.project.generators);
  const buses = useNetworkStore((s) => s.project.buses);
  const addGenerator = useNetworkStore((s) => s.addGenerator);
  const updateGenerator = useNetworkStore((s) => s.updateGenerator);
  const removeGenerator = useNetworkStore((s) => s.removeGenerator);

  const gen = generators.find((g) => g.busId === selectedNodeId);
  const bus = buses.find((b) => b.id === selectedNodeId);

  if (!bus || (bus.type !== 'PV' && bus.type !== 'slack')) return null;

  function patchGen(p: Parameters<typeof updateGenerator>[1]) {
    if (gen) updateGenerator(gen.id, p);
  }

  if (!gen) {
    return (
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ background: '#66BB6A', color: '#0D1B2A', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
            ⚙ Generator
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#9E9E9E', marginBottom: 12 }}>
          Buss "{bus.name}" har ingen generator koblet til.
        </div>
        <button
          onClick={() => {
            addGenerator({
              id: crypto.randomUUID(),
              name: `Generator ${bus.name}`,
              busId: bus.id,
              generatorType: 'hydro_francis',
              ratedMVA: 10,
              ratedKV: 6.6,
              powerFactor: 0.90,
              xdSubtransientPU: 0.15,
              xdTransientPU: 0.20,
              xdSteadyStatePU: 1.0,
              pSetMW: 5.0,
              qMaxMVAr: 5.0,
              qMinMVAr: -2.0,
            });
          }}
          style={{
            background: '#1A5C3A',
            border: '1px solid #4CAF50',
            borderRadius: 5,
            color: '#E8F0FE',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          + Legg til generator
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ background: '#66BB6A', color: '#0D1B2A', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          ⚙ Generator
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FE' }}>Generator-editor</span>
      </div>

      <div style={{ fontSize: 11, color: '#607D8B', marginBottom: 10 }}>
        Tilkoblet: {bus.name}
      </div>

      <Field
        label="Navn"
        hint="Beskrivende navn på generatoren"
        type="text"
        value={gen.name}
        onChange={(v) => patchGen({ name: v })}
        valid={gen.name.trim().length > 0}
      />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>Generatortype</div>
        <select
          value={gen.generatorType}
          onChange={(e) => patchGen({ generatorType: e.target.value as GeneratorType })}
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
          {GEN_TYPES.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
          💡 Påvirker symbolikk og kortslutningsbidrag
        </div>
      </div>

      <Field
        label="Nominell ytelse"
        unit="MVA"
        hint="Generatorens nominelle tilsynelatende effekt"
        value={gen.ratedMVA}
        step="0.5"
        onChange={(v) => patchGen({ ratedMVA: parseFloat(v) || 10 })}
        valid={gen.ratedMVA > 0}
      />

      <Field
        label="Nominell spenning"
        unit="kV"
        hint="Generatorens terminalspenning (typisk 6.6 kV eller 11 kV)"
        value={gen.ratedKV}
        step="0.1"
        onChange={(v) => patchGen({ ratedKV: parseFloat(v) || 6.6 })}
        valid={gen.ratedKV > 0}
      />

      <Field
        label="Effektfaktor cos φ"
        unit=""
        hint="Nominell effektfaktor (typisk 0.85–0.95)"
        value={gen.powerFactor}
        step="0.01"
        onChange={(v) => patchGen({ powerFactor: parseFloat(v) || 0.9 })}
        valid={gen.powerFactor > 0 && gen.powerFactor <= 1}
      />

      <Field
        label={'x"d subtransient'}
        unit="p.u."
        hint="Subtransient reaktans — brukes ved kortslutningsberegning (typisk 0.10–0.20)"
        value={gen.xdSubtransientPU}
        step="0.01"
        onChange={(v) => patchGen({ xdSubtransientPU: parseFloat(v) || 0.15 })}
        valid={gen.xdSubtransientPU > 0}
      />

      <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: 10, marginTop: 4 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4, fontWeight: 600 }}>DRIFTSINNSTILLINGER</div>
        <Field
          label="P satt"
          unit="MW"
          hint="Aktiv produksjon i lastflyt"
          value={gen.pSetMW}
          step="0.1"
          onChange={(v) => patchGen({ pSetMW: parseFloat(v) || 0 })}
          valid={gen.pSetMW >= 0}
        />
        <Field
          label="Q max"
          unit="MVAr"
          hint="Maksimal reaktiv produksjon (kapasitiv grense)"
          value={gen.qMaxMVAr}
          step="0.1"
          onChange={(v) => patchGen({ qMaxMVAr: parseFloat(v) || 0 })}
          valid={gen.qMaxMVAr >= gen.qMinMVAr}
        />
        <Field
          label="Q min"
          unit="MVAr"
          hint="Minimal reaktiv produksjon (induktiv grense, ofte negativ)"
          value={gen.qMinMVAr}
          step="0.1"
          onChange={(v) => patchGen({ qMinMVAr: parseFloat(v) || 0 })}
          valid={gen.qMinMVAr <= gen.qMaxMVAr}
        />
      </div>

      <button
        onClick={() => removeGenerator(gen.id)}
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
        Fjern generator
      </button>
    </div>
  );
}
