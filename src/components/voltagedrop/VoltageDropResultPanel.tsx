import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { VoltageDropResult } from '../../types/index.js';

const REN_GREEN = 5;
const REN_YELLOW = 10;

function statusColor(pct: number) {
  if (pct < REN_GREEN) return '#4CAF50';
  if (pct < REN_YELLOW) return '#FFB74D';
  return '#EF5350';
}

function statusLabel(pct: number) {
  if (pct < REN_GREEN) return 'OK';
  if (pct < REN_YELLOW) return 'Advarsel';
  return 'Brudd';
}

interface Props {
  results: VoltageDropResult[];
  onClose: () => void;
}

export function VoltageDropResultPanel({ results, onClose }: Props) {
  const lines = useNetworkStore((s) => s.project.lines);
  const buses = useNetworkStore((s) => s.project.buses);

  const sorted = [...results].sort((a, b) => b.deltaUPercent - a.deltaUPercent);
  const violations = sorted.filter((r) => !r.withinLimits);

  return (
    <div style={{ background: '#0D1B2A', borderTop: '1px solid #1565C0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 16px',
          background: '#0F2030',
          borderBottom: '1px solid #1E3A5F',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4FC3F7' }}>
            Spenningsfall — {sorted.length} linje{sorted.length !== 1 ? 'r' : ''}
          </span>
          {violations.length > 0 && (
            <span style={{ fontSize: 11, color: '#EF5350', background: '#1A0000', border: '1px solid #B71C1C', borderRadius: 4, padding: '1px 6px' }}>
              ⚠ {violations.length} REN 4100-brudd
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 13 }}
        >
          ✕
        </button>
      </div>

      {/* REN 4100 violation banner */}
      {violations.length > 0 && (
        <div
          style={{
            padding: '6px 16px',
            background: '#1A0000',
            borderBottom: '1px solid #5D1C1C',
            fontSize: 11,
            color: '#EF9A9A',
          }}
        >
          ⚠ Spenningsfallet overskrider grensen. Se REN 4100 — spenningskvalitet i lavspentanlegg.
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0A1520', borderBottom: '1px solid #1E3A5F' }}>
              {['Linje', 'Fra', 'Til', 'Lengde', 'Modell', 'ΔU [V]', 'ΔU [%]', 'U_mot [kV]', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '5px 12px',
                    color: '#607D8B',
                    fontWeight: 600,
                    textAlign: 'left',
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const line = lines.find((l) => l.id === r.lineId);
              const fromBus = line ? buses.find((b) => b.id === line.fromBusId) : null;
              const toBus = line ? buses.find((b) => b.id === line.toBusId) : null;
              const color = statusColor(r.deltaUPercent);
              return (
                <tr
                  key={r.lineId}
                  style={{
                    borderBottom: '1px solid #1E3A5F',
                    background: i % 2 === 0 ? 'transparent' : '#0A1520',
                  }}
                >
                  <td style={{ padding: '4px 12px', color: '#E8F0FE', fontWeight: 600 }}>
                    {line?.name ?? r.lineId}
                  </td>
                  <td style={{ padding: '4px 12px', color: '#B0BEC5' }}>{fromBus?.name ?? '—'}</td>
                  <td style={{ padding: '4px 12px', color: '#B0BEC5' }}>{toBus?.name ?? '—'}</td>
                  <td style={{ padding: '4px 12px', color: '#B0BEC5' }}>
                    {line ? `${line.lengthKm.toFixed(1)} km` : '—'}
                  </td>
                  <td style={{ padding: '4px 12px', color: '#607D8B', fontSize: 11 }}>
                    {r.model === 'pi' ? 'Pi' : 'Enkel'}
                  </td>
                  <td style={{ padding: '4px 12px', color: '#E8F0FE' }}>
                    {r.deltaUVolts.toFixed(1)}
                  </td>
                  <td style={{ padding: '4px 12px', fontWeight: 700, color }}>
                    {r.deltaUPercent.toFixed(2)}%
                  </td>
                  <td style={{ padding: '4px 12px', color: '#B0BEC5' }}>
                    {r.uReceivingKV.toFixed(3)}
                  </td>
                  <td style={{ padding: '4px 12px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color,
                        background: `${color}22`,
                        border: `1px solid ${color}`,
                        borderRadius: 4,
                        padding: '1px 6px',
                      }}
                    >
                      {statusLabel(r.deltaUPercent)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
