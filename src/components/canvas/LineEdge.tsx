import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import type { Line } from '../../types/index.js';

interface LineEdgeData extends Partial<Line> {
  label?: string;
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
  const stroke = lineType === 'cable' ? '#4FC3F7' : '#1565C0';
  const strokeDasharray = lineType === 'cable' ? '6 3' : undefined;
  const label = data?.label ?? data?.name;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke, strokeWidth: 2, strokeDasharray }}
      />
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
