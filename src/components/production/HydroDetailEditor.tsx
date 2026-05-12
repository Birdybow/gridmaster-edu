import { useState } from 'react';
import type { GeneratorType } from '../../types';
import { calcHydroDetailed } from '../../core/production.js';
import { TurbineSelector, getEtaMax } from './TurbineSelector.js';

interface Props {
  turbineType: GeneratorType;
  H: number;
  Q: number;
  Qn: number;
  onTurbineChange: (t: GeneratorType) => void;
  onParamsChange: (H: number, Q: number, Qn: number) => void;
}

const K_BY_TYPE: Record<string, number> = {
  hydro_francis: 0.3,
  hydro_pelton: 0.25,
  hydro_kaplan: 0.28,
};

export function HydroDetailEditor({ turbineType, H, Q, Qn, onTurbineChange, onParamsChange }: Props) {
  const [localH, setH] = useState(H);
  const [localQ, setQ] = useState(Q);
  const [localQn, setQn] = useState(Qn);

  const etaMax = getEtaMax(turbineType);
  const k = K_BY_TYPE[turbineType] ?? 0.3;
  const { etaAct, pMW } = calcHydroDetailed(localH, localQ, localQn, etaMax, k);
  const ratio = localQ / localQn;

  // Generate η-curve points for Q/Qn = 0.2..1.4
  const curvePoints: { r: number; eta: number }[] = [];
  for (let r = 0.2; r <= 1.4; r += 0.05) {
    const eta = etaMax * (1 - k * (r - 1) ** 2);
    curvePoints.push({ r, eta: Math.max(0, eta) });
  }

  // SVG η-curve (mini)
  const W = 220, H_svg = 80;
  const padL = 28, padB = 16, padT = 8, padR = 8;
  const innerW = W - padL - padR;
  const innerH = H_svg - padT - padB;
  const etaMin = 0.7, etaMax2 = 1.0;
  const toX = (r: number) => padL + ((r - 0.2) / 1.2) * innerW;
  const toY = (e: number) => padT + (1 - (e - etaMin) / (etaMax2 - etaMin)) * innerH;

  const pathD = curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.r).toFixed(1)},${toY(p.eta).toFixed(1)}`)
    .join(' ');

  const dotX = toX(ratio);
  const dotY = toY(etaAct);

  function update(field: 'H' | 'Q' | 'Qn', val: string) {
    const n = parseFloat(val) || 1;
    const newH = field === 'H' ? n : localH;
    const newQ = field === 'Q' ? n : localQ;
    const newQn = field === 'Qn' ? n : localQn;
    setH(newH); setQ(newQ); setQn(newQn);
    onParamsChange(newH, newQ, newQn);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <TurbineSelector selected={turbineType} onChange={onTurbineChange} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {([['H', 'm', localH], ['Q', 'm³/s', localQ], ['Qn', 'm³/s', localQn]] as const).map(([f, u, v]) => (
          <div key={f}>
            <div style={{ fontSize: 10, color: '#90CAF9', marginBottom: 2 }}>{f} [{u}]</div>
            <input
              type="number"
              value={v}
              min={0.1}
              step={f === 'H' ? 10 : 1}
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

      {/* η-curve SVG */}
      <div style={{ background: '#080E18', borderRadius: 6, padding: 6 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4 }}>Virkningsgradskurve η(Q/Q_n)</div>
        <svg width={W} height={H_svg} style={{ overflow: 'visible' }}>
          {/* axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />
          <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />
          {/* η labels */}
          {[0.75, 0.85, 0.95].map((e) => (
            <g key={e}>
              <line x1={padL - 3} y1={toY(e)} x2={padL} y2={toY(e)} stroke="#1E3A5F" />
              <text x={padL - 5} y={toY(e) + 3} textAnchor="end" fontSize={7} fill="#607D8B">{(e * 100).toFixed(0)}</text>
            </g>
          ))}
          {/* curve */}
          <path d={pathD} fill="none" stroke="#42A5F5" strokeWidth={1.5} />
          {/* operating point */}
          <circle cx={dotX} cy={dotY} r={4} fill="#FFB74D" stroke="#FF8F00" strokeWidth={1} />
          <line x1={dotX} y1={padT} x2={dotX} y2={padT + innerH} stroke="#FFB74D" strokeWidth={0.8} strokeDasharray="3,2" />
          {/* x-axis label */}
          <text x={padL + innerW / 2} y={H_svg - 1} textAnchor="middle" fontSize={8} fill="#607D8B">Q/Q_n</text>
        </svg>
      </div>

      {/* Result box */}
      <div style={{ background: '#0F3B55', border: '1px solid #1565C0', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>Q/Q_n</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#90CAF9' }}>{ratio.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>η_akt</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#90CAF9' }}>{(etaAct * 100).toFixed(1)}%</div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 10, color: '#607D8B' }}>Beregnet effekt</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4FC3F7' }}>{pMW.toFixed(2)} MW</div>
          </div>
        </div>
      </div>
    </div>
  );
}
