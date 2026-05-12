import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { NetworkType } from '../../types/index.js';

const ROWS: Array<{
  type: NetworkType;
  current: string;
  continuity: string;
  use: string;
  color: string;
}> = [
  { type: 'IT',       current: '~12 A',  continuity: 'Ja (1. feil)', use: 'Norge HS',   color: '#4FC3F7' },
  { type: 'TN',       current: '~230 A', continuity: 'Nei',          use: 'Norge LS',   color: '#FFB74D' },
  { type: 'Petersen', current: '~0 A',   continuity: 'Ja',           use: 'Europa HS',  color: '#66BB6A' },
];

interface Props {
  onClose: () => void;
}

export function NeutralTreatmentPanel({ onClose }: Props) {
  const networkType = useNetworkStore((s) => s.networkType);
  const setNetworkType = useNetworkStore((s) => s.setNetworkType);

  return (
    <div style={{ background: '#0D1B2A', border: '1px solid #1E3A5F', borderRadius: 8, minWidth: 320 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: '#0A1A2E',
          borderBottom: '1px solid #1E3A5F',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#4FC3F7' }}>
          Nøytralbehandling — sammenligning
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ color: '#607D8B', borderBottom: '1px solid #1E3A5F' }}>
              <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Netttype</th>
              <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>I_jord</th>
              <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Drift</th>
              <th style={{ textAlign: 'left', padding: '4px 6px', fontWeight: 600 }}>Bruk</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const isActive = networkType === r.type;
              return (
                <tr
                  key={r.type}
                  onClick={() => setNetworkType(r.type)}
                  style={{
                    cursor: 'pointer',
                    background: isActive ? '#0A2030' : 'transparent',
                    borderBottom: '1px solid #1A2A3A',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '6px 6px', color: r.color, fontWeight: isActive ? 700 : 400 }}>
                    {isActive ? '▶ ' : ''}{r.type}
                  </td>
                  <td style={{ padding: '6px 6px', color: '#E8F0FE' }}>{r.current}</td>
                  <td style={{ padding: '6px 6px', color: '#E8F0FE' }}>{r.continuity}</td>
                  <td style={{ padding: '6px 6px', color: '#9E9E9E' }}>{r.use}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 12,
            background: '#0A1520',
            border: '1px solid #1E3A5F',
            borderRadius: 4,
            padding: '8px 10px',
            fontSize: 10,
            color: '#607D8B',
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: '#4FC3F7', fontWeight: 600, marginBottom: 4 }}>Formelreferanse</div>
          <div><strong style={{ color: '#81D4FA' }}>IT:</strong> I = U_f · ω · C₀ · L</div>
          <div><strong style={{ color: '#FFCC80' }}>TN:</strong> I = U_f / (Z_fase + Z_jord)</div>
          <div><strong style={{ color: '#A5D6A7' }}>Petersen:</strong> L_P = 1 / (3ω²C₀L)</div>
        </div>
      </div>
    </div>
  );
}
