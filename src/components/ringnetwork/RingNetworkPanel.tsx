import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { getBusName } from '../../utils/display.js';

interface Props {
  onClose: () => void;
}

export function RingNetworkPanel({ onClose }: Props) {
  const buses = useNetworkStore((s) => s.project.buses);
  const showFlowDirections = useNetworkStore((s) => s.showFlowDirections);
  const toggleFlowDirections = useNetworkStore((s) => s.toggleFlowDirections);
  const runRingNetwork = useNetworkStore((s) => s.runRingNetwork);
  const runPowerFlow = useNetworkStore((s) => s.runPowerFlow);
  const powerFlowStatus = useNetworkStore((s) => s.powerFlowStatus);

  const [busA, setBusA] = useState('');
  const [busB, setBusB] = useState('');
  const [busC, setBusC] = useState('');

  const canCompute = busA && busB && busC && busA !== busB && busA !== busC && busB !== busC;

  function handleCompute() {
    if (!canCompute) return;
    runRingNetwork(busA, busB, busC);
  }

  function handlePowerFlow() {
    runPowerFlow();
  }

  const selectStyle: React.CSSProperties = {
    background: '#0D1B2A',
    color: '#E8F0FE',
    border: '1px solid #1E3A5F',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#7FA8C9',
    marginBottom: 2,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        width: 260,
        background: '#001A00',
        border: '1px solid #1B5E20',
        borderRadius: 8,
        padding: 12,
        zIndex: 200,
        boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        color: '#E8F0FE',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, color: '#4CAF50', fontSize: 13 }}>⭕ Ringnett</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#7FA8C9', cursor: 'pointer', fontSize: 16 }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={labelStyle}>Forsyningspunkt A (Slack/PV)</div>
        <select value={busA} onChange={(e) => setBusA(e.target.value)} style={selectStyle}>
          <option value="">-- velg buss --</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b.voltageKV} kV)</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={labelStyle}>Forsyningspunkt B (Slack/PV)</div>
        <select value={busB} onChange={(e) => setBusB(e.target.value)} style={selectStyle}>
          <option value="">-- velg buss --</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b.voltageKV} kV)</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Lastbuss C</div>
        <select value={busC} onChange={(e) => setBusC(e.target.value)} style={selectStyle}>
          <option value="">-- velg buss --</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b.voltageKV} kV)</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCompute}
        disabled={!canCompute}
        style={{
          width: '100%',
          padding: '6px 0',
          background: canCompute ? '#1B5E20' : '#1A2A3A',
          color: canCompute ? '#A5D6A7' : '#7FA8C9',
          border: `1px solid ${canCompute ? '#2E7D32' : '#1E3A5F'}`,
          borderRadius: 4,
          cursor: canCompute ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        Beregn strømdeling
      </button>

      <button
        onClick={handlePowerFlow}
        style={{
          width: '100%',
          padding: '6px 0',
          background: '#0D2B45',
          color: '#4FC3F7',
          border: '1px solid #1E3A5F',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        {powerFlowStatus === 'running' ? '⏳ Kjører NR…' : '⚡ Kjør lastflyt (NR)'}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          borderTop: '1px solid #1B5E20',
          marginTop: 4,
        }}
      >
        <input
          type="checkbox"
          id="flow-dir"
          checked={showFlowDirections}
          onChange={toggleFlowDirections}
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="flow-dir" style={{ cursor: 'pointer', fontSize: 11, color: '#A5D6A7' }}>
          Vis strømpiler på canvas
        </label>
      </div>

      {busC && buses.find((b) => b.id === busC) && (
        <div style={{ marginTop: 8, padding: 6, background: '#0A1A0A', borderRadius: 4, fontSize: 11, color: '#7FA8C9' }}>
          Last {getBusName(busC, buses)}: {buses.find((b) => b.id === busC)?.loadMW} MW +
          j{buses.find((b) => b.id === busC)?.loadMVAr} MVAr
        </div>
      )}
    </div>
  );
}
