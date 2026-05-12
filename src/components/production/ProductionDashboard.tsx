import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcGeneratorP } from './ProductionPanel.js';
import { calcSolarAnnual, calcWindDetailed } from '../../core/production.js';
import type { Generator } from '../../types/index.js';

/** CO2 lifecycle [g/kWh] */
const CO2_FACTOR: Record<string, number> = {
  hydro_francis: 4,
  hydro_pelton:  4,
  hydro_kaplan:  4,
  wind:          7,
  solar:         45,
  nuclear:       12,
  thermal:       490,
};

const TYPE_LABEL: Record<string, string> = {
  hydro_francis: 'Vannkraft (Francis)',
  hydro_pelton:  'Vannkraft (Pelton)',
  hydro_kaplan:  'Vannkraft (Kaplan)',
  wind:          'Vindkraft',
  solar:         'Solkraft',
  nuclear:       'Atomkraft',
  thermal:       'Termisk',
};

const TYPE_COLOR: Record<string, string> = {
  hydro_francis: '#1565C0',
  hydro_pelton:  '#1565C0',
  hydro_kaplan:  '#1565C0',
  wind:          '#2E7D32',
  solar:         '#F57F17',
  nuclear:       '#B71C1C',
  thermal:       '#E65100',
};

function getAnnualEnergy(gen: Generator): number {
  const pNow = calcGeneratorP(gen);
  if (gen.generatorType === 'solar') {
    const { eYearMWh } = calcSolarAnnual(gen.solarPeakMW ?? gen.ratedMVA);
    return eYearMWh;
  }
  if (gen.generatorType === 'wind') {
    const vMean = gen.ratedWindMs ? gen.ratedWindMs * 0.7 : 8;
    const { eYearMWh } = calcWindDetailed(vMean, gen.windRatedMW ?? gen.ratedMVA, gen.numTurbines ?? 1);
    return eYearMWh;
  }
  // Hydro and others: assume 6000 full-load hours/year (typical Norwegian hydro)
  return pNow * 6000;
}

interface Props {
  onClose: () => void;
}

export function ProductionDashboard({ onClose }: Props) {
  const generators = useNetworkStore((s) => s.project.generators);

  if (generators.length === 0) {
    return (
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#4FC3F7' }}>Produksjonsdashboard</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: '#607D8B' }}>Ingen generatorer i nettet.</div>
      </div>
    );
  }

  const rows = generators.map((gen) => {
    const pMW = calcGeneratorP(gen);
    const eYearMWh = getAnnualEnergy(gen);
    const co2Factor = CO2_FACTOR[gen.generatorType] ?? 490;
    // eYearMWh * 1000 [kWh/MWh] * co2Factor [g/kWh] / 1e6 [g→t]
    const co2TYear = (eYearMWh * 1000 * co2Factor) / 1e6;
    const isCo2Free = co2Factor <= 12;
    return { gen, pMW, eYearMWh, co2TYear, co2Factor, isCo2Free };
  });

  const totalMW = rows.reduce((s, r) => s + r.pMW, 0);
  const totalMWh = rows.reduce((s, r) => s + r.eYearMWh, 0);
  const totalCo2T = rows.reduce((s, r) => s + r.co2TYear, 0);
  const co2FreePercent = totalMWh > 0
    ? (rows.filter((r) => r.isCo2Free).reduce((s, r) => s + r.eYearMWh, 0) / totalMWh) * 100
    : 0;

  return (
    <div style={{ background: '#0D1B2A', color: '#E8F0FE', fontSize: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#0F1F2E', borderBottom: '1px solid #1565C0' }}>
        <span style={{ fontWeight: 700, color: '#4FC3F7', fontSize: 13 }}>Produksjonsdashboard</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#0F1F2E' }}>
              {['Kilde', 'Type', 'MW', 'MWh/år', 'CO₂ (t/år)', 'CO₂-fri'].map((h) => (
                <th key={h} style={{ padding: '5px 8px', color: '#607D8B', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #1E3A5F', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ gen, pMW, eYearMWh, co2TYear, isCo2Free }) => (
              <tr key={gen.id} style={{ borderBottom: '1px solid #0F1F2E' }}>
                <td style={{ padding: '5px 8px', color: '#E8F0FE', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gen.name}
                </td>
                <td style={{ padding: '5px 8px' }}>
                  <span style={{ background: TYPE_COLOR[gen.generatorType] ?? '#607D8B', color: '#FFF', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>
                    {TYPE_LABEL[gen.generatorType] ?? gen.generatorType}
                  </span>
                </td>
                <td style={{ padding: '5px 8px', color: '#4FC3F7', fontWeight: 600 }}>
                  {pMW.toFixed(2)}
                </td>
                <td style={{ padding: '5px 8px', color: '#90CAF9' }}>
                  {Math.round(eYearMWh).toLocaleString('no')}
                </td>
                <td style={{ padding: '5px 8px', color: co2TYear < 1 ? '#4CAF50' : '#FFC107' }}>
                  {co2TYear.toFixed(1)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  {isCo2Free ? (
                    <span style={{ color: '#4CAF50', fontWeight: 700 }}>100%</span>
                  ) : (
                    <span style={{ color: '#FF7043' }}>{(100 - CO2_FACTOR[gen.generatorType] / 820 * 100).toFixed(0)}%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #1565C0', background: '#0F1F2E' }}>
              <td colSpan={2} style={{ padding: '5px 8px', color: '#607D8B', fontWeight: 700 }}>TOTAL</td>
              <td style={{ padding: '5px 8px', color: '#4FC3F7', fontWeight: 700 }}>{totalMW.toFixed(2)}</td>
              <td style={{ padding: '5px 8px', color: '#90CAF9', fontWeight: 700 }}>{Math.round(totalMWh).toLocaleString('no')}</td>
              <td style={{ padding: '5px 8px', color: '#FFC107', fontWeight: 700 }}>{totalCo2T.toFixed(1)}</td>
              <td style={{ padding: '5px 8px', color: '#4CAF50', fontWeight: 700, textAlign: 'center' }}>{co2FreePercent.toFixed(0)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div style={{ padding: '6px 14px 8px', fontSize: 10, color: '#607D8B', borderTop: '1px solid #0F1F2E' }}>
        CO₂-faktorer (livssyklus): Vannkraft 4 · Vind 7 · Sol 45 · Atom 12 · Termisk 490 g/kWh
      </div>
    </div>
  );
}
