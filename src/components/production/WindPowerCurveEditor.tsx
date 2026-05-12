import { useState } from 'react';
import { calcWind, calcWindDetailed } from '../../core/production.js';

interface Props {
  vMean: number;
  Pn: number;
  n: number;
  onParamsChange: (vMean: number, Pn: number, n: number) => void;
}

export function WindPowerCurveEditor({ vMean, Pn, n, onParamsChange }: Props) {
  const [localV, setV] = useState(vMean);
  const [localPn, setPn] = useState(Pn);
  const [localN, setN] = useState(n);

  const vci = 3, vr = 12, vco = 25;
  const { eYearMWh, cf } = calcWindDetailed(localV, localPn, localN, vci, vr, vco);

  // P(v) curve points v = 0..30
  const pvPoints: { v: number; p: number }[] = [];
  for (let v = 0; v <= 30; v++) {
    pvPoints.push({ v, p: calcWind(v, vci, vr, vco, localPn, localN) });
  }

  const W = 240, H_svg = 90;
  const padL = 34, padB = 18, padT = 8, padR = 8;
  const innerW = W - padL - padR;
  const innerH = H_svg - padT - padB;
  const pMax = localPn * localN;
  const toX = (v: number) => padL + (v / 30) * innerW;
  const toY = (p: number) => padT + (1 - p / (pMax || 1)) * innerH;

  const pathD = pvPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.v).toFixed(1)},${toY(p.p).toFixed(1)}`)
    .join(' ');

  const dotX = toX(localV);
  const dotY = toY(calcWind(localV, vci, vr, vco, localPn, localN));

  function update(field: 'v' | 'Pn' | 'n', val: string) {
    const num = parseFloat(val) || 1;
    const newV = field === 'v' ? num : localV;
    const newPn = field === 'Pn' ? num : localPn;
    const newN = field === 'n' ? Math.max(1, Math.round(num)) : localN;
    setV(newV); setPn(newPn); setN(newN);
    onParamsChange(newV, newPn, newN);
  }

  const cfClass = cf >= 0.45 ? '#4CAF50' : cf >= 0.35 ? '#FFC107' : '#EF4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {([
          ['v', 'm/s', localV, 1],
          ['Pn', 'MW/turbin', localPn, 0.5],
          ['n', 'turbiner', localN, 1],
        ] as const).map(([f, u, v, step]) => (
          <div key={f}>
            <div style={{ fontSize: 10, color: '#90CAF9', marginBottom: 2 }}>{f === 'v' ? 'v_mean' : f} [{u}]</div>
            <input
              type="number"
              value={v}
              min={f === 'n' ? 1 : 0.1}
              step={step}
              onChange={(e) => update(f, e.target.value)}
              style={{
                width: '100%',
                background: '#0D2137',
                border: '1px solid #1E3A5F',
                borderRadius: 4,
                color: '#E8F0FE',
                padding: '4px 6px',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* P(v) curve */}
      <div style={{ background: '#080E18', borderRadius: 6, padding: 6 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4 }}>P(v)-kurve [MW]</div>
        <svg width={W} height={H_svg} style={{ overflow: 'visible' }}>
          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />
          <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />
          {/* P labels */}
          {[0, 0.5, 1].map((f) => {
            const pVal = f * pMax;
            return (
              <g key={f}>
                <line x1={padL - 3} y1={toY(pVal)} x2={padL} y2={toY(pVal)} stroke="#1E3A5F" />
                <text x={padL - 5} y={toY(pVal) + 3} textAnchor="end" fontSize={7} fill="#607D8B">
                  {pVal.toFixed(0)}
                </text>
              </g>
            );
          })}
          {/* v labels */}
          {[0, 10, 20, 30].map((v) => (
            <text key={v} x={toX(v)} y={padT + innerH + 11} textAnchor="middle" fontSize={7} fill="#607D8B">{v}</text>
          ))}
          {/* curve */}
          <path d={pathD} fill="none" stroke="#4FC3F7" strokeWidth={1.5} />
          {/* cut-in, rated, cut-out lines */}
          {[vci, vr, vco].map((v) => (
            <line key={v} x1={toX(v)} y1={padT} x2={toX(v)} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={0.8} strokeDasharray="3,2" />
          ))}
          {/* operating point */}
          <circle cx={dotX} cy={dotY} r={4} fill="#4CAF50" stroke="#1B5E20" strokeWidth={1} />
          <text x={padL + innerW / 2} y={H_svg - 2} textAnchor="middle" fontSize={8} fill="#607D8B">v [m/s]</text>
        </svg>
      </div>

      {/* Results */}
      <div style={{ background: '#0F3B55', border: '1px solid #1565C0', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>Kapasitetsfaktor CF</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: cfClass }}>{(cf * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>E_år</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4FC3F7' }}>{Math.round(eYearMWh).toLocaleString('no')} MWh</div>
          </div>
          <div style={{ gridColumn: '1/-1', fontSize: 10, color: '#607D8B', marginTop: 2 }}>
            Onshore Norge: CF 35–45% · Offshore: 45–55%
          </div>
        </div>
      </div>
    </div>
  );
}
