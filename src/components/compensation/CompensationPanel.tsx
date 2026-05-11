import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { calcCompensation } from '../../core/compensation.js';
import { PowerTriangle } from './PowerTriangle.js';

interface CompensationPanelProps {
  onClose: () => void;
}

const panelStyle: React.CSSProperties = {
  background: '#0F1F30',
  border: '1px solid #6A1B9A',
  borderRadius: 8,
  padding: '16px 20px',
  color: '#E8F0FE',
  fontSize: 13,
};

const labelStyle: React.CSSProperties = {
  color: '#9E9E9E',
  fontSize: 11,
  marginBottom: 2,
};

const valueStyle: React.CSSProperties = {
  color: '#CE93D8',
  fontWeight: 600,
  fontSize: 13,
};

export function CompensationPanel({ onClose }: CompensationPanelProps) {
  const { project, runCompensation, powerFlowStatus } = useNetworkStore();
  const pqBuses = project.buses.filter((b) => b.type === 'PQ' && b.loadMW > 0);

  const [selectedBusId, setSelectedBusId] = useState<string>(pqBuses[0]?.id ?? '');
  const [cosPhi2, setCosPhi2] = useState(0.98);
  const [steps, setSteps] = useState(3);

  const bus = project.buses.find((b) => b.id === selectedBusId);
  const connectedLine = bus
    ? project.lines.find((l) => l.fromBusId === selectedBusId || l.toBusId === selectedBusId)
    : undefined;

  const pMW = bus?.loadMW ?? 0;
  const q1MVAr = bus?.loadMVAr ?? 0;
  const sMVA = Math.sqrt(pMW ** 2 + q1MVAr ** 2);
  const cosPhi1 = sMVA > 0 ? pMW / sMVA : 1;
  const voltageKV = bus?.voltageKV ?? 22;
  const rTotal = connectedLine
    ? connectedLine.rOhmPerKm * connectedLine.lengthKm
    : 0;

  const calc = pMW > 0
    ? calcCompensation(pMW, cosPhi1, cosPhi2, voltageKV, rTotal, steps)
    : null;

  const canCompensate =
    powerFlowStatus !== 'running' && !!bus && pMW > 0 && cosPhi2 > cosPhi1 - 0.001;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: '#CE93D8', fontSize: 15 }}>
          Fasekompensering
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#757575', cursor: 'pointer', fontSize: 16 }}
        >✕</button>
      </div>

      {/* Buss-velger */}
      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Velg buss</div>
        <select
          value={selectedBusId}
          onChange={(e) => setSelectedBusId(e.target.value)}
          style={{
            background: '#1A2A3A',
            border: '1px solid #374151',
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '4px 8px',
            width: '100%',
            fontSize: 12,
          }}
        >
          {pqBuses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} (P={b.loadMW} MW, Q={b.loadMVAr.toFixed(3)} MVAr)
            </option>
          ))}
          {pqBuses.length === 0 && <option value="">Ingen PQ-busser med last</option>}
        </select>
      </div>

      {bus && (
        <>
          {/* Nåværende tilstand */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div>
              <div style={labelStyle}>P [MW]</div>
              <div style={valueStyle}>{pMW.toFixed(2)}</div>
            </div>
            <div>
              <div style={labelStyle}>Q₁ [MVAr]</div>
              <div style={valueStyle}>{q1MVAr.toFixed(3)}</div>
            </div>
            <div>
              <div style={labelStyle}>cosφ₁</div>
              <div style={valueStyle}>{cosPhi1.toFixed(4)}</div>
            </div>
          </div>

          {/* Animert effekttrekant */}
          <div style={{ marginBottom: 14 }}>
            <PowerTriangle pMW={pMW} cosPhi1={cosPhi1} cosPhi2={cosPhi2} />
          </div>

          {/* cosφ₂-slider */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={labelStyle}>Ønsket cosφ₂</div>
              <span style={{ ...valueStyle, fontSize: 14 }}>{cosPhi2.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.80}
              max={1.00}
              step={0.01}
              value={cosPhi2}
              onChange={(e) => setCosPhi2(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#9C27B0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#616161' }}>
              <span>0.80</span><span>1.00</span>
            </div>
          </div>

          {/* Trinn-velger */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={labelStyle}>Kompenseringstrinn</div>
              <span style={{ ...valueStyle, fontSize: 13 }}>{steps} trinn</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#7B1FA2' }}
            />
          </div>

          {/* Beregnet Q_komp */}
          {calc && (
            <div
              style={{
                background: '#1A0A2A',
                borderRadius: 6,
                padding: '10px 12px',
                marginBottom: 14,
                border: '1px solid #4A148C',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={labelStyle}>Q_komp</div>
                  <div style={{ ...valueStyle, fontSize: 15 }}>{calc.qKompMVAr.toFixed(3)} MVAr</div>
                </div>
                <div>
                  <div style={labelStyle}>Q₂ (rest)</div>
                  <div style={{ ...valueStyle, fontSize: 15 }}>{calc.q2MVAr.toFixed(3)} MVAr</div>
                </div>
                <div>
                  <div style={labelStyle}>Strømreduksjon</div>
                  <div style={{ color: '#81C784', fontWeight: 600 }}>
                    {calc.currentReductionPct.toFixed(1)} %
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Tap-reduksjon</div>
                  <div style={{ color: '#81C784', fontWeight: 600 }}>
                    {calc.lossReductionPct.toFixed(1)} %
                  </div>
                </div>
              </div>

              {/* Trinnvis cosφ */}
              {steps > 1 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ ...labelStyle, marginBottom: 3 }}>cosφ per trinn</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {calc.steppedCosPhi.map((cf, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#2A0A3A',
                          border: '1px solid #6A1B9A',
                          borderRadius: 3,
                          padding: '1px 5px',
                          fontSize: 11,
                          color: '#CE93D8',
                        }}
                      >
                        T{i + 1}: {cf.toFixed(3)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Koble inn-knapp */}
          <button
            disabled={!canCompensate}
            onClick={() => {
              if (bus) runCompensation(bus.id, cosPhi2, steps);
            }}
            style={{
              width: '100%',
              padding: '8px 0',
              borderRadius: 5,
              border: 'none',
              cursor: canCompensate ? 'pointer' : 'not-allowed',
              background: canCompensate ? '#6A1B9A' : '#2A1A3A',
              color: canCompensate ? '#F3E5F5' : '#616161',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {powerFlowStatus === 'running'
              ? 'Beregner...'
              : `Koble inn kompensering (${steps} trinn)`}
          </button>
        </>
      )}
    </div>
  );
}
