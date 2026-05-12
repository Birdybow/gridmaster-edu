import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { Line } from '../../types/index.js';
import { LineLibrary } from './LineLibrary.js';
import type { LibraryCable } from './LineLibrary.js';

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

export function LineEditor() {
  const selectedEdgeId = useNetworkStore((s) => s.selectedEdgeId);
  const lines = useNetworkStore((s) => s.project.lines);
  const buses = useNetworkStore((s) => s.project.buses);
  const updateLine = useNetworkStore((s) => s.updateLine);

  const line = lines.find((l) => l.id === selectedEdgeId);
  if (!line) return null;

  function patch(p: Partial<Line>) {
    updateLine(line!.id, p);
  }

  function applyLibrary(cable: LibraryCable) {
    patch({ rOhmPerKm: cable.rOhmPerKm, xOhmPerKm: cable.xOhmPerKm, bMuSPerKm: cable.bMuSPerKm, cableRef: cable.id });
  }

  const fromBus = buses.find((b) => b.id === line.fromBusId);
  const toBus = buses.find((b) => b.id === line.toBusId);
  const typeLabel = line.lineType === 'overhead' ? '〰 Luftlinje' : '🔌 Jordkabel';
  const typeColor = line.lineType === 'overhead' ? '#4FC3F7' : '#81C784';

  return (
    <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ background: typeColor, color: '#0D1B2A', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
          {typeLabel}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E8F0FE' }}>Linje-editor</span>
      </div>

      {fromBus && toBus && (
        <div style={{ fontSize: 11, color: '#607D8B', marginBottom: 10 }}>
          {fromBus.name} ({fromBus.voltageKV} kV) → {toBus.name} ({toBus.voltageKV} kV)
        </div>
      )}

      <Field
        label="Navn"
        hint="Beskrivende navn på linjen"
        type="text"
        value={line.name}
        onChange={(v) => patch({ name: v })}
        valid={line.name.trim().length > 0}
      />

      <LineLibrary currentType={line.lineType} onSelect={applyLibrary} />

      <Field
        label="Lengde"
        unit="km"
        hint="Fysisk lengde på linjen. Brukes til å beregne totale linjedata"
        value={line.lengthKm}
        step="0.1"
        onChange={(v) => patch({ lengthKm: parseFloat(v) || 0 })}
        valid={line.lengthKm > 0}
      />

      <Field
        label="Motstand R"
        unit="Ω/km"
        hint="AC-motstand per km. For aluminium: typisk 0.2–0.6 Ω/km"
        value={line.rOhmPerKm}
        step="0.001"
        onChange={(v) => patch({ rOhmPerKm: parseFloat(v) || 0 })}
        valid={line.rOhmPerKm > 0}
      />

      <Field
        label="Reaktans X"
        unit="Ω/km"
        hint="Serieinduksjons-reaktans per km. Avhenger av avstand mellom faser"
        value={line.xOhmPerKm}
        step="0.001"
        onChange={(v) => patch({ xOhmPerKm: parseFloat(v) || 0 })}
        valid={line.xOhmPerKm > 0}
      />

      <Field
        label="Kapasitans B"
        unit="µS/km"
        hint="Ladnings-susceptans per km. Jordkabler har mye høyere B enn luftlinjer"
        value={line.bMuSPerKm}
        step="0.1"
        onChange={(v) => patch({ bMuSPerKm: parseFloat(v) || 0 })}
        valid={line.bMuSPerKm >= 0}
      />

      <Field
        label="Termisk grense"
        unit="MVA"
        hint="Maksimal tillatt belastning basert på termisk kapasitet"
        value={line.ratingMVA}
        step="0.5"
        onChange={(v) => patch({ ratingMVA: parseFloat(v) || 0 })}
        valid={line.ratingMVA > 0}
      />

      <div style={{ marginTop: 8, padding: '8px', background: '#131F2E', borderRadius: 6, fontSize: 11, color: '#607D8B' }}>
        <div>R total: {(line.rOhmPerKm * line.lengthKm).toFixed(3)} Ω</div>
        <div>X total: {(line.xOhmPerKm * line.lengthKm).toFixed(3)} Ω</div>
        <div>B total: {(line.bMuSPerKm * line.lengthKm).toFixed(1)} µS</div>
      </div>
    </div>
  );
}
