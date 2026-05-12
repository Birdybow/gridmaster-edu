import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { Bus } from '../../types/index.js';
import { useNetworkStore } from '../../store/useNetworkStore.js';

const TYPE_LABELS: Record<string, string> = { slack: 'SLACK', PV: 'PV', PQ: 'PQ' };

const ICON_MAP: Record<string, string> = {
  slack: '/icons/bus-slack.png',
  PV: '/icons/generator.png',
  PQ: '/icons/bus-pq.png',
};

function voltageRingColor(vMagPU: number | undefined): string {
  if (vMagPU === undefined) return '#1565C0';
  if (vMagPU > 1.05) return '#FF9800';
  if (vMagPU >= 0.95) return '#4CAF50';
  if (vMagPU >= 0.90) return '#FFEB3B';
  return '#F44336';
}

function BusNodeComponent({ data, selected }: NodeProps<Bus>) {
  const powerFlow = useNetworkStore((s) => s.project.results.powerFlow);
  const busResult = powerFlow?.buses.find((b) => b.busId === data.id);

  const icon = ICON_MAP[data.type] ?? '/icons/bus-pq.png';
  const badge = TYPE_LABELS[data.type] ?? data.type;
  const borderColor = selected ? '#4FC3F7' : voltageRingColor(busResult?.vMagPU);

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ width: 80 }}
    >
      <div
        className="rounded-lg overflow-hidden border-2"
        style={{
          width: 56,
          height: 56,
          background: '#0D3B66',
          borderColor,
          boxShadow: selected ? `0 0 8px ${borderColor}` : 'none',
        }}
      >
        <img src={icon} alt={badge} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <span
        className="mt-1 px-2 py-0.5 rounded text-xs font-bold"
        style={badge === 'SLACK' ? { background: '#4FC3F7', color: '#0D3B66' }
          : badge === 'PV' ? { background: '#1565C0', color: '#FFF' }
          : { background: '#1A2A3A', color: '#CE93D8', border: '1px solid #4A2060' }}
      >
        {badge}
      </span>

      <span className="mt-0.5 text-center leading-tight text-xs" style={{ color: '#E8F0FE', maxWidth: 80, wordBreak: 'break-word' }}>
        {data.name}
      </span>

      {busResult ? (
        <span className="text-xs font-bold" style={{ color: voltageRingColor(busResult.vMagPU) }}>
          {busResult.vMagPU.toFixed(4)} p.u.
        </span>
      ) : (
        <span className="text-xs" style={{ color: '#4FC3F7' }}>
          {data.voltageKV} kV
        </span>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
      <Handle type="target" position={Position.Left} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
    </div>
  );
}

export const BusNode = memo(BusNodeComponent);
