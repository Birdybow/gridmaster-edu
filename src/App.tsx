import { useState } from 'react';
import { Toolbar } from './components/toolbar/Toolbar.js';
import { NetworkCanvas } from './components/canvas/NetworkCanvas.js';
import { ResultPanel } from './components/results/ResultPanel.js';
import { IterationPanel } from './components/results/IterationPanel.js';
import { CompensationPanel } from './components/compensation/CompensationPanel.js';
import { CompensationResultPanel } from './components/compensation/CompensationResultPanel.js';
import { useNetworkStore } from './store/useNetworkStore.js';

export default function App() {
  const [showIterations, setShowIterations] = useState(false);
  const [showCompensation, setShowCompensation] = useState(false);

  const powerFlow = useNetworkStore((s) => s.project.results.powerFlow);
  const showResults = useNetworkStore((s) => s.showResults);
  const setShowResults = useNetworkStore((s) => s.setShowResults);
  // ?? [] outside selector — see DEVLOG ARKITEKTURREGLER (commit 1f39734)
  const rawCompResults = useNetworkStore((s) => s.project.results.compensation);
  const compensationResults = rawCompResults ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A' }}>
      <Toolbar onToggleCompensation={() => setShowCompensation((v) => !v)} />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <NetworkCanvas />

        {/* Floating compensation panel */}
        {showCompensation && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 380,
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              zIndex: 40,
              borderRadius: 8,
              boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
            }}
          >
            <CompensationPanel onClose={() => setShowCompensation(false)} />
          </div>
        )}
      </div>

      {powerFlow && showResults && (
        <>
          <ResultPanel
            result={powerFlow}
            onClose={() => setShowResults(false)}
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

      {compensationResults.length > 0 && (
        <CompensationResultPanel results={compensationResults} />
      )}
    </div>
  );
}
