import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import type { Line } from '../../types/index.js';
import { getFlowState, FLOW_COLORS } from '../../utils/flow-color.js';

interface LineEdgeData extends Partial<Line> {
  label?: string;
  voltageDropPct?: number;
  flowCurrentA?: number;
  loadingPercent?: number;
  showFlow?: boolean;
  isOpposing?: boolean;
  protectionStatus?: 'ok' | 'warning' | 'error' | 'present';
  protTripTimeS?: number;
}

function voltageDropColor(pct: number | undefined, lineType: string): string {
  if (pct === undefined) return lineType === 'cable' ? '#4FC3F7' : '#1565C0';
  if (pct < 5) return '#4CAF50';
  if (pct < 10) return '#FFB74D';
  return '#EF5350';
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

  const protStatus = data?.protectionStatus;
  const protTripTimeS = data?.protTripTimeS;
  const shieldColor =
    protStatus === 'ok' ? '#4CAF50' :
    protStatus === 'warning' ? '#FFB74D' :
    protStatus === 'error' ? '#EF5350' :
    protStatus === 'present' ? '#607D8B' : null;

  const showFlow = data?.showFlow && data?.flowCurrentA !== undefined;
  const currentA = data?.flowCurrentA ?? 0;
  const absA = Math.abs(currentA);

  const flowState = getFlowState({ currentA, isOpposing: data?.isOpposing });
  const arrowColor = FLOW_COLORS[flowState];

  // Speed: faster current = shorter animation duration (capped 0.5s–3s)
  const durationS = absA > 0 ? Math.max(0.5, Math.min(3, 300 / absA)) : 2;
  // Reverse direction if current is negative (flows from target to source)
  const animDir = currentA >= 0 ? 'normal' : 'reverse';

  // Reversed flow: dashed red pattern; opposing: solid orange; normal: solid green
  const flowDasharray = flowState === 'reversed' ? '8 8' : '12 12';

  return (
    <>
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
          strokeDasharray={flowDasharray}
          strokeLinecap="round"
          style={{
            animation: `flow-dash ${durationS}s linear infinite`,
            animationDirection: animDir,
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />
      )}

      <EdgeLabelRenderer>
        {label && (
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
        )}
        {shieldColor && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX + 36}px,${labelY}px)`,
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
            }}
            title="Overstrømsvern"
          >
            <span style={{ fontSize: 12, color: shieldColor, textShadow: `0 0 4px ${shieldColor}` }}>🛡</span>
            {(protStatus === 'ok' || protStatus === 'warning') && protTripTimeS !== undefined && (
              <span style={{ fontSize: 8, color: shieldColor, fontWeight: 700, marginTop: 1 }}>
                {protTripTimeS.toFixed(2)}s
              </span>
            )}
            {protStatus === 'error' && (
              <span style={{ fontSize: 8, color: '#EF5350', fontWeight: 700, marginTop: 1 }}>
                ⚠ ut!
              </span>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const LineEdge = memo(LineEdgeComponent);
