import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { LoadProfileChart } from './LoadProfileChart.js';
import { ProductionProfileChart } from './ProductionProfileChart.js';
import { EnergyBalanceChart } from './EnergyBalanceChart.js';

interface Props {
  onClose: () => void;
}

export function TimeSeriesPanel({ onClose }: Props) {
  const {
    project,
    selectedHour,
    timeSeriesLoad,
    timeSeriesProduction,
    timeSeriesBalance,
    setSelectedHour,
    runTimeSeries,
    runPowerFlow,
    updateBus,
  } = useNetworkStore();

  const [pMaxMW, setPMaxMW] = useState(10);
  const [cosPhi, setCosPhi] = useState(0.9);
  const [hasRun, setHasRun] = useState(false);

  function handleRun() {
    runTimeSeries(pMaxMW, cosPhi);
    setHasRun(true);
  }

  function handleHourSelect(h: number) {
    setSelectedHour(h);
  }

  // S10-10: Apply load for selected hour to all PQ buses, then run NR
  function handleRunNR() {
    if (!hasRun || timeSeriesLoad.length === 0) return;
    const step = timeSeriesLoad[selectedHour];
    const pqBuses = project.buses.filter((b) => b.type === 'PQ');
    if (pqBuses.length === 0) return;

    const pPerBus = step.pMW / pqBuses.length;
    const qPerBus = step.qMVAr / pqBuses.length;

    for (const bus of pqBuses) {
      updateBus(bus.id, { loadMW: pPerBus, loadMVAr: qPerBus });
    }
    runPowerFlow();
  }

  const loadMW = timeSeriesLoad.map((s) => s.pMW);

  const selectedBalance = timeSeriesBalance[selectedHour];
  const balanceColor = !selectedBalance
    ? '#607D8B'
    : selectedBalance.balance >= 0
    ? '#4CAF50'
    : '#EF4444';

  const pqCount = project.buses.filter((b) => b.type === 'PQ').length;

  return (
    <div
      style={{
        background: '#0A1929',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: 460,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#90CAF9' }}>
          Tidsserie-simulering 24t
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#607D8B',
            fontSize: 18,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>P_max [MW]</div>
          <input
            type="number"
            value={pMaxMW}
            min={0.1}
            step={1}
            onChange={(e) => setPMaxMW(parseFloat(e.target.value) || 1)}
            style={{
              width: '100%',
              background: '#0D2137',
              border: '1px solid #1E3A5F',
              borderRadius: 4,
              color: '#E8F0FE',
              padding: '4px 8px',
              fontSize: 13,
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>cos φ</div>
          <input
            type="number"
            value={cosPhi}
            min={0.7}
            max={1}
            step={0.01}
            onChange={(e) => setCosPhi(parseFloat(e.target.value) || 0.9)}
            style={{
              width: '100%',
              background: '#0D2137',
              border: '1px solid #1E3A5F',
              borderRadius: 4,
              color: '#E8F0FE',
              padding: '4px 8px',
              fontSize: 13,
            }}
          />
        </div>
        <button
          onClick={handleRun}
          style={{
            background: '#1565C0',
            border: 'none',
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '6px 14px',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Beregn
        </button>
      </div>

      {hasRun && (
        <>
          {/* Hour slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: '#607D8B' }}>Valgt time: {selectedHour}:00</div>
              {selectedBalance && (
                <div style={{ fontSize: 10, color: balanceColor, fontWeight: 700 }}>
                  Balanse: {selectedBalance.balance >= 0 ? '+' : ''}
                  {selectedBalance.balance.toFixed(2)} MW
                </div>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={selectedHour}
              onChange={(e) => handleHourSelect(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#2196F3' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#455A64' }}>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
            </div>
          </div>

          {/* Charts */}
          <LoadProfileChart
            pMaxMW={pMaxMW}
            selectedHour={selectedHour}
            onHourClick={handleHourSelect}
          />
          <ProductionProfileChart
            steps={timeSeriesProduction}
            selectedHour={selectedHour}
            loadMW={loadMW}
          />
          <EnergyBalanceChart
            steps={timeSeriesBalance}
            selectedHour={selectedHour}
            onHourClick={handleHourSelect}
          />

          {/* Summary for selected hour */}
          {selectedBalance && (
            <div
              style={{
                background: '#0F3B55',
                border: '1px solid #1565C0',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
              }}
            >
              <div style={{ fontWeight: 700, color: '#90CAF9', marginBottom: 6 }}>
                Time {selectedHour}:00 — Oversikt
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                <div>
                  <div style={{ color: '#607D8B', fontSize: 9 }}>Produksjon</div>
                  <div style={{ color: '#4FC3F7', fontWeight: 700 }}>
                    {selectedBalance.production.toFixed(2)} MW
                  </div>
                </div>
                <div>
                  <div style={{ color: '#607D8B', fontSize: 9 }}>Last</div>
                  <div style={{ color: '#FFC107', fontWeight: 700 }}>
                    {selectedBalance.load.toFixed(2)} MW
                  </div>
                </div>
                <div>
                  <div style={{ color: '#607D8B', fontSize: 9 }}>Balanse</div>
                  <div style={{ color: balanceColor, fontWeight: 700 }}>
                    {selectedBalance.balance >= 0 ? '+' : ''}
                    {selectedBalance.balance.toFixed(2)} MW
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NR Integration */}
          <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: 10 }}>
            <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 6 }}>
              Lastflyt for time {selectedHour}:00 — fordeler P_last={timeSeriesLoad[selectedHour]?.pMW.toFixed(2)} MW
              {pqCount > 0 ? ` på ${pqCount} PQ-busser` : ' (ingen PQ-busser i nettet)'}
            </div>
            <button
              onClick={handleRunNR}
              disabled={pqCount === 0}
              style={{
                background: pqCount === 0 ? '#1E3A5F' : '#2E7D32',
                border: 'none',
                borderRadius: 4,
                color: pqCount === 0 ? '#455A64' : '#E8F0FE',
                padding: '6px 14px',
                fontSize: 12,
                cursor: pqCount === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
            >
              Kjør NR-lastflyt for time {selectedHour}:00
            </button>
          </div>
        </>
      )}

      {!hasRun && (
        <div style={{ textAlign: 'center', color: '#607D8B', fontSize: 12, padding: '20px 0' }}>
          Sett P_max og cos φ, trykk Beregn for å se tidsserie-profiler.
        </div>
      )}
    </div>
  );
}
