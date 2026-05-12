import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { Bus, BusType, VoltageLevel } from '../../types/index.js';

const VOLTAGE_LEVELS: VoltageLevel[] = [0.23, 0.4, 11, 22, 66, 132, 300, 420];

interface FieldProps {
  label: string;
  unit?: string;
  hint: string;
  value: number | string;
  onChange: (v: string) => void;
  valid?: boolean;
  type?: 'number' | 'text';
  step?: string;
  readOnly?: boolean;
}

function Field({ label, unit, hint, value, onChange, valid, type = 'number', step, readOnly }: FieldProps) {
  const isValid = valid !== false;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <label style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600 }}>{label}</label>
        {unit && <span style={{ fontSize: 10, color: '#607D8B' }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isValid ? '#4CAF50' : '#EF4444',
            flexShrink: 0,
          }}
        />
        <input
          type={type}
          value={value}
          step={step}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: readOnly ? '#0D1B2A' : '#131F2E',
            border: `1px solid ${isValid ? '#1E3A5F' : '#EF4444'}`,
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '4px 8px',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3, lineHeight: 1.4 }}>
        💡 {hint}
      </div>
    </div>
  );
}

export function BusEditor() {
  const selectedNodeId = useNetworkStore((s) => s.selectedNodeId);
  const buses = useNetworkStore((s) => s.project.buses);
  const updateBus = useNetworkStore((s) => s.updateBus);

  const bus = buses.find((b) => b.id === selectedNodeId);
  if (!bus) return null;

  function patch(p: Partial<Bus>) {
    updateBus(bus!.id, p);
  }

  const typeLabels: Record<BusType, string> = { slack: 'Slack', PV: 'PV', PQ: 'PQ' };
  const typeColors: Record<BusType, string> = { slack: '#4FC3F7', PV: '#66BB6A', PQ: '#CE93D8' };

  return (
    <div style={{ padding: '14px 14px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span
          style={{
            background: typeColors[bus.type],
            color: '#0D1B2A',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {typeLabels[bus.type]}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FE' }}>Buss-editor</span>
      </div>

      <Field
        label="Navn"
        hint="Beskrivende navn på bussnoden"
        type="text"
        value={bus.name}
        onChange={(v) => patch({ name: v })}
        valid={bus.name.trim().length > 0}
      />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>Busstype</div>
        <select
          value={bus.type}
          onChange={(e) => patch({ type: e.target.value as BusType })}
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
          <option value="slack">Slack (referansebuss)</option>
          <option value="PV">PV (generatorbuss)</option>
          <option value="PQ">PQ (lastbuss)</option>
        </select>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
          💡 Slack: holder V og δ fast. PV: holder V og P fast. PQ: last med fast P og Q.
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>Spenningsnivå</div>
        <select
          value={bus.voltageKV}
          onChange={(e) => patch({ voltageKV: Number(e.target.value) as VoltageLevel })}
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
          {VOLTAGE_LEVELS.map((v) => (
            <option key={v} value={v}>{v} kV</option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
          💡 Nominell spenning for dette spenningsnivået
        </div>
      </div>

      <Field
        label="V satt"
        unit="p.u."
        hint="Ønsket spenningsnorm for Slack/PV-buss (1.0 = nominell)"
        value={bus.vSetPU}
        step="0.001"
        onChange={(v) => patch({ vSetPU: parseFloat(v) || 1.0 })}
        valid={bus.vSetPU >= 0.9 && bus.vSetPU <= 1.1}
      />

      {(bus.type === 'PQ' || bus.type === 'PV') && (
        <Field
          label="Last P"
          unit="MW"
          hint="Aktiv lasteffekt. Positiv = forbruk, negativ = produksjon"
          value={bus.loadMW}
          step="0.1"
          onChange={(v) => patch({ loadMW: parseFloat(v) || 0 })}
          valid={true}
        />
      )}

      {bus.type === 'PQ' && (
        <Field
          label="Last Q"
          unit="MVAr"
          hint="Reaktiv lasteffekt. Positiv = induktiv last (typisk for motorer)"
          value={bus.loadMVAr}
          step="0.1"
          onChange={(v) => patch({ loadMVAr: parseFloat(v) || 0 })}
          valid={true}
        />
      )}

      {(bus.type === 'PV' || bus.type === 'slack') && (
        <Field
          label="Generator P"
          unit="MW"
          hint="Produksjon fra generator på denne busset"
          value={bus.genMW ?? 0}
          step="0.1"
          onChange={(v) => patch({ genMW: parseFloat(v) || 0 })}
          valid={(bus.genMW ?? 0) >= 0}
        />
      )}

      <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: 10, marginTop: 4 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4, fontWeight: 600 }}>VERNDATA</div>
        <Field
          label="Bryterevne (cb_rating)"
          unit="kA"
          hint="Bryterens kortslutningsevne [kA]. Standard 16 kA for 22 kV-nett."
          value={bus.cbRatingKA ?? 16}
          step="0.5"
          onChange={(v) => patch({ cbRatingKA: parseFloat(v) || 16 })}
          valid={(bus.cbRatingKA ?? 16) > 0}
        />
      </div>

      <div
        style={{
          borderTop: '1px solid #1E3A5F',
          paddingTop: 10,
          marginTop: 4,
        }}
      >
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4, fontWeight: 600 }}>GRENSER</div>
        <Field
          label="V max"
          unit="p.u."
          hint="Øvre spenningsgrense (EN 50160: typisk 1.10)"
          value={bus.vMaxPU}
          step="0.01"
          onChange={(v) => patch({ vMaxPU: parseFloat(v) || 1.05 })}
          valid={bus.vMaxPU > bus.vMinPU}
        />
        <Field
          label="V min"
          unit="p.u."
          hint="Nedre spenningsgrense (EN 50160: typisk 0.90)"
          value={bus.vMinPU}
          step="0.01"
          onChange={(v) => patch({ vMinPU: parseFloat(v) || 0.95 })}
          valid={bus.vMinPU < bus.vMaxPU}
        />
      </div>
    </div>
  );
}
