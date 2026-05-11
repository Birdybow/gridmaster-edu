import { getStraightPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';

/** Dashed purple link between a CompensatorNode and its connected bus. Non-interactive. */
export function CompensatorLinkEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps) {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <path
      d={path}
      stroke="#9C27B0"
      strokeWidth={1.5}
      strokeDasharray="5,5"
      fill="none"
      style={{ pointerEvents: 'none' }}
    />
  );
}
