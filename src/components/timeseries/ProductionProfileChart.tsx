import type { ProductionTimeStep } from '../../core/timeseries.js';

interface Props {
  steps: ProductionTimeStep[];
  selectedHour: number;
  loadMW?: number[];
}

const COLORS = {
  hydro: '#2196F3',
  wind: '#4CAF50',
  solar: '#FFC107',
  nuclear: '#F44336',
  thermal: '#9C27B0',
};

export function ProductionProfileChart({ steps, selectedHour, loadMW }: Props) {
  const W = 420, H = 130;
  const padL = 36, padB = 22, padT = 10, padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const barW = innerW / 24;
  const maxProd = Math.max(...steps.map((s) => s.total), ...(loadMW ?? []), 0.1);

  const toX = (h: number) => padL + h * barW;
  const toY = (mw: number) => padT + (1 - mw / maxProd) * innerH;

  type StackKey = 'hydro' | 'wind' | 'solar' | 'nuclear' | 'thermal';
  const stackOrder: StackKey[] = ['hydro', 'wind', 'solar', 'nuclear', 'thermal'];

  // Load curve points
  const loadPoints = loadMW
    ? loadMW.map((p, h) => `${(toX(h) + barW / 2).toFixed(1)},${toY(p).toFixed(1)}`).join(' ')
    : '';

  return (
    <div style={{ background: '#080E18', borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 11, color: '#90CAF9', marginBottom: 4 }}>Produksjonsprofil 24t [MW] — stablet</div>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((f) => {
          const y = padT + (1 - f) * innerH;
          return (
            <g key={f}>
              <line x1={padL - 3} y1={y} x2={padL} y2={y} stroke="#1E3A5F" />
              <text x={padL - 5} y={y + 3} textAnchor="end" fontSize={8} fill="#607D8B">
                {(f * maxProd).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Stacked bars */}
        {steps.map((step, h) => {
          let cumY = padT + innerH;
          return (
            <g key={h}>
              {stackOrder.map((key) => {
                const val = step[key];
                if (val <= 0) return null;
                const barH = (val / maxProd) * innerH;
                const y = cumY - barH;
                cumY = y;
                return (
                  <rect
                    key={key}
                    x={toX(h) + 1}
                    y={y}
                    width={barW - 2}
                    height={barH}
                    fill={COLORS[key]}
                    opacity={h === selectedHour ? 1 : 0.65}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Load curve overlay */}
        {loadPoints && (
          <polyline points={loadPoints} fill="none" stroke="#FF9800" strokeWidth={2} strokeDasharray="4,2" />
        )}

        {/* Selected hour line */}
        <line
          x1={toX(selectedHour) + barW / 2}
          y1={padT}
          x2={toX(selectedHour) + barW / 2}
          y2={padT + innerH}
          stroke="#2196F3"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />

        {/* X-axis labels */}
        {[0, 4, 8, 12, 16, 20, 23].map((h) => (
          <text key={h} x={toX(h) + barW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#607D8B">
            {h}
          </text>
        ))}
        <text x={padL + innerW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#455A64">Time</text>
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, fontSize: 9, color: '#607D8B' }}>
        {stackOrder.map((k) => (
          <span key={k}><span style={{ color: COLORS[k] }}>■</span> {k.charAt(0).toUpperCase() + k.slice(1)}</span>
        ))}
        {loadMW && <span><span style={{ color: '#FF9800' }}>- -</span> Last</span>}
      </div>
    </div>
  );
}
