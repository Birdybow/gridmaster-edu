import { useState } from 'react';
import { Toolbar } from './components/toolbar/Toolbar.js';
import { NetworkCanvas } from './components/canvas/NetworkCanvas.js';
import { ResultPanel } from './components/results/ResultPanel.js';
import { IterationPanel } from './components/results/IterationPanel.js';
import { CompensationPanel } from './components/compensation/CompensationPanel.js';
import { CompensationResultPanel } from './components/compensation/CompensationResultPanel.js';
import { ComponentPanel } from './components/builder/ComponentPanel.js';
import { ValidationPanel } from './components/builder/ValidationPanel.js';
import { BusEditor } from './components/editors/BusEditor.js';
import { LineEditor } from './components/editors/LineEditor.js';
import { TransformerEditor } from './components/editors/TransformerEditor.js';
import { GeneratorEditor } from './components/editors/GeneratorEditor.js';
import { CompensatorEditor } from './components/editors/CompensatorEditor.js';
import { useNetworkStore } from './store/useNetworkStore.js';

function EditorPanel() {
  const selectedNodeId = useNetworkStore((s) => s.selectedNodeId);
  const selectedEdgeId = useNetworkStore((s) => s.selectedEdgeId);
  const lines = useNetworkStore((s) => s.project.lines);
  const transformers = useNetworkStore((s) => s.project.transformers);
  const buses = useNetworkStore((s) => s.project.buses);
  const setSelectedNodeId = useNetworkStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useNetworkStore((s) => s.setSelectedEdgeId);

  const isLine = selectedEdgeId ? lines.some((l) => l.id === selectedEdgeId) : false;
  const isTransformer = selectedEdgeId ? transformers.some((t) => t.id === selectedEdgeId) : false;
  const isCompNode = selectedNodeId?.startsWith('comp_') ?? false;
  const selectedBus = selectedNodeId && !isCompNode ? buses.find((b) => b.id === selectedNodeId) : null;
  const isPVorSlack = selectedBus ? (selectedBus.type === 'PV' || selectedBus.type === 'slack') : false;

  const hasContent =
    (selectedNodeId && !isCompNode && selectedBus) ||
    (selectedNodeId && isCompNode) ||
    (selectedEdgeId && (isLine || isTransformer));

  if (!hasContent) return null;

  function renderTitle() {
    if (isLine) return 'Linje';
    if (isTransformer) return 'Transformator';
    if (isCompNode) return 'Kondensator';
    if (selectedBus) return `Buss: ${selectedBus.name}`;
    return '';
  }

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: '#0D1B2A',
        borderLeft: '1px solid #1E3A5F',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          borderBottom: '1px solid #1E3A5F',
          background: '#0F1F2E',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4FC3F7' }}>
          {renderTitle()}
        </span>
        <button
          onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Bus editor */}
        {selectedBus && !isCompNode && <BusEditor />}

        {/* Generator editor shown below bus editor for PV/slack */}
        {selectedBus && isPVorSlack && <GeneratorEditor />}

        {/* Line editor */}
        {isLine && <LineEditor />}

        {/* Transformer editor */}
        {isTransformer && <TransformerEditor />}

        {/* Compensator editor */}
        {isCompNode && <CompensatorEditor />}
      </div>
    </div>
  );
}

export default function App() {
  const [showIterations, setShowIterations] = useState(false);
  const [showCompensation, setShowCompensation] = useState(false);
  const [activeTab, setActiveTab] = useState<'powerflow' | 'compensation'>('powerflow');

  const powerFlow = useNetworkStore((s) => s.project.results.powerFlow);
  const showResults = useNetworkStore((s) => s.showResults);
  const setShowResults = useNetworkStore((s) => s.setShowResults);
  const showCompensationResults = useNetworkStore((s) => s.showCompensationResults);
  const setShowCompensationResults = useNetworkStore((s) => s.setShowCompensationResults);
  const rawCompResults = useNetworkStore((s) => s.project.results.compensation);
  const compensationResults = rawCompResults ?? [];

  const hasPF = !!(powerFlow && showResults);
  const hasComp = compensationResults.length > 0 && showCompensationResults;
  const showBottom = hasPF || hasComp;

  const resolvedTab =
    activeTab === 'compensation' && hasComp ? 'compensation'
    : activeTab === 'powerflow' && hasPF ? 'powerflow'
    : hasComp ? 'compensation'
    : 'powerflow';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A' }}>
      <Toolbar onToggleCompensation={() => setShowCompensation((v) => !v)} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
        {/* Left: Component panel */}
        <ComponentPanel />

        {/* Center: Canvas */}
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

        {/* Right: Editor panel */}
        <EditorPanel />
      </div>

      {/* Validation panel */}
      <ValidationPanel />

      {/* Tabbed bottom panel */}
      {showBottom && (
        <div>
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

          {resolvedTab === 'powerflow' && hasPF && (
            <>
              <ResultPanel result={powerFlow!} onClose={() => setShowResults(false)} />
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
                <IterationPanel steps={powerFlow!.iterationLog} converged={powerFlow!.converged} />
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
