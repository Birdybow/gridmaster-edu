import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcSolar } from '../../core/production.js';
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
}

function Field({ label, unit, hint, value, onChange, step = '0.1', min, max, valid = true }: FieldProps) {
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
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: '#131F2E',
            border: `1px solid ${valid ? '#1E3A5F' : '#EF4444'}`,
            borderRadius: 4,
            color: '#E8F0FE',
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

export function SolarEditor({ gen }: { gen: Generator }) {
  const updateGenerator = useNetworkStore((s) => s.updateGenerator);

  const Ppeak = gen.solarPeakMW ?? gen.ratedMVA;
  const t = gen.solarHour ?? 13;
  const trise = 6.0;
  const tset = 20.0;

  const pCalcMW = calcSolar(Ppeak, t, trise, tset);
  const pStatic = Ppeak * 0.5;

  function patch(p: Partial<Generator>) {
    updateGenerator(gen.id, p);
  }

  const sunIcon =
    t < trise ? '🌙' : t > tset ? '🌙' : t < 8 || t > 18 ? '🌅' : '☀';

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ background: '#F57F17', color: '#FFF', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          ☀ Solkraft
        </span>
      </div>

      <Field
        label="Installert toppeffekt P_peak"
        unit="MW"
        hint="Total installert DC-toppeffekt (typisk 0.5–500 MW)"
        value={Ppeak}
        step="0.1"
        min={0.01}
        onChange={(v) => patch({ solarPeakMW: parseFloat(v) || 1 })}
        valid={Ppeak > 0}
      />

      <Field
        label={`Simuleringstidspunkt ${sunIcon}`}
        unit="time (0–24)"
        hint="Tidspunkt i simuleringen for P(t)-kurve. Soloppgang 06:00, solnedgang 20:00"
        value={t}
        step="0.5"
        min={0}
        max={24}
        onChange={(v) => patch({ solarHour: parseFloat(v) ?? 13 })}
        valid={t >= 0 && t <= 24}
      />

      <div style={{ fontSize: 10, color: '#607D8B', marginTop: -6, marginBottom: 10, paddingLeft: 14 }}>
        Soloppgang {trise}:00 — Solnedgang {tset}:00
      </div>

      <div
        style={{
          background: '#2A1A00',
          border: '1px solid #F57F17',
          borderRadius: 6,
          padding: '8px 12px',
          marginTop: 4,
        }}
      >
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>Effekt ved t={t.toFixed(1)} time</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#FFB300' }}>
          {pCalcMW.toFixed(3)} MW
        </div>
        <div style={{ fontSize: 11, color: '#4A5568', marginTop: 4 }}>
          Statisk snitt (P_peak × 0.5): {pStatic.toFixed(2)} MW
        </div>
        <div style={{ fontSize: 10, color: '#4A5568' }}>
          P = P_peak · sin(π·(t-{trise})/{tset-trise})
        </div>
      </div>
    </div>
  );
}
