import { useNetworkStore } from '../../store/useNetworkStore.js';
import { getBusName } from '../../utils/display.js';

export function RingNetworkResultPanel() {
  const r = useNetworkStore((s) => s.ringNetworkResults);
  const buses = useNetworkStore((s) => s.project.buses);

  if (!r) return null;

  const col = (_v: number, loading: number) => {
    if (loading > 100) return '#EF5350';
    if (loading > 70) return '#FFB74D';
    return '#A5D6A7';
  };

  return (
    <div style={{ padding: '8px 12px', minWidth: 320 }}>
      <div style={{ fontWeight: 700, color: '#4CAF50', fontSize: 12, marginBottom: 6 }}>
        ⭕ Ringnett — Strømdeling
        <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 10, color: '#7FA8C9' }}>
          {r.topology === 'symmetric' ? 'Symmetrisk' : 'Asymmetrisk'}
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1B5E20' }}>
            <th style={{ textAlign: 'left', padding: '2px 6px', color: '#7FA8C9', fontWeight: 600 }}>Grein</th>
            <th style={{ textAlign: 'right', padding: '2px 6px', color: '#7FA8C9', fontWeight: 600 }}>Strøm [A]</th>
            <th style={{ textAlign: 'right', padding: '2px 6px', color: '#7FA8C9', fontWeight: 600 }}>Tap [kW]</th>
            <th style={{ textAlign: 'right', padding: '2px 6px', color: '#7FA8C9', fontWeight: 600 }}>Last [%]</th>
          </tr>
        </thead>
        <tbody>
          {r.branches.map((b, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #0A2A0A' }}>
              <td style={{ padding: '3px 6px', color: '#E8F0FE' }}>
                {getBusName(b.fromBusId, buses)} → {getBusName(b.toBusId, buses)}
              </td>
              <td style={{ textAlign: 'right', padding: '3px 6px', color: col(b.currentA, b.loadingPercent), fontFamily: 'monospace' }}>
                {b.currentA.toFixed(1)}
              </td>
              <td style={{ textAlign: 'right', padding: '3px 6px', color: '#E8F0FE', fontFamily: 'monospace' }}>
                {b.tapKW.toFixed(1)}
              </td>
              <td style={{ textAlign: 'right', padding: '3px 6px', color: col(b.currentA, b.loadingPercent), fontFamily: 'monospace' }}>
                {b.loadingPercent.toFixed(0)}%
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '1px solid #1B5E20', fontWeight: 600 }}>
            <td style={{ padding: '3px 6px', color: '#A5D6A7' }}>Total</td>
            <td style={{ textAlign: 'right', padding: '3px 6px', color: '#A5D6A7', fontFamily: 'monospace' }}>
              {(r.iLoadA + r.iLoadB).toFixed(1)}
            </td>
            <td style={{ textAlign: 'right', padding: '3px 6px', color: '#A5D6A7', fontFamily: 'monospace' }}>
              {r.totalTapKW.toFixed(1)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 6, padding: '4px 6px', background: '#0A1A0A', borderRadius: 4, fontSize: 10, color: '#7FA8C9' }}>
        Radial tap: {r.radialTapKW.toFixed(1)} kW → Tapreduksjon:{' '}
        <span style={{ color: '#4CAF50', fontWeight: 700 }}>{r.tapReductionPercent.toFixed(0)}%</span>
      </div>
    </div>
  );
}
