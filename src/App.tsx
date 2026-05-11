import { useState } from 'react';
import { Toolbar } from './components/toolbar/Toolbar.js';
import { NetworkCanvas } from './components/canvas/NetworkCanvas.js';
import { ResultPanel } from './components/results/ResultPanel.js';
import { IterationPanel } from './components/results/IterationPanel.js';
import { useNetworkStore } from './store/useNetworkStore.js';

export default function App() {
  const [showIterations, setShowIterations] = useState(false);
  const powerFlow = useNetworkStore((s) => s.project.results.powerFlow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A' }}>
      <Toolbar />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <NetworkCanvas />
      </div>
      {powerFlow && (
        <>
          <ResultPanel
            result={powerFlow}
            onClose={() => {/* cleared by new calculation */}}
          />
          <div style={{ borderTop: '1px solid #1565C0' }}>
            <button
              onClick={() => setShowIterations((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4FC3F7',
                cursor: 'pointer',
                padding: '4px 12px',
                fontSize: 12,
              }}
            >
              {showIterations ? '▲ Skjul iterasjonslogg' : '▼ Vis iterasjonslogg'}
            </button>
          </div>
          {showIterations && (
            <IterationPanel
              steps={powerFlow.iterationLog}
              converged={powerFlow.converged}
            />
          )}
        </>
      )}
    </div>
  );
}
