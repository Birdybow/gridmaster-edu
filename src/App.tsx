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
  const [activeTab, setActiveTab] = useState<'powerflow' | 'compensation'>('powerflow');

  const powerFlow = useNetworkStore((s) => s.project.results.powerFlow);
  const showResults = useNetworkStore((s) => s.showResults);
  const setShowResults = useNetworkStore((s) => s.setShowResults);
  const showCompensationResults = useNetworkStore((s) => s.showCompensationResults);
  const setShowCompensationResults = useNetworkStore((s) => s.setShowCompensationResults);
  // ?? [] outside selector — see DEVLOG ARKITEKTURREGLER (commit 1f39734)
  const rawCompResults = useNetworkStore((s) => s.project.results.compensation);
  const compensationResults = rawCompResults ?? [];

  const hasPF = !!(powerFlow && showResults);
  const hasComp = compensationResults.length > 0 && showCompensationResults;
  const showBottom = hasPF || hasComp;

  // Resolve which tab to display — fall back gracefully if the active tab has no data
  const resolvedTab =
    activeTab === 'compensation' && hasComp ? 'compensation'
    : activeTab === 'powerflow' && hasPF ? 'powerflow'
    : hasComp ? 'compensation'
    : 'powerflow';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A' }}>
      <Toolbar onToggleCompensation={() => setShowCompensation((v) => !v)} />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <NetworkCanvas />

        {/* Floating compensation input panel */}
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

      {/* Tabbed bottom panel */}
      {showBottom && (
        <div>
          {/* Tab strip */}
          <div style={{ display: 'flex', borderTop: '1px solid #1565C0', background: '#0D1B2A' }}>
            {hasPF && (
              <button
                onClick={() => setActiveTab('powerflow')}
                style={{
                  background: resolvedTab === 'powerflow' ? '#0F2A45' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'powerflow' ? '2px solid #4FC3F7' : '2px solid transparent',
                  color: resolvedTab === 'powerflow' ? '#4FC3F7' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'powerflow' ? 600 : 400,
                }}
              >
                Lastflyt
              </button>
            )}
            {hasComp && (
              <button
                onClick={() => setActiveTab('compensation')}
                style={{
                  background: resolvedTab === 'compensation' ? '#0F1F30' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'compensation' ? '2px solid #CE93D8' : '2px solid transparent',
                  color: resolvedTab === 'compensation' ? '#CE93D8' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'compensation' ? 600 : 400,
                }}
              >
                Kompensering
              </button>
            )}
          </div>

          {/* Tab content */}
          {resolvedTab === 'powerflow' && hasPF && (
            <>
              <ResultPanel
                result={powerFlow!}
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
                  steps={powerFlow!.iterationLog}
                  converged={powerFlow!.converged}
                />
              )}
            </>
          )}

          {resolvedTab === 'compensation' && hasComp && (
            <CompensationResultPanel
              results={compensationResults}
              onClose={() => setShowCompensationResults(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
