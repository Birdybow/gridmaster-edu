import type { BalanceStep } from '../../core/timeseries.js';

interface Props {
  steps: BalanceStep[];
  selectedHour: number;
  onHourClick: (hour: number) => void;
}

export function EnergyBalanceChart({ steps, selectedHour, onHourClick }: Props) {
  const W = 420, H = 120;
  const padL = 40, padB = 22, padT = 10, padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const barW = innerW / 24;
  const absMax = Math.max(...steps.map((s) => Math.abs(s.balance)), 0.1);

  const toX = (h: number) => padL + h * barW;
  // Zero line at center of the chart
  const zeroY = padT + innerH / 2;
  const toY = (mw: number) => zeroY - (mw / absMax) * (innerH / 2);

  return (
    <div style={{ background: '#080E18', borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 11, color: '#90CAF9', marginBottom: 4 }}>Energibalanse 24t [MW] — overskudd/underskudd</div>
      <svg
        width={W}
        height={H}
        style={{ overflow: 'visible', cursor: 'pointer' }}
        onClick={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = e.clientX - rect.left - padL;
          const h = Math.max(0, Math.min(23, Math.floor(x / barW)));
          onHourClick(h);
        }}
      >
        {/* Zero line */}
        <line x1={padL} y1={zeroY} x2={padL + innerW} y2={zeroY} stroke="#607D8B" strokeWidth={1} />

        {/* Y-axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />

        {/* Y-axis labels */}
        {[-1, 0, 1].map((f) => {
          const y = zeroY - f * (innerH / 2);
          return (
            <g key={f}>
              <line x1={padL - 3} y1={y} x2={padL} y2={y} stroke="#1E3A5F" />
              <text x={padL - 5} y={y + 3} textAnchor="end" fontSize={8} fill="#607D8B">
                {(f * absMax).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {steps.map((step, h) => {
          const surplus = step.balance >= 0;
          const y = toY(step.balance);
          const barH = Math.abs(zeroY - y);
          const isSelected = h === selectedHour;
          return (
            <rect
              key={h}
              x={toX(h) + 1}
              y={surplus ? y : zeroY}
              width={barW - 2}
              height={barH}
              fill={isSelected ? '#2196F3' : surplus ? '#4CAF50' : '#EF4444'}
              opacity={isSelected ? 1 : 0.75}
            />
          );
        })}

        {/* Selected hour marker */}
        <line
          x1={toX(selectedHour) + barW / 2}
          y1={padT}
          x2={toX(selectedHour) + barW / 2}
          y2={padT + innerH}
          stroke="#2196F3"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />

        {/* Selected hour value label */}
        {(() => {
          const s = steps[selectedHour];
          if (!s) return null;
          const labelY = s.balance >= 0
            ? toY(s.balance) - 3
            : toY(s.balance) + 9;
          return (
            <text
              x={toX(selectedHour) + barW / 2}
              y={labelY}
              textAnchor="middle"
              fontSize={8}
              fill="#90CAF9"
            >
              {s.balance >= 0 ? '+' : ''}{s.balance.toFixed(2)}
            </text>
          );
        })()}

        {/* X-axis labels */}
        {[0, 4, 8, 12, 16, 20, 23].map((h) => (
          <text key={h} x={toX(h) + barW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#607D8B">
            {h}
          </text>
        ))}
        <text x={padL + innerW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#455A64">Time</text>
      </svg>

      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 9, color: '#607D8B' }}>
        <span><span style={{ color: '#4CAF50' }}>■</span> Overskudd (eksport/lagring)</span>
        <span><span style={{ color: '#EF4444' }}>■</span> Underskudd (import/backup)</span>
      </div>
    </div>
  );
}
