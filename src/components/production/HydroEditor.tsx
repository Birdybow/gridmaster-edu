import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcHydro } from '../../core/production.js';
import type { Generator } from '../../types/index.js';

interface FieldProps {
  label: string;
  unit: string;
  hint: string;
  value: number;
  onChange: (v: string) => void;
  min?: number;
  step?: string;
  valid?: boolean;
}

function Field({ label, unit, hint, value, onChange, min, step = '1', valid = true }: FieldProps) {
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

const TURBINE_DEFAULTS: Record<string, { H: number; Q: number; eta: number }> = {
  hydro_francis: { H: 200, Q: 50, eta: 92 },
  hydro_pelton: { H: 600, Q: 10, eta: 90 },
  hydro_kaplan: { H: 20, Q: 200, eta: 91 },
};

const TURBINE_LABELS: Record<string, string> = {
  hydro_francis: 'Francis',
  hydro_pelton: 'Pelton',
  hydro_kaplan: 'Kaplan',
};

const TURBINE_RANGES: Record<string, string> = {
  hydro_francis: 'H: 40–600 m, Q: 10–700 m³/s',
  hydro_pelton: 'H: 300–1800 m, Q: 0.5–50 m³/s',
  hydro_kaplan: 'H: 5–40 m, Q: 100–1000 m³/s',
};

export function HydroEditor({ gen }: { gen: Generator }) {
  const updateGenerator = useNetworkStore((s) => s.updateGenerator);
  const defaults = TURBINE_DEFAULTS[gen.generatorType] ?? TURBINE_DEFAULTS.hydro_francis;

  const H = gen.headM ?? defaults.H;
  const Q = gen.flowM3s ?? defaults.Q;
  const etaPct = gen.efficiencyPct ?? defaults.eta;
  const eta = etaPct / 100;

  const pCalcMW = calcHydro(H, Q, eta);

  function patch(p: Partial<Generator>) {
    updateGenerator(gen.id, p);
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ background: '#1565C0', color: '#FFF', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <img src="/icons/hydro.png" alt="Vannkraft" style={{ width: 14, height: 14, objectFit: 'cover', borderRadius: 2 }} />
          {TURBINE_LABELS[gen.generatorType]}
        </span>
        <span style={{ fontSize: 10, color: '#607D8B' }}>{TURBINE_RANGES[gen.generatorType]}</span>
      </div>

      <Field
        label="Fallhøyde H"
        unit="m"
        hint="Nettofallhøyde fra inntaksnivå til turbinnivå"
        value={H}
        step="1"
        min={1}
        onChange={(v) => patch({ headM: parseFloat(v) || defaults.H })}
        valid={H > 0}
      />

      <Field
        label="Vannføring Q"
        unit="m³/s"
        hint="Volumstrøm gjennom turbinen"
        value={Q}
        step="1"
        min={0.1}
        onChange={(v) => patch({ flowM3s: parseFloat(v) || defaults.Q })}
        valid={Q > 0}
      />

      <Field
        label="Virkningsgrad η"
        unit="%"
        hint="Total turbinvirkningsgrad inkl. generator (typisk 88–94%)"
        value={etaPct}
        step="0.5"
        min={1}
        onChange={(v) => patch({ efficiencyPct: parseFloat(v) || defaults.eta })}
        valid={etaPct > 0 && etaPct <= 100}
      />

      <div
        style={{
          background: '#0F3B55',
          border: '1px solid #1565C0',
          borderRadius: 6,
          padding: '8px 12px',
          marginTop: 4,
        }}
      >
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>Beregnet effekt</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#4FC3F7' }}>
          {pCalcMW.toFixed(3)} MW
        </div>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 2 }}>
          P = η · ρ · g · H · Q / 10⁶ = {eta.toFixed(2)} × 1000 × 9.81 × {H} × {Q} / 10⁶
        </div>
      </div>
    </div>
  );
}
