import { useState } from 'react';
import { calcSolarAnnual, SOLAR_MONTHLY_FACTORS } from '../../core/production.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];

interface Props {
  pPeakMW: number;
  onParamsChange: (pPeakMW: number) => void;
}

export function SolarSeasonEditor({ pPeakMW, onParamsChange }: Props) {
  const [localP, setP] = useState(pPeakMW);

  const { eYearMWh, cf, monthly } = calcSolarAnnual(localP);
  const maxMonthly = Math.max(...monthly);

  function update(val: string) {
    const n = parseFloat(val) || 0.1;
    setP(n);
    onParamsChange(n);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 10, color: '#90CAF9', marginBottom: 2 }}>Installert toppeffekt P_peak [MW]</div>
        <input
          type="number"
          value={localP}
          min={0.001}
          step={0.1}
          onChange={(e) => update(e.target.value)}
          style={{
            width: '100%',
            background: '#0D2137',
            border: '1px solid #1E3A5F',
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '4px 8px',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Månedsprofil — bar chart */}
      <div style={{ background: '#080E18', borderRadius: 6, padding: 6 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 6 }}>Månedlig produksjon [MWh]</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
          {monthly.map((mwh, i) => {
            const h = maxMonthly > 0 ? (mwh / maxMonthly) * 56 : 2;
            const factor = SOLAR_MONTHLY_FACTORS[i];
            const color = factor >= 0.8 ? '#FFB300' : factor >= 0.3 ? '#F57F17' : '#4A3700';
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  title={`${MONTH_LABELS[i]}: ${mwh.toFixed(0)} MWh`}
                  style={{ width: '100%', height: h, background: color, borderRadius: '2px 2px 0 0', minHeight: 2 }}
                />
                <div style={{ fontSize: 7, color: '#607D8B', marginTop: 2, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 20 }}>
                  {MONTH_LABELS[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sesongfaktorer tabell */}
      <div style={{ background: '#0D1E2E', borderRadius: 6, padding: '6px 8px' }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4 }}>Sesongfaktorer (relative til juni)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px 6px' }}>
          {MONTH_LABELS.map((m, i) => (
            <div key={m} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#78909C' }}>{m}</span>
              <span style={{ color: '#FFC107' }}>{SOLAR_MONTHLY_FACTORS[i].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vinkelanbefaling */}
      <div style={{ background: '#1A2F1A', border: '1px solid #2E7D32', borderRadius: 6, padding: '6px 10px' }}>
        <div style={{ fontSize: 10, color: '#81C784', fontWeight: 600 }}>Optimal panelvinkel for Norge</div>
        <div style={{ fontSize: 12, color: '#A5D6A7', marginTop: 2 }}>
          Oslo (60°N): ~50° mot sør (breddegrad − 10°)
        </div>
        <div style={{ fontSize: 10, color: '#607D8B', marginTop: 2 }}>
          Avvik ±10° fra optimal gir &lt;5% tap
        </div>
      </div>

      {/* Result */}
      <div style={{ background: '#0F3B55', border: '1px solid #1565C0', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>Kapasitetsfaktor CF</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFC107' }}>{(cf * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>E_år</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4FC3F7' }}>{Math.round(eYearMWh).toLocaleString('no')} MWh</div>
          </div>
        </div>
      </div>
    </div>
  );
}
