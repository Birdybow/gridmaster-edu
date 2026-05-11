import { useEffect, useRef, useState } from 'react';
import { calcCompensation } from '../../core/compensation.js';

interface PowerTriangleProps {
  pMW: number;
  cosPhi1: number;
  cosPhi2: number;
}

/** Animate a number toward a target using requestAnimationFrame (300 ms ease-in-out). */
function useAnimated(target: number, ms = 300): number {
  const [val, setVal] = useState(target);
  const state = useRef<{ from: number; to: number; startTime: number; rafId: number }>({
    from: target,
    to: target,
    startTime: 0,
    rafId: 0,
  });

  useEffect(() => {
    const s = state.current;
    cancelAnimationFrame(s.rafId);
    const from = val;
    const to = target;
    if (Math.abs(from - to) < 0.0001) return;

    s.from = from;
    s.to = to;
    s.startTime = 0;

    s.rafId = requestAnimationFrame(function step(ts) {
      if (s.startTime === 0) s.startTime = ts;
      const t = Math.min((ts - s.startTime) / ms, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setVal(s.from + (s.to - s.from) * ease);
      if (t < 1) s.rafId = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(s.rafId);
  }, [target, ms]); // eslint-disable-line react-hooks/exhaustive-deps

  return val;
}

export function PowerTriangle({ pMW, cosPhi1, cosPhi2 }: PowerTriangleProps) {
  const calc = calcCompensation(pMW, cosPhi1, cosPhi2, 22, 0, 1);

  const { q1MVAr, s1MVA, qKompMVAr, q2MVAr, s2MVA, phi1Deg, phi2Deg } = calc;

  // Animate q2 (and derived positions) for smooth visual
  const animQ2 = useAnimated(q2MVAr);

  const W = 340;
  const H = 220;
  const padL = 44;
  const padR = 70;
  const padT = 20;
  const padB = 44;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;

  const maxQ = Math.max(q1MVAr, 0.01);
  const scaleP = pMW > 0 ? drawW / pMW : 1;
  const scaleQ = drawH / maxQ;
  const scale = Math.min(scaleP, scaleQ) * 0.88;

  const Ppx = pMW * scale;
  const Q1px = q1MVAr * scale;
  const Q2px = animQ2 * scale;
  const QKpx = Q1px - Q2px;

  const ox = padL;
  const oy = H - padB;
  const px = ox + Ppx;   // P end x
  const s1y = oy - Q1px; // S1 end y
  const s2y = oy - Q2px; // S2 end y (animated)

  // Angle arcs at origin
  const arcR = Math.min(28, Ppx * 0.28);
  const phi1Rad = Math.atan2(Q1px, Ppx);
  const phi2Rad = Math.atan2(Q2px, Ppx);
  const arc1EndX = ox + arcR * Math.cos(phi1Rad);
  const arc1EndY = oy - arcR * Math.sin(phi1Rad);
  const innerR = arcR * 0.65;
  const arc2EndX = ox + innerR * Math.cos(phi2Rad);
  const arc2EndY = oy - innerR * Math.sin(phi2Rad);

  const labelStyle: React.CSSProperties = { fontSize: 11, fontFamily: 'monospace' };

  return (
    <svg
      width={W}
      height={H}
      style={{ background: '#0A1520', borderRadius: 8, display: 'block' }}
      aria-label="Effekttrekant"
    >
      {/* ── Original S₁ hypotenuse (grå stiplet) ── */}
      <line x1={ox} y1={oy} x2={px} y2={s1y}
        stroke="#607D8B" strokeWidth={1.5} strokeDasharray="5 3" />

      {/* ── Original Q₁ linje (grå stiplet) ── */}
      <line x1={px} y1={oy} x2={px} y2={s1y}
        stroke="#607D8B" strokeWidth={1.5} strokeDasharray="5 3" />

      {/* ── Q_komp-pil (lilla) — fra Q₂-nivå ned til Q₁ ── */}
      {QKpx > 2 && (
        <>
          <line x1={px} y1={s2y} x2={px} y2={s1y}
            stroke="#9C27B0" strokeWidth={2.5} />
          {/* Pil-hode */}
          <polygon
            points={`${px},${s1y} ${px - 5},${s1y + 8} ${px + 5},${s1y + 8}`}
            fill="#9C27B0"
          />
          {/* Label Q_komp */}
          <text x={px + 6} y={(s1y + s2y) / 2 + 4} fill="#CE93D8" style={labelStyle}>
            Q_komp
          </text>
          <text x={px + 6} y={(s1y + s2y) / 2 + 17} fill="#CE93D8" style={labelStyle}>
            {qKompMVAr.toFixed(3)} MVAr
          </text>
        </>
      )}

      {/* ── Q₂ linje (oransje, current) ── */}
      <line x1={px} y1={oy} x2={px} y2={s2y}
        stroke="#FF9800" strokeWidth={2.5} />

      {/* ── S₂ hypotenuse (cyan) ── */}
      <line x1={ox} y1={oy} x2={px} y2={s2y}
        stroke="#4FC3F7" strokeWidth={2.5} />

      {/* ── P-linje (grønn) ── */}
      <line x1={ox} y1={oy} x2={px} y2={oy}
        stroke="#4CAF50" strokeWidth={2.5} />

      {/* ── φ₁-bue (grå) ── */}
      {arcR > 6 && (
        <path
          d={`M ${ox + arcR},${oy} A ${arcR},${arcR} 0 0,0 ${arc1EndX},${arc1EndY}`}
          fill="none" stroke="#607D8B" strokeWidth={1.5}
        />
      )}

      {/* ── φ₂-bue (cyan) ── */}
      {arcR > 6 && Q2px > 2 && (
        <path
          d={`M ${ox + innerR},${oy} A ${innerR},${innerR} 0 0,0 ${arc2EndX},${arc2EndY}`}
          fill="none" stroke="#4FC3F7" strokeWidth={1.5}
        />
      )}

      {/* ── Labels ── */}

      {/* P label */}
      <text x={ox + Ppx / 2} y={oy + 16} fill="#4CAF50" style={{ ...labelStyle, textAnchor: 'middle' }}>
        P = {pMW.toFixed(1)} MW
      </text>

      {/* Q₁ label (grå) */}
      {Q1px > 16 && (
        <text x={px - 8} y={(oy + s1y) / 2} fill="#607D8B" style={{ ...labelStyle, textAnchor: 'end' }}>
          Q₁ = {q1MVAr.toFixed(2)} MVAr
        </text>
      )}

      {/* Q₂ label (oransje) */}
      {Q2px > 16 && (
        <text x={px + 4} y={(oy + s2y) / 2} fill="#FF9800" style={labelStyle}>
          Q₂ = {animQ2.toFixed(2)}
        </text>
      )}

      {/* S₁ label */}
      <text
        x={(ox + px) / 2 - 10}
        y={(oy + s1y) / 2 - 6}
        fill="#607D8B"
        style={{ ...labelStyle, textAnchor: 'middle' }}
      >
        S₁={s1MVA.toFixed(2)} MVA
      </text>

      {/* S₂ label */}
      <text
        x={(ox + px) / 2 - 4}
        y={(oy + s2y) / 2 + 14}
        fill="#4FC3F7"
        style={{ ...labelStyle, textAnchor: 'middle' }}
      >
        S₂={s2MVA.toFixed(2)} MVA
      </text>

      {/* φ₁ label */}
      {arcR > 10 && (
        <text x={ox + arcR + 6} y={oy - 4} fill="#607D8B" style={{ fontSize: 10 }}>
          φ₁={phi1Deg.toFixed(1)}°
        </text>
      )}

      {/* φ₂ label */}
      {arcR > 10 && Q2px > 6 && (
        <text x={ox + arcR * 0.65 + 4} y={oy - arcR * 0.65 * 0.35 - 4} fill="#4FC3F7" style={{ fontSize: 10 }}>
          φ₂={phi2Deg.toFixed(1)}°
        </text>
      )}

      {/* cosφ₁ og cosφ₂ */}
      <text x={W - padR + 2} y={padT + 14} fill="#607D8B" style={{ fontSize: 10 }}>
        cosφ₁={cosPhi1.toFixed(3)}
      </text>
      <text x={W - padR + 2} y={padT + 28} fill="#4FC3F7" style={{ fontSize: 10 }}>
        cosφ₂={cosPhi2.toFixed(3)}
      </text>
    </svg>
  );
}
