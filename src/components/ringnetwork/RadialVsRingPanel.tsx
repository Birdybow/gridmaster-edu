import { useNetworkStore } from '../../store/useNetworkStore.js';

export function RadialVsRingPanel() {
  const r = useNetworkStore((s) => s.ringNetworkResults);

  if (!r) return null;

  const iMaxRadial = r.iLoadA + r.iLoadB;
  const iMaxRing = Math.max(r.iLoadA, r.iLoadB);

  const rows: Array<{ label: string; radial: string; ring: string; highlight?: boolean }> = [
    {
      label: 'Maks strøm [A]',
      radial: iMaxRadial.toFixed(0),
      ring: iMaxRing.toFixed(0),
    },
    {
      label: 'Total tap [kW]',
      radial: r.radialTapKW.toFixed(1),
      ring: r.totalTapKW.toFixed(1),
    },
    {
      label: 'Tapreduksjon',
      radial: '—',
      ring: `${r.tapReductionPercent.toFixed(0)}%`,
      highlight: true,
    },
    {
      label: 'Leveringssikkerhet',
      radial: 'Lav',
      ring: 'Høy',
    },
  ];

  return (
    <div style={{ padding: '8px 12px', minWidth: 340 }}>
      <div style={{ fontWeight: 700, color: '#4CAF50', fontSize: 12, marginBottom: 8 }}>
        Sammenligning: Radial vs Ringnett
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1B5E20' }}>
            <th style={{ textAlign: 'left', padding: '3px 6px', color: '#7FA8C9' }}></th>
            <th style={{ textAlign: 'right', padding: '3px 6px', color: '#FFB74D', fontWeight: 600 }}>Radial</th>
            <th style={{ textAlign: 'right', padding: '3px 6px', color: '#4CAF50', fontWeight: 600 }}>Ringnett</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #0A2A0A' }}>
              <td style={{ padding: '4px 6px', color: '#E8F0FE' }}>{row.label}</td>
              <td style={{ textAlign: 'right', padding: '4px 6px', color: '#FFB74D', fontFamily: 'monospace' }}>
                {row.radial}
              </td>
              <td style={{
                textAlign: 'right',
                padding: '4px 6px',
                color: row.highlight ? '#4CAF50' : '#A5D6A7',
                fontFamily: 'monospace',
                fontWeight: row.highlight ? 700 : 400,
              }}>
                {row.ring}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 6, fontSize: 10, color: '#7FA8C9', lineHeight: 1.4 }}>
        Ringnett halverer maks strøm og reduserer tap med ~75% ved symmetrisk impedans.
        Gir redundant forsyning: én linje kan brytes uten forsyningsstans.
      </div>
    </div>
  );
}
