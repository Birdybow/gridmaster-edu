import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { ShortCircuitResult } from '../../types/index.js';

interface Props {
  result: ShortCircuitResult;
}

export function ContributionTable({ result }: Props) {
  const generators = useNetworkStore((s) => s.project.generators);

  if (result.contributions.length === 0) return null;

  const totalContrib = result.contributions.reduce((s, c) => s + c.ik3pKA, 0);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: '#EF9A9A', fontWeight: 600, marginBottom: 4 }}>
        Bidrag per kilde
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#0A1520' }}>
            {['Generator', 'I′′k3p-bidrag [kA]', 'Andel [%]'].map((h) => (
              <th
                key={h}
                style={{ padding: '3px 8px', color: '#607D8B', textAlign: 'left', borderBottom: '1px solid #1E3A5F' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.contributions.map((c) => {
            const gen = generators.find((g) => g.id === c.sourceId);
            const pct = totalContrib > 0 ? (c.ik3pKA / totalContrib) * 100 : 0;
            return (
              <tr key={c.sourceId} style={{ borderBottom: '1px solid #0F1F2E' }}>
                <td style={{ padding: '3px 8px', color: '#E8F0FE' }}>
                  {gen?.name ?? c.sourceId}
                </td>
                <td style={{ padding: '3px 8px', color: '#EF5350', fontWeight: 600 }}>
                  {c.ik3pKA.toFixed(3)}
                </td>
                <td style={{ padding: '3px 8px', color: '#9E9E9E' }}>
                  {pct.toFixed(1)} %
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
