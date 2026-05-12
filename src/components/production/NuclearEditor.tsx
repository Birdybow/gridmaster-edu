import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcNuclear } from '../../core/production.js';
import type { Generator } from '../../types/index.js';

interface FieldProps {
  label: string;
  unit: string;
  hint: string;
  value: number;
  onChange: (v: string) => void;
  step?: string;
  min?: number;
  max?: number;
  valid?: boolean;
  readOnly?: boolean;
}

function Field({ label, unit, hint, value, onChange, step = '1', min, max, valid = true, readOnly }: FieldProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <label style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600 }}>{label}</label>
        <span style={{ fontSize: 10, color: '#607D8B' }}>{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: valid ? '#4CAF50' : '#EF4444', flexShrink: 0 }} />
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: readOnly ? '#0D1B2A' : '#131F2E',
            border: `1px solid ${valid ? '#1E3A5F' : '#EF4444'}`,
            borderRadius: 4,
            color: readOnly ? '#607D8B' : '#E8F0FE',
            padding: '4px 8px',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>💡 {hint}</div>
    </div>
  );
}

const isNuclear = (type: string) => type === 'nuclear';

export function NuclearEditor({ gen }: { gen: Generator }) {
  const updateGenerator = useNetworkStore((s) => s.updateGenerator);

  const utilizationPct = gen.utilizationPct ?? 100;
  const Pn = gen.ratedMVA * (utilizationPct / 100);
  const pCalcMW = calcNuclear(Pn);

  function patch(p: Partial<Generator>) {
    updateGenerator(gen.id, p);
  }

  const nuclear = isNuclear(gen.generatorType);
  const color = nuclear ? '#B71C1C' : '#E65100';
  const icon = nuclear ? '⚛' : '🔥';
  const label = nuclear ? 'Kjernekraft' : 'Termisk';
  const defaultRated = nuclear ? 1000 : 400;

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ background: color, color: '#FFF', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/icons/nuclear.png" alt={label} style={{ width: 14, height: 14, objectFit: 'cover', borderRadius: 2 }} />
          {label}
        </span>
        <span style={{ fontSize: 10, color: '#607D8B' }}>Baselast — konstant effekt</span>
      </div>

      <Field
        label="Nominell effekt P_n"
        unit="MW"
        hint={nuclear ? 'Reaktorens termiske effekt omregnet til elektrisk (typisk 900–1600 MW)' : 'Installert elektrisk effekt (typisk 200–800 MW)'}
        value={gen.ratedMVA}
        step="10"
        min={1}
        onChange={(v) => patch({ ratedMVA: parseFloat(v) || defaultRated })}
        valid={gen.ratedMVA > 0}
      />

      <Field
        label="Utnyttelsesgrad"
        unit="%"
        hint="Andel av installert kapasitet i drift (typisk 85–100% for baselast)"
        value={utilizationPct}
        step="1"
        min={0}
        max={100}
        onChange={(v) => patch({ utilizationPct: Math.min(100, Math.max(0, parseFloat(v) || 100)) })}
        valid={utilizationPct >= 0 && utilizationPct <= 100}
      />

      <Field
        label="Driftseffekt"
        unit="MW"
        hint="P_n × utnyttelsesgrad / 100"
        value={parseFloat(Pn.toFixed(1))}
        onChange={() => {}}
        readOnly
        valid
      />

      <div
        style={{
          background: nuclear ? '#1A0000' : '#1A0A00',
          border: `1px solid ${color}`,
          borderRadius: 6,
          padding: '8px 12px',
          marginTop: 4,
        }}
      >
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>Beregnet effekt (konstant)</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: nuclear ? '#EF9A9A' : '#FFCC80' }}>
          {pCalcMW.toFixed(1)} MW
        </div>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 2 }}>
          Baselast — ingen variasjon over tid
        </div>
      </div>
    </div>
  );
}
