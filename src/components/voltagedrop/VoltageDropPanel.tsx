import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { VoltageDropModel } from '../../store/useNetworkStore.js';

const MODEL_OPTIONS: { value: VoltageDropModel; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', desc: '< 50 km → enkel, ≥ 50 km → pi' },
  { value: 'simple', label: 'Enkel', desc: 'Ingen kapasitans (< 50 km)' },
  { value: 'pi', label: 'Pi-modell', desc: 'Med shunt-kapasitans (≥ 50 km)' },
];

const REN_GREEN = 5;
const REN_YELLOW = 10;

function statusColor(pct: number) {
  if (pct < REN_GREEN) return '#4CAF50';
  if (pct < REN_YELLOW) return '#FFB74D';
  return '#EF5350';
}

interface Props {
  onClose: () => void;
}

export function VoltageDropPanel({ onClose }: Props) {
  const voltageDropModel = useNetworkStore((s) => s.voltageDropModel);
  const setVoltageDropModel = useNetworkStore((s) => s.setVoltageDropModel);
  const runVoltageDrop = useNetworkStore((s) => s.runVoltageDrop);
  const powerFlowStatus = useNetworkStore((s) => s.powerFlowStatus);
  const rawResults = useNetworkStore((s) => s.project.results.voltageDrop);
  const lines = useNetworkStore((s) => s.project.lines);
  const results = rawResults ?? [];

  const canRun = powerFlowStatus === 'converged';
  const worst = results.length > 0
    ? results.reduce((a, b) => (b.deltaUPercent > a.deltaUPercent ? b : a))
    : null;

  return (
    <div style={{ background: '#0D1B2A', border: '1px solid #1E3A5F', borderRadius: 8, overflow: 'hidden', minWidth: 320 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#0F2A45', borderBottom: '1px solid #1E3A5F' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#4FC3F7' }}>Spenningsfall</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Model selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 6 }}>BEREGNINGSMODELL</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setVoltageDropModel(opt.value)}
                title={opt.desc}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  fontSize: 11,
                  fontWeight: voltageDropModel === opt.value ? 700 : 400,
                  background: voltageDropModel === opt.value ? '#0F2A45' : '#0D1B2A',
                  border: `1px solid ${voltageDropModel === opt.value ? '#4FC3F7' : '#1E3A5F'}`,
                  color: voltageDropModel === opt.value ? '#4FC3F7' : '#607D8B',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#4A5568', marginTop: 4 }}>
            {MODEL_OPTIONS.find((o) => o.value === voltageDropModel)?.desc}
          </div>
        </div>

        {/* REN 4100 thresholds legend */}
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          {[
            { color: '#4CAF50', label: '< 5% OK' },
            { color: '#FFB74D', label: '5–10% Advarsel' },
            { color: '#EF5350', label: '≥ 10% Brudd' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 10, color: '#9E9E9E' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Status */}
        {!canRun && (
          <div style={{ fontSize: 11, color: '#FFB74D', marginBottom: 10, padding: '6px 8px', background: '#1A1200', border: '1px solid #5D4037', borderRadius: 4 }}>
            Kjør lastflyt først for å beregne spenningsfall.
          </div>
        )}

        {/* Beregn button */}
        <button
          onClick={runVoltageDrop}
          disabled={!canRun}
          style={{
            width: '100%',
            padding: '7px 0',
            fontSize: 12,
            fontWeight: 700,
            background: canRun ? '#0F2A45' : '#0D1B2A',
            border: `1px solid ${canRun ? '#4FC3F7' : '#1E3A5F'}`,
            color: canRun ? '#4FC3F7' : '#37474F',
            borderRadius: 4,
            cursor: canRun ? 'pointer' : 'not-allowed',
            marginBottom: 12,
          }}
        >
          ⚡ Beregn spenningsfall for alle linjer
        </button>

        {/* Worst-case summary */}
        {worst && (
          <div
            style={{
              background: '#0A1520',
              border: `1px solid ${statusColor(worst.deltaUPercent)}`,
              borderRadius: 6,
              padding: '8px 12px',
            }}
          >
            <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4 }}>
              {results.length} linje{results.length !== 1 ? 'r' : ''} beregnet — høyeste spenningsfall:
            </div>
            {(() => {
              const line = lines.find((l) => l.id === worst.lineId);
              return (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: statusColor(worst.deltaUPercent) }}>
                    {worst.deltaUPercent.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 11, color: '#9E9E9E' }}>
                    {line?.name ?? worst.lineId} — {worst.model === 'pi' ? 'pi-modell' : 'enkel modell'}
                  </div>
                  <div style={{ fontSize: 10, color: '#607D8B', marginTop: 2 }}>
                    ΔU = {worst.deltaUVolts.toFixed(0)} V · U_mot = {worst.uReceivingKV.toFixed(3)} kV
                  </div>
                  {!worst.withinLimits && (
                    <div style={{ fontSize: 10, color: '#EF5350', marginTop: 4 }}>
                      ⚠ {worst.renReference}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
