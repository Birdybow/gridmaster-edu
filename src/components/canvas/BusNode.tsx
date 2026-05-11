import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { Bus } from '../../types/index.js';

const TYPE_LABELS: Record<string, string> = {
  slack: 'SLACK',
  PV: 'PV',
  PQ: 'PQ',
};

const TYPE_COLORS: Record<string, string> = {
  slack: 'bg-cyan-400 text-navy',
  PV: 'bg-blue-500 text-white',
  PQ: 'bg-surface text-cyan-300',
};

const ICON_MAP: Record<string, string> = {
  slack: '/icons/bus-slack.png',
  PV: '/icons/generator.png',
  PQ: '/icons/bus-pq.png',
};

interface BusNodeData extends Bus {
  selected?: boolean;
}

interface SidebarProps {
  bus: BusNodeData;
  onClose: () => void;
}

function BusSidebar({ bus, onClose }: SidebarProps) {
  return (
    <div
      className="fixed right-4 top-20 w-72 bg-surface border border-cyan-800 rounded-lg p-4 shadow-xl z-50 text-text text-sm"
      style={{ background: '#1A2A3A', color: '#E8F0FE' }}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-cyan-300 text-base">{bus.name}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <table className="w-full text-xs">
        <tbody>
          <tr><td className="text-gray-400 pr-2">Type</td><td>{bus.type}</td></tr>
          <tr><td className="text-gray-400 pr-2">Spenning</td><td>{bus.voltageKV} kV</td></tr>
          <tr><td className="text-gray-400 pr-2">Last P</td><td>{bus.loadMW} MW</td></tr>
          <tr><td className="text-gray-400 pr-2">Last Q</td><td>{bus.loadMVAr} MVAr</td></tr>
          <tr><td className="text-gray-400 pr-2">V set</td><td>{bus.vSetPU} p.u.</td></tr>
          {bus.genMW !== undefined && (
            <tr><td className="text-gray-400 pr-2">Gen P</td><td>{bus.genMW} MW</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function BusNodeComponent({ data }: NodeProps<BusNodeData>) {
  const [showPanel, setShowPanel] = useState(false);
  const icon = ICON_MAP[data.type] ?? '/icons/bus-pq.png';
  const badge = TYPE_LABELS[data.type] ?? data.type;
  const badgeColor = TYPE_COLORS[data.type] ?? TYPE_COLORS['PQ'];

  return (
    <>
      <div
        className="relative flex flex-col items-center cursor-pointer select-none"
        style={{ width: 80 }}
        onClick={() => setShowPanel((v) => !v)}
      >
        {/* Icon */}
        <div
          className="rounded-lg overflow-hidden border-2 border-cyan-700"
          style={{ width: 56, height: 56, background: '#0D3B66' }}
        >
          <img
            src={icon}
            alt={badge}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Type badge */}
        <span
          className={`mt-1 px-2 py-0.5 rounded text-xs font-bold ${badgeColor}`}
          style={badge === 'SLACK' ? { background: '#4FC3F7', color: '#0D3B66' } : {}}
        >
          {badge}
        </span>

        {/* Name */}
        <span
          className="mt-0.5 text-center leading-tight text-xs"
          style={{ color: '#E8F0FE', maxWidth: 80, wordBreak: 'break-word' }}
        >
          {data.name}
        </span>

        {/* kV label */}
        <span className="text-xs" style={{ color: '#4FC3F7' }}>
          {data.voltageKV} kV
        </span>

        <Handle type="source" position={Position.Right} style={{ background: '#4FC3F7' }} />
        <Handle type="target" position={Position.Left} style={{ background: '#4FC3F7' }} />
      </div>

      {showPanel && (
        <BusSidebar bus={data} onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}

export const BusNode = memo(BusNodeComponent);
