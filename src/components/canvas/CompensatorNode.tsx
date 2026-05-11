import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { Compensator } from '../../types/index.js';

interface CompensatorSidebarProps {
  comp: Compensator;
  onClose: () => void;
}

function CompensatorSidebar({ comp, onClose }: CompensatorSidebarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        top: 80,
        width: 260,
        background: '#1A2A3A',
        border: '1px solid #7B1FA2',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        zIndex: 50,
        color: '#E8F0FE',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, color: '#CE93D8', fontSize: 14 }}>{comp.name}</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', fontSize: 16 }}
        >✕</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ color: '#9E9E9E', paddingRight: 8, paddingBottom: 4 }}>Type</td>
            <td>Kondensatorbank</td>
          </tr>
          <tr>
            <td style={{ color: '#9E9E9E', paddingRight: 8, paddingBottom: 4 }}>Q_komp</td>
            <td style={{ color: '#CE93D8', fontWeight: 600 }}>{comp.totalMVAr.toFixed(3)} MVAr</td>
          </tr>
          <tr>
            <td style={{ color: '#9E9E9E', paddingRight: 8, paddingBottom: 4 }}>Trinn</td>
            <td>{comp.stepsEnabled} / {comp.steps}</td>
          </tr>
          <tr>
            <td style={{ color: '#9E9E9E', paddingRight: 8, paddingBottom: 4 }}>Trinnsats</td>
            <td>{comp.stepSizeMVAr.toFixed(3)} MVAr/trinn</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CompensatorNodeComponent({ data }: NodeProps<Compensator>) {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          width: 72,
        }}
        onClick={() => setShowPanel((v) => !v)}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: '#1A0A2A',
            border: '2px solid #9C27B0',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <img
            src="/icons/capacitor.png"
            alt="Kondensator"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <span
          style={{
            marginTop: 3,
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 700,
            background: '#6A1B9A',
            color: '#F3E5F5',
          }}
        >
          Q_KOMP
        </span>

        <span
          style={{
            marginTop: 2,
            fontSize: 10,
            color: '#CE93D8',
            maxWidth: 72,
            textAlign: 'center',
            wordBreak: 'break-word',
          }}
        >
          {data.name}
        </span>

        <span style={{ fontSize: 10, color: '#AB47BC', fontWeight: 600 }}>
          {data.totalMVAr.toFixed(3)} MVAr
        </span>

        <Handle type="target" position={Position.Left} style={{ background: '#9C27B0' }} />
        <Handle type="source" position={Position.Right} style={{ background: '#9C27B0' }} />
      </div>

      {showPanel && (
        <CompensatorSidebar comp={data} onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}

export const CompensatorNode = memo(CompensatorNodeComponent);
