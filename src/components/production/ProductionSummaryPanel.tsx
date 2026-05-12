import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcGeneratorP } from './ProductionPanel.js';

const TYPE_CONFIG: Record<string, { color: string; imgSrc: string; label: string }> = {
  hydro_francis: { color: '#1565C0', imgSrc: '/icons/hydro.png',    label: 'Francis' },
  hydro_pelton:  { color: '#1565C0', imgSrc: '/icons/hydro.png',    label: 'Pelton' },
  hydro_kaplan:  { color: '#1565C0', imgSrc: '/icons/hydro.png',    label: 'Kaplan' },
  wind:          { color: '#2E7D32', imgSrc: '/icons/wind.png',     label: 'Vind' },
  solar:         { color: '#F57F17', imgSrc: '/icons/solar.png',    label: 'Sol' },
  nuclear:       { color: '#B71C1C', imgSrc: '/icons/nuclear.png',  label: 'Atom' },
  thermal:       { color: '#E65100', imgSrc: '/icons/nuclear.png',  label: 'Termisk' },
};

interface Props {
  onClose: () => void;
}

export function ProductionSummaryPanel({ onClose }: Props) {
  const generators = useNetworkStore((s) => s.project.generators);
  const buses = useNetworkStore((s) => s.project.buses);
  const runProduction = useNetworkStore((s) => s.runProduction);

  const rows = generators.map((gen) => {
    const bus = buses.find((b) => b.id === gen.busId);
    const pCalc = calcGeneratorP(gen);
    const cfg = TYPE_CONFIG[gen.generatorType] ?? { color: '#607D8B', icon: '⚙', label: gen.generatorType };
    return { gen, bus, pCalc, cfg };
  });

  const totalCalc = rows.reduce((sum, r) => sum + r.pCalc, 0);
  const totalSet = generators.reduce((sum, g) => sum + g.pSetMW, 0);

  if (rows.length === 0) {
    return (
      <div style={{ padding: '12px 16px', color: '#607D8B', fontSize: 12 }}>
        Ingen generatorer i nettet.
      </div>
    );
  }

  return (
    <div style={{ background: '#0D1B2A', borderTop: '1px solid #1565C0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 16px',
          background: '#0F1F2E',
          borderBottom: '1px solid #1565C0',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4FC3F7' }}>
          ⚡ Produksjonsoversikt
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={runProduction}
            style={{
              background: '#0F3B55',
              border: '1px solid #4FC3F7',
              borderRadius: 4,
              color: '#4FC3F7',
              padding: '3px 10px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Beregn alle
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#0F1F2E' }}>
              {['Kilde', 'Buss', 'Type', 'Beregnet P', 'P satt', 'Diff'].map((h) => (
                <th key={h} style={{ padding: '4px 8px', color: '#607D8B', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #1E3A5F' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ gen, bus, pCalc, cfg }) => {
              const diff = pCalc - gen.pSetMW;
              const diffColor = Math.abs(diff) < 0.01 ? '#4CAF50' : '#FF9800';
              return (
                <tr key={gen.id} style={{ borderBottom: '1px solid #0F1F2E' }}>
                  <td style={{ padding: '5px 8px', color: '#E8F0FE' }}>{gen.name}</td>
                  <td style={{ padding: '5px 8px', color: '#9E9E9E' }}>{bus?.name ?? '—'}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <span style={{ background: cfg.color, color: '#FFF', borderRadius: 3, padding: '2px 6px', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <img src={cfg.imgSrc} alt={cfg.label} style={{ width: 10, height: 10, objectFit: 'cover', borderRadius: 1 }} />
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px', color: '#4FC3F7', fontWeight: 600 }}>
                    {pCalc.toFixed(2)} MW
                  </td>
                  <td style={{ padding: '5px 8px', color: '#9E9E9E' }}>
                    {gen.pSetMW.toFixed(2)} MW
                  </td>
                  <td style={{ padding: '5px 8px', color: diffColor, fontWeight: 600 }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid #1E3A5F', background: '#0F1F2E' }}>
              <td colSpan={3} style={{ padding: '5px 8px', color: '#607D8B', fontSize: 10, fontWeight: 600 }}>
                TOTALT ({generators.length} kilde{generators.length !== 1 ? 'r' : ''})
              </td>
              <td style={{ padding: '5px 8px', color: '#4FC3F7', fontWeight: 700 }}>{totalCalc.toFixed(2)} MW</td>
              <td style={{ padding: '5px 8px', color: '#9E9E9E', fontWeight: 700 }}>{totalSet.toFixed(2)} MW</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
