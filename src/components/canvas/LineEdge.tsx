import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import type { Line } from '../../types/index.js';

interface LineEdgeData extends Partial<Line> {
  label?: string;
  voltageDropPct?: number;
  flowCurrentA?: number;
  loadingPercent?: number;
  showFlow?: boolean;
}

function voltageDropColor(pct: number | undefined, lineType: string): string {
  if (pct === undefined) return lineType === 'cable' ? '#4FC3F7' : '#1565C0';
  if (pct < 5) return '#4CAF50';
  if (pct < 10) return '#FFB74D';
  return '#EF5350';
}

function flowColor(loadingPct: number | undefined): string {
  if (loadingPct === undefined) return '#4CAF50';
  if (loadingPct > 100) return '#EF5350';
  if (loadingPct > 70) return '#FFB74D';
  return '#4CAF50';
}

function LineEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<LineEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const lineType = data?.lineType ?? 'overhead';
  const stroke = voltageDropColor(data?.voltageDropPct, lineType);
  const strokeDasharray = lineType === 'cable' ? '6 3' : undefined;
  const label = data?.label ?? data?.name;

  const showFlow = data?.showFlow && data?.flowCurrentA !== undefined;
  const currentA = data?.flowCurrentA ?? 0;
  const loadingPct = data?.loadingPercent;
  const arrowColor = flowColor(loadingPct);

  // Speed: faster current = shorter animation duration (capped 0.5s–3s)
  const absA = Math.abs(currentA);
  const durationS = absA > 0 ? Math.max(0.5, Math.min(3, 300 / absA)) : 2;
  // Reverse direction if current is negative (flows from target to source)
  const animDir = currentA >= 0 ? 'normal' : 'reverse';

  const animId = `flow-${id}`;

  return (
    <>
      <defs>
        {showFlow && (
          <style>{`
            @keyframes ${animId} {
              from { stroke-dashoffset: 24; }
              to   { stroke-dashoffset: 0; }
            }
          `}</style>
        )}
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke, strokeWidth: 2, strokeDasharray }}
      />

      {showFlow && absA > 0.1 && (
        <path
          d={edgePath}
          fill="none"
          stroke={arrowColor}
          strokeWidth={3}
          strokeDasharray="12 12"
          strokeLinecap="round"
          style={{
            animation: `${animId} ${durationS}s linear infinite`,
            animationDirection: animDir,
            opacity: 0.85,
          }}
        />
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              background: '#1A2A3A',
              color: '#4FC3F7',
              fontSize: 10,
              padding: '1px 4px',
              borderRadius: 3,
              border: '1px solid #0D3B66',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const LineEdge = memo(LineEdgeComponent);
