import { useNetworkStore } from '../../store/useNetworkStore.js';

function fmt(t: number): string {
  if (!isFinite(t)) return t > 0 ? '∞' : '−∞';
  return t.toFixed(3) + ' s';
}

export function SelectivityPanel({ onClose }: { onClose: () => void }) {
  const selectivityResults = useNetworkStore((s) => s.selectivityResults);
  const protections = useNetworkStore((s) => s.project.protections);
  const runSelectivityCheck = useNetworkStore((s) => s.runSelectivityCheck);

  function protName(id: string) {
    return protections.find((p) => p.id === id)?.name ?? id.slice(0, 8);
  }

  return (
    <div style={{ background: '#0D1B2A', padding: '10px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ color: '#4FC3F7', fontWeight: 700, fontSize: 12 }}>
          🛡 Selektivitetskontroll
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={runSelectivityCheck}
            style={{
              background: '#0F3B1E',
              border: '1px solid #2E7D32',
              color: '#81C784',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Kjør kontroll
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 13 }}
          >
            ✕
          </button>
        </div>
      </div>

      {selectivityResults.length === 0 ? (
        <div style={{ color: '#607D8B', fontSize: 11, padding: '4px 0 8px' }}>
          Ingen vernpar i serie funnet. Legg til vern på to eller flere linjer i serie og trykk «Kjør kontroll».
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E3A5F' }}>
                {['Vern 1 (nær feil)', 'Vern 2 (overordnet)', 'I_k [A]', 't₁', 't₂', 'Margin Δt', 'Status'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectivityResults.map((r, i) => {
                const color = r.selective ? '#4CAF50' : '#EF5350';
                const marginStr = isFinite(r.marginS)
                  ? `${r.marginS.toFixed(3)} s`
                  : r.marginS > 0 ? '∞' : '−∞';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #0F2030' }}>
                    <td style={tdStyle}>{protName(r.prot1Id)}</td>
                    <td style={tdStyle}>{protName(r.prot2Id)}</td>
                    <td style={tdStyle}>{Math.round(r.ikTestA)}</td>
                    <td style={tdStyle}>{fmt(r.t1s)}</td>
                    <td style={tdStyle}>{fmt(r.t2s)}</td>
                    <td style={{ ...tdStyle, color: r.marginS >= 0.25 ? '#4CAF50' : '#EF5350' }}>
                      {marginStr}
                    </td>
                    <td style={{ ...tdStyle, color, fontWeight: 700 }}>
                      {r.selective ? '✓ OK' : '✗ Ikke selektiv'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ color: '#546E7A', fontSize: 10, marginTop: 6 }}>
            Δt_min = 0.25 s (IEC 60255 diskrimineringstid for moderne CB)
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '4px 8px', color: '#607D8B', fontWeight: 600,
};
const tdStyle: React.CSSProperties = {
  padding: '4px 8px', color: '#E8F0FE',
};
