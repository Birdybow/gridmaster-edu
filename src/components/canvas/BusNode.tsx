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

const GEN_BADGE: Record<string, { color: string; imgSrc: string; label: string }> = {
  hydro_francis: { color: '#1565C0', imgSrc: '/icons/hydro.png', label: 'Francis' },
  hydro_pelton:  { color: '#1565C0', imgSrc: '/icons/hydro.png', label: 'Pelton' },
  hydro_kaplan:  { color: '#1565C0', imgSrc: '/icons/hydro.png', label: 'Kaplan' },
  wind:          { color: '#2E7D32', imgSrc: '/icons/wind.png',  label: 'Vind' },
  solar:         { color: '#F57F17', imgSrc: '/icons/solar.png', label: 'Sol' },
  nuclear:       { color: '#B71C1C', imgSrc: '/icons/nuclear.png', label: 'Atom' },
  thermal:       { color: '#E65100', imgSrc: '/icons/nuclear.png', label: 'Termisk' },
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
  const generators = useNetworkStore((s) => s.project.generators);
  const selectedFaultBusId = useNetworkStore((s) => s.selectedFaultBusId);
  const scResults = useNetworkStore((s) => s.project.results.shortCircuit);
  const selectedEarthFaultBusId = useNetworkStore((s) => s.selectedEarthFaultBusId);
  const efResult = useNetworkStore((s) => s.project.results.earthFault);
  const busResult = powerFlow?.buses.find((b) => b.busId === data.id);
  const gen = generators.find((g) => g.busId === data.id);
  const genBadge = gen ? GEN_BADGE[gen.generatorType] : null;
  const isFaultBus = selectedFaultBusId === data.id && (scResults?.length ?? 0) > 0;
  const isEarthFaultBus = selectedEarthFaultBusId === data.id && efResult !== undefined;

  const icon = ICON_MAP[data.type] ?? '/icons/bus-pq.png';
  const badge = TYPE_LABELS[data.type] ?? data.type;
  const borderColor = isFaultBus
    ? '#EF5350'
    : isEarthFaultBus
    ? '#FFB74D'
    : selected
    ? '#4FC3F7'
    : voltageRingColor(busResult?.vMagPU);

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer select-none"
      style={{ width: 80 }}
    >
      {isFaultBus && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 16,
            animation: 'pulse 1s infinite',
            zIndex: 10,
          }}
        >
          ⚡
        </div>
      )}
      {isEarthFaultBus && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 14,
            animation: 'pulse 1s infinite',
            zIndex: 10,
            color: '#FFB74D',
          }}
        >
          ⏚
        </div>
      )}
      <div
        className="rounded-lg overflow-hidden border-2"
        style={{
          width: 56,
          height: 56,
          background: isFaultBus ? '#1A0000' : isEarthFaultBus ? '#1A1400' : '#0D3B66',
          borderColor,
          boxShadow: isFaultBus
            ? `0 0 12px #EF5350, 0 0 24px #B71C1C`
            : isEarthFaultBus
            ? `0 0 12px #FFB74D, 0 0 24px #F57F17`
            : selected ? `0 0 8px ${borderColor}` : 'none',
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

      {genBadge && (
        <div
          style={{
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: genBadge.color,
            borderRadius: 4,
            padding: '2px 5px',
          }}
        >
          <img
            src={genBadge.imgSrc}
            alt={genBadge.label}
            style={{ width: 12, height: 12, objectFit: 'cover', borderRadius: 2 }}
          />
          <span style={{ fontSize: 9, color: '#FFF', fontWeight: 700, letterSpacing: '0.04em' }}>
            {genBadge.label}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
      <Handle type="target" position={Position.Left} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#4FC3F7', width: 10, height: 10 }} />
    </div>
  );
}

export const BusNode = memo(BusNodeComponent);
