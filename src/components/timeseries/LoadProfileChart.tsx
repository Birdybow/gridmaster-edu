import { LOAD_PROFILE_PCT } from '../../core/timeseries.js';

interface Props {
  pMaxMW: number;
  selectedHour: number;
  onHourClick: (hour: number) => void;
}

export function LoadProfileChart({ pMaxMW, selectedHour, onHourClick }: Props) {
  const W = 420, H = 120;
  const padL = 36, padB = 22, padT = 10, padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const barW = innerW / 24;
  const pMax = pMaxMW;

  const toX = (h: number) => padL + h * barW;
  const toY = (pct: number) => padT + (1 - pct / 100) * innerH;

  const values = LOAD_PROFILE_PCT.map((pct) => pMaxMW * pct / 100);
  const absMax = Math.max(...values);

  function barColor(pct: number) {
    if (pct >= 90) return '#EF4444';
    if (pct >= 60) return '#FFC107';
    return '#4CAF50';
  }

  const linePoints = LOAD_PROFILE_PCT.map((pct, h) =>
    `${(toX(h) + barW / 2).toFixed(1)},${toY(pct).toFixed(1)}`
  ).join(' ');

  return (
    <div style={{ background: '#080E18', borderRadius: 6, padding: 8 }}>
      <div style={{ fontSize: 11, color: '#90CAF9', marginBottom: 4 }}>Lastprofil 24t [MW]</div>
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
        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="#1E3A5F" strokeWidth={1} />

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((f) => {
          const pVal = f * absMax;
          const y = padT + (1 - f) * innerH;
          return (
            <g key={f}>
              <line x1={padL - 3} y1={y} x2={padL} y2={y} stroke="#1E3A5F" />
              <text x={padL - 5} y={y + 3} textAnchor="end" fontSize={8} fill="#607D8B">
                {pVal.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {LOAD_PROFILE_PCT.map((pct, h) => {
          const x = toX(h);
          const y = toY(pct);
          const barH = padT + innerH - y;
          const isSelected = h === selectedHour;
          return (
            <rect
              key={h}
              x={x + 1}
              y={y}
              width={barW - 2}
              height={barH}
              fill={isSelected ? '#2196F3' : barColor(pct)}
              opacity={isSelected ? 1 : 0.6}
            />
          );
        })}

        {/* Load line */}
        <polyline points={linePoints} fill="none" stroke="#90CAF9" strokeWidth={1.5} opacity={0.8} />

        {/* X-axis labels every 4 hours */}
        {[0, 4, 8, 12, 16, 20, 23].map((h) => (
          <text key={h} x={toX(h) + barW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#607D8B">
            {h}
          </text>
        ))}

        {/* Selected hour marker line */}
        <line
          x1={toX(selectedHour) + barW / 2}
          y1={padT}
          x2={toX(selectedHour) + barW / 2}
          y2={padT + innerH}
          stroke="#2196F3"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />

        {/* Selected hour label */}
        <text
          x={toX(selectedHour) + barW / 2}
          y={padT - 2}
          textAnchor="middle"
          fontSize={8}
          fill="#90CAF9"
        >
          {selectedHour}t: {(pMax * LOAD_PROFILE_PCT[selectedHour] / 100).toFixed(1)} MW
        </text>

        <text x={padL + innerW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="#455A64">Time</text>
      </svg>

      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 9, color: '#607D8B' }}>
        <span><span style={{ color: '#4CAF50' }}>■</span> Normal (&lt;60%)</span>
        <span><span style={{ color: '#FFC107' }}>■</span> Høy (60–90%)</span>
        <span><span style={{ color: '#EF4444' }}>■</span> Peak (&gt;90%)</span>
        <span><span style={{ color: '#2196F3' }}>■</span> Valgt time</span>
      </div>
    </div>
  );
}
