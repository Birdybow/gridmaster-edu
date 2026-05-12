import { useNetworkStore } from '../../store/useNetworkStore.js';
import { getBusName } from '../../utils/display.js';
import { ContributionTable } from './ContributionTable.js';
import type { ShortCircuitResult } from '../../types/index.js';

interface Props {
  results: ShortCircuitResult[];
  onClose: () => void;
}

function StatusChip({ ik3pKA, cbRatingKA }: { ik3pKA: number; cbRatingKA?: number }) {
  if (cbRatingKA === undefined) return null;
  const ok = ik3pKA <= cbRatingKA;
  const color = ok ? '#4CAF50' : '#EF5350';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: `${color}22`,
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: '1px 6px',
        marginLeft: 8,
      }}
    >
      {ok
        ? `✓ Bryter OK (${cbRatingKA} kA)`
        : `✗ Bryter utilstrekkelig (${cbRatingKA} kA < ${ik3pKA.toFixed(2)} kA)`}
    </span>
  );
}

function Row({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <tr>
      <td style={{ padding: '4px 12px', color: '#9E9E9E', fontSize: 11 }}>{label}</td>
      <td style={{ padding: '4px 12px', color: color ?? '#E8F0FE', fontWeight: 700, fontSize: 13 }}>{value}</td>
      <td style={{ padding: '4px 12px', color: '#607D8B', fontSize: 11 }}>{unit}</td>
    </tr>
  );
}

export function ShortCircuitResultPanel({ results, onClose }: Props) {
  const buses = useNetworkStore((s) => s.project.buses);

  if (results.length === 0) return null;

  return (
    <div style={{ background: '#0D1B2A', borderTop: '1px solid #B71C1C' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 16px',
          background: '#1A0000',
          borderBottom: '1px solid #B71C1C',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#EF5350' }}>
          ⚡ Kortslutningsresultater — {results.length} feilsted{results.length !== 1 ? 'er' : ''}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 13 }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
        {results.map((r) => {
          const faultBus = buses.find((b) => b.id === r.busId);
          const cbRating = faultBus?.cbRatingKA;
          const cbViolation = cbRating !== undefined && r.ik3pMaxKA > cbRating;

          return (
            <div
              key={r.busId}
              style={{
                flex: '1 1 320px',
                borderRight: '1px solid #1E3A5F',
                padding: '12px 16px',
              }}
            >
              {/* Fault bus title */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EF5350' }}>
                  ⚡ Feilsted: {getBusName(r.busId, buses)}
                </span>
                <StatusChip ik3pKA={r.ik3pMaxKA} cbRatingKA={cbRating} />
              </div>

              {/* Circuit breaker violation banner */}
              {cbViolation && (
                <div
                  style={{
                    background: '#1A0000',
                    border: '1px solid #B71C1C',
                    borderRadius: 4,
                    padding: '6px 10px',
                    marginBottom: 8,
                    fontSize: 11,
                    color: '#EF9A9A',
                  }}
                >
                  ⚠ Bryterevnen ({cbRating} kA) er utilstrekkelig.
                  I′′k3p = {r.ik3pMaxKA.toFixed(3)} kA overskrider grensen.
                </div>
              )}

              {/* Results table */}
              <table style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <Row label="I′′k3p maks" value={r.ik3pMaxKA.toFixed(3)} unit="kA" color="#EF5350" />
                  <Row label="I′′k2p" value={r.ik2pKA.toFixed(3)} unit="kA" color="#FF8A65" />
                  <Row label="ip støtstrøm" value={r.ipKA.toFixed(3)} unit="kA" color="#FFAB40" />
                  <Row label="I′′k3p min" value={r.ik3pMinKA.toFixed(3)} unit="kA" color="#9E9E9E" />
                  <Row label="c_maks" value={r.cFactorMax.toFixed(2)} unit="(IEC 60909)" />
                  <Row label="c_min" value={r.cFactorMin.toFixed(2)} unit="(IEC 60909)" />
                </tbody>
              </table>

              {/* Contribution table */}
              <ContributionTable result={r} />

              <div style={{ fontSize: 10, color: '#37474F', marginTop: 8 }}>
                {new Date(r.timestamp).toLocaleTimeString('nb-NO')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
