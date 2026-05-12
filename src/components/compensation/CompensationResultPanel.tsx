import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { CompensationResult } from '../../types/index.js';
import { getBusName } from '../../utils/display.js';

interface CompensationResultPanelProps {
  results: CompensationResult[];
  onClose: () => void;
}

function Row({ label, before, after, unit, digits = 2, lowerIsBetter = true }: {
  label: string;
  before: number;
  after: number;
  unit: string;
  digits?: number;
  lowerIsBetter?: boolean;
}) {
  const improved = lowerIsBetter ? after < before : after > before;
  const deltaColor = improved ? '#81C784' : '#EF9A9A';
  const delta = after - before;

  return (
    <tr>
      <td style={{ color: '#9E9E9E', padding: '4px 8px 4px 0', fontSize: 12 }}>{label}</td>
      <td style={{ padding: '4px 8px', textAlign: 'right', fontSize: 12 }}>{before.toFixed(digits)}</td>
      <td style={{ padding: '4px 8px', textAlign: 'right', fontSize: 12, color: '#4FC3F7' }}>{after.toFixed(digits)}</td>
      <td style={{ padding: '4px 4px', textAlign: 'right', fontSize: 11, color: deltaColor }}>
        {delta >= 0 ? '+' : ''}{delta.toFixed(digits)} {unit}
      </td>
    </tr>
  );
}

export function CompensationResultPanel({ results, onClose }: CompensationResultPanelProps) {
  const buses = useNetworkStore((s) => s.project.buses);
  if (results.length === 0) return null;

  const tableHeader: React.CSSProperties = {
    color: '#757575',
    fontSize: 11,
    padding: '4px 8px',
    borderBottom: '1px solid #1E3A5F',
    textAlign: 'right' as const,
  };

  return (
    <div
      style={{
        background: '#0F1F30',
        borderTop: '1px solid #4A148C',
        padding: '12px 16px',
        maxHeight: 300,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, color: '#CE93D8', fontSize: 13 }}>
          Kompenserings-resultat — Sammenligning før / etter
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {results.map((r) => (
        <div key={r.busId} style={{ marginBottom: 16 }}>
          <div style={{ color: '#AB47BC', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
            Buss: {getBusName(r.busId, buses)}
            <span style={{ color: '#9E9E9E', fontWeight: 400, marginLeft: 8 }}>
              {new Date(r.timestamp).toLocaleTimeString('nb-NO')}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...tableHeader, textAlign: 'left' }}>Størrelse</th>
                <th style={tableHeader}>Før</th>
                <th style={tableHeader}>Etter</th>
                <th style={tableHeader}>Δ</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Q_reaktiv [MVAr]"
                before={r.before.qMVAr} after={r.after.qResidualMVAr} unit="MVAr" digits={3} />
              <Row label="Q_komp [MVAr]"
                before={0} after={r.after.qKompMVAr} unit="MVAr" digits={3} lowerIsBetter={false} />
              <Row label="S tilsynelatende [MVA]"
                before={r.before.sMVA} after={r.after.sMVA} unit="MVA" digits={3} />
              <Row label="cosφ"
                before={r.before.cosPhi} after={r.after.cosPhi} unit="" digits={4} lowerIsBetter={false} />
              <Row label="φ [grader]"
                before={r.before.phi1Deg} after={r.after.phi2Deg} unit="°" digits={2} />
              <Row label="Linjestrøm [A]"
                before={r.before.lineCurrentA} after={r.after.lineCurrentA} unit="A" digits={1} />
              <Row label="Linje-tap [kW]"
                before={r.before.lineLossesMW * 1000} after={r.after.lineLossesMW * 1000}
                unit="kW" digits={1} />
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div
              style={{
                flex: 1,
                background: '#0A1E10',
                border: '1px solid #2E7D32',
                borderRadius: 5,
                padding: '6px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#66BB6A', fontSize: 11 }}>Strømreduksjon</div>
              <div style={{ color: '#A5D6A7', fontWeight: 700, fontSize: 16 }}>
                {r.currentReductionPercent.toFixed(1)} %
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: '#0A1E10',
                border: '1px solid #2E7D32',
                borderRadius: 5,
                padding: '6px 10px',
                textAlign: 'center',
              }}
            >
              <div style={{ color: '#66BB6A', fontSize: 11 }}>Tap-reduksjon</div>
              <div style={{ color: '#A5D6A7', fontWeight: 700, fontSize: 16 }}>
                {r.lossReductionPercent.toFixed(1)} %
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
