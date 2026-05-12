import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcWind } from '../../core/production.js';
import type { Generator } from '../../types/index.js';

interface FieldProps {
  label: string;
  unit: string;
  hint: string;
  value: number;
  onChange: (v: string) => void;
  step?: string;
  min?: number;
  valid?: boolean;
}

function Field({ label, unit, hint, value, onChange, step = '0.1', min, valid = true }: FieldProps) {
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

export function WindEditor({ gen }: { gen: Generator }) {
  const updateGenerator = useNetworkStore((s) => s.updateGenerator);

  const vci = gen.cutInMs ?? 3;
  const vr = gen.ratedWindMs ?? 13;
  const vco = gen.cutOutMs ?? 25;
  const Pn = gen.windRatedMW ?? gen.ratedMVA;
  const n = gen.numTurbines ?? 1;
  const v = vr; // use rated wind speed as reference for display

  const pCalcMW = calcWind(v, vci, vr, vco, Pn, n);
  const pAtV10 = calcWind(10, vci, vr, vco, Pn, n);

  function patch(p: Partial<Generator>) {
    updateGenerator(gen.id, p);
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ background: '#2E7D32', color: '#FFF', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/icons/wind.png" alt="Vindkraft" style={{ width: 14, height: 14, objectFit: 'cover', borderRadius: 2 }} />
          Vindkraft
        </span>
      </div>

      <Field
        label="Antall turbiner"
        unit="stk"
        hint="Antall vindturbiner i parken"
        value={n}
        step="1"
        min={1}
        onChange={(v) => patch({ numTurbines: Math.max(1, parseInt(v) || 1) })}
        valid={n >= 1}
      />

      <Field
        label="Merkeeffekt P_n per turbin"
        unit="MW"
        hint="Nominell effekt per turbin ved merkevindhastighet"
        value={Pn}
        step="0.1"
        min={0.1}
        onChange={(v) => patch({ windRatedMW: parseFloat(v) || 3 })}
        valid={Pn > 0}
      />

      <div style={{ borderTop: '1px solid #1E3A5F', marginTop: 4, paddingTop: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4, fontWeight: 600 }}>P(v)-KURVE PARAMETERE</div>
      </div>

      <Field
        label="Innkoplingshastighet v_ci"
        unit="m/s"
        hint="Minimum vindhastighet for produksjon (typisk 3 m/s)"
        value={vci}
        step="0.5"
        min={0}
        onChange={(v) => patch({ cutInMs: parseFloat(v) || 3 })}
        valid={vci >= 0 && vci < vr}
      />

      <Field
        label="Merkevindhastighet v_r"
        unit="m/s"
        hint="Vindhastighet ved full merkeeffekt (typisk 12–14 m/s)"
        value={vr}
        step="0.5"
        min={1}
        onChange={(v) => patch({ ratedWindMs: parseFloat(v) || 13 })}
        valid={vr > vci && vr < vco}
      />

      <Field
        label="Utkoplingshastighet v_co"
        unit="m/s"
        hint="Storm-grense for sikkerhetsstopp (typisk 25 m/s)"
        value={vco}
        step="0.5"
        min={1}
        onChange={(v) => patch({ cutOutMs: parseFloat(v) || 25 })}
        valid={vco > vr}
      />

      <div
        style={{
          background: '#0F3B1E',
          border: '1px solid #2E7D32',
          borderRadius: 6,
          padding: '8px 12px',
          marginTop: 4,
        }}
      >
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>Effekt ved merkevindhastighet ({vr} m/s)</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#66BB6A' }}>
          {pCalcMW.toFixed(2)} MW
        </div>
        <div style={{ fontSize: 11, color: '#4A5568', marginTop: 4 }}>
          v=10 m/s: {pAtV10.toFixed(2)} MW &nbsp;|&nbsp; {n} turbin{n !== 1 ? 'er' : ''}
        </div>
      </div>
    </div>
  );
}
