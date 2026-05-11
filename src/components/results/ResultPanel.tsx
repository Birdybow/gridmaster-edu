import type { PowerFlowResult } from '../../types/index.js';

interface Props {
  result: PowerFlowResult;
  onClose: () => void;
}

const cell: React.CSSProperties = { padding: '4px 10px', borderBottom: '1px solid #1A3A5C' };
const hdr: React.CSSProperties = { ...cell, color: '#4FC3F7', fontWeight: 600 };

function voltageColor(v: number): string {
  if (v > 1.05) return '#FF9800';
  if (v >= 0.95) return '#4CAF50';
  if (v >= 0.90) return '#FFEB3B';
  return '#F44336';
}

/** Displays bus voltages, angles, and line currents/losses after a power flow. */
export function ResultPanel({ result, onClose }: Props) {
  return (
    <div
      style={{
        background: '#0D1B2A',
        borderTop: '1px solid #1565C0',
        color: '#E8F0FE',
        fontSize: 13,
        overflowY: 'auto',
        maxHeight: 260,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid #1A3A5C' }}>
        <span style={{ color: '#4FC3F7', fontWeight: 600 }}>
          Lastflytresultater — {result.converged ? `Konvergert (${result.iterations} iter.)` : 'Ikke konvergert'}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, padding: '8px 12px' }}>
        {/* Bus table */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#4FC3F7', marginBottom: 4 }}>Busser</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={hdr}>Buss</th>
                <th style={hdr}>V [p.u.]</th>
                <th style={hdr}>δ [°]</th>
                <th style={hdr}>P [MW]</th>
                <th style={hdr}>Q [MVAr]</th>
              </tr>
            </thead>
            <tbody>
              {result.buses.map((b) => (
                <tr key={b.busId}>
                  <td style={cell}>{b.busId}</td>
                  <td style={{ ...cell, color: voltageColor(b.vMagPU), fontWeight: 600 }}>
                    {b.vMagPU.toFixed(4)}
                  </td>
                  <td style={cell}>{b.vAngDeg.toFixed(2)}</td>
                  <td style={cell}>{b.pMW.toFixed(3)}</td>
                  <td style={cell}>{b.qMVAr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Line table */}
        <div style={{ flex: 1 }}>
          <div style={{ color: '#4FC3F7', marginBottom: 4 }}>Linjer</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={hdr}>Linje</th>
                <th style={hdr}>I [A]</th>
                <th style={hdr}>Tap P [kW]</th>
                <th style={hdr}>Last [%]</th>
              </tr>
            </thead>
            <tbody>
              {result.lines.map((l) => (
                <tr key={l.lineId}>
                  <td style={cell}>{l.lineId}</td>
                  <td style={cell}>{(l.currentKA * 1000).toFixed(1)}</td>
                  <td style={cell}>{(l.lossesActiveMW * 1000).toFixed(1)}</td>
                  <td style={{ ...cell, color: l.overloaded ? '#F44336' : '#4CAF50' }}>
                    {l.loadingPercent.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
            Totaltap: {result.totalLossesMW.toFixed(4)} MW / {result.totalLossesMVAr.toFixed(4)} MVAr
          </div>
        </div>
      </div>
    </div>
  );
}
