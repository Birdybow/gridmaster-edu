import { useState } from 'react';
import { version } from '../package.json';
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
import { ProductionPanel } from './components/production/ProductionPanel.js';
import { ProductionSummaryPanel } from './components/production/ProductionSummaryPanel.js';
import { VoltageDropPanel } from './components/voltagedrop/VoltageDropPanel.js';
import { VoltageDropResultPanel } from './components/voltagedrop/VoltageDropResultPanel.js';
import { ShortCircuitPanel } from './components/shortcircuit/ShortCircuitPanel.js';
import { ShortCircuitResultPanel } from './components/shortcircuit/ShortCircuitResultPanel.js';
import { RingNetworkPanel } from './components/ringnetwork/RingNetworkPanel.js';
import { RingNetworkResultPanel } from './components/ringnetwork/RingNetworkResultPanel.js';
import { RadialVsRingPanel } from './components/ringnetwork/RadialVsRingPanel.js';
import { ProtectionEditor } from './components/protection/ProtectionEditor.js';
import { ProtectionHierarchyPanel } from './components/protection/ProtectionHierarchyPanel.js';
import { SelectivityPanel } from './components/protection/SelectivityPanel.js';
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

        {/* Production panel shown below generator editor */}
        {selectedBus && isPVorSlack && <ProductionPanel />}

        {/* Line editor */}
        {isLine && <LineEditor />}

        {/* Protection editor — shown below line editor */}
        {isLine && <ProtectionEditor />}

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
  const [showProduction, setShowProduction] = useState(false);
  const [showVoltageDropFloating, setShowVoltageDropFloating] = useState(false);
  const [showShortCircuitFloating, setShowShortCircuitFloating] = useState(false);
  const [showRingNetworkFloating, setShowRingNetworkFloating] = useState(false);
  const [showProtectionFloating, setShowProtectionFloating] = useState(false);
  const [protectionHint, setProtectionHint] = useState(false);
  const [activeTab, setActiveTab] = useState<'powerflow' | 'compensation' | 'production' | 'voltagedrop' | 'shortcircuit' | 'ringnetwork' | 'protection'>('powerflow');

  const powerFlow = useNetworkStore((s) => s.project.results.powerFlow);
  const showResults = useNetworkStore((s) => s.showResults);
  const setShowResults = useNetworkStore((s) => s.setShowResults);
  const showCompensationResults = useNetworkStore((s) => s.showCompensationResults);
  const setShowCompensationResults = useNetworkStore((s) => s.setShowCompensationResults);
  const rawCompResults = useNetworkStore((s) => s.project.results.compensation);
  const compensationResults = rawCompResults ?? [];
  const generators = useNetworkStore((s) => s.project.generators);
  const showVoltageDropResults = useNetworkStore((s) => s.showVoltageDropResults);
  const setShowVoltageDropResults = useNetworkStore((s) => s.setShowVoltageDropResults);
  const rawVdResults = useNetworkStore((s) => s.project.results.voltageDrop);
  const voltageDropResults = rawVdResults ?? [];
  const showShortCircuitResults = useNetworkStore((s) => s.showShortCircuitResults);
  const setShowShortCircuitResults = useNetworkStore((s) => s.setShowShortCircuitResults);
  const rawScResults = useNetworkStore((s) => s.project.results.shortCircuit);
  const shortCircuitResults = rawScResults ?? [];

  const selectedEdgeId = useNetworkStore((s) => s.selectedEdgeId);
  const appLines = useNetworkStore((s) => s.project.lines);
  const isLineSelected = selectedEdgeId ? appLines.some((l) => l.id === selectedEdgeId) : false;

  const hasPF = !!(powerFlow && showResults);
  const hasComp = compensationResults.length > 0 && showCompensationResults;
  const hasProd = generators.length > 0 && showProduction;
  const hasVD = voltageDropResults.length > 0 && showVoltageDropResults;
  const hasSC = shortCircuitResults.length > 0 && showShortCircuitResults;
  const rawRingResult = useNetworkStore((s) => s.ringNetworkResults);
  const hasRing = rawRingResult !== null;
  const selectivityResults = useNetworkStore((s) => s.selectivityResults);
  const showProtectionResults = useNetworkStore((s) => s.showProtectionResults);
  const setShowProtectionResults = useNetworkStore((s) => s.setShowProtectionResults);
  const hasProt = selectivityResults.length > 0 && showProtectionResults;
  const showBottom = hasPF || hasComp || hasProd || hasVD || hasSC || hasRing || hasProt;

  const resolvedTab =
    activeTab === 'protection' && hasProt ? 'protection'
    : activeTab === 'ringnetwork' && hasRing ? 'ringnetwork'
    : activeTab === 'shortcircuit' && hasSC ? 'shortcircuit'
    : activeTab === 'voltagedrop' && hasVD ? 'voltagedrop'
    : activeTab === 'compensation' && hasComp ? 'compensation'
    : activeTab === 'production' && hasProd ? 'production'
    : activeTab === 'powerflow' && hasPF ? 'powerflow'
    : hasProt ? 'protection'
    : hasRing ? 'ringnetwork'
    : hasSC ? 'shortcircuit'
    : hasVD ? 'voltagedrop'
    : hasComp ? 'compensation'
    : hasProd ? 'production'
    : 'powerflow';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A', position: 'relative' }}>
      <Toolbar
        onToggleCompensation={() => setShowCompensation((v) => !v)}
        onToggleProduction={() => { setShowProduction((v) => !v); setActiveTab('production'); }}
        onToggleVoltageDrop={() => { setShowVoltageDropFloating((v) => !v); setActiveTab('voltagedrop'); }}
        onToggleShortCircuit={() => { setShowShortCircuitFloating((v) => !v); setActiveTab('shortcircuit'); }}
        onToggleRingNetwork={() => { setShowRingNetworkFloating((v) => !v); setActiveTab('ringnetwork'); }}
        onToggleProtection={() => {
          if (!isLineSelected) {
            setProtectionHint(true);
            setTimeout(() => setProtectionHint(false), 3500);
          }
          setShowProtectionFloating((v) => !v);
          setActiveTab('protection');
        }}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
        {/* Left: Component panel */}
        <ComponentPanel />

        {/* Center: Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <NetworkCanvas />

          {/* Floating voltage drop panel */}
          {showVoltageDropFloating && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: showCompensation ? 404 : 12,
                width: 340,
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                zIndex: 40,
                borderRadius: 8,
                boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
              }}
            >
              <VoltageDropPanel onClose={() => setShowVoltageDropFloating(false)} />
            </div>
          )}

          {/* Floating short-circuit panel */}
          {showShortCircuitFloating && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: showCompensation ? 804 : showVoltageDropFloating ? 404 : 12,
                width: 320,
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                zIndex: 41,
                borderRadius: 8,
                boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
              }}
            >
              <ShortCircuitPanel onClose={() => setShowShortCircuitFloating(false)} />
            </div>
          )}

          {/* Floating ring network panel */}
          {showRingNetworkFloating && (
            <RingNetworkPanel onClose={() => setShowRingNetworkFloating(false)} />
          )}

          {/* Floating protection hierarchy panel */}
          {showProtectionFloating && (
            <ProtectionHierarchyPanel onClose={() => setShowProtectionFloating(false)} />
          )}

          {/* Protection placement hint toast */}
          {protectionHint && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: '#1A1500', border: '1px solid #F9A825', borderRadius: 8,
              padding: '10px 20px', color: '#F9A825', fontSize: 13, fontWeight: 600,
              zIndex: 60, pointerEvents: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}>
              🛡 Klikk på en linje i nettet for å plassere et vern
            </div>
          )}

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
            {hasProd && (
              <button
                onClick={() => setActiveTab('production')}
                style={{
                  background: resolvedTab === 'production' ? '#0F1F30' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'production' ? '2px solid #66BB6A' : '2px solid transparent',
                  color: resolvedTab === 'production' ? '#66BB6A' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'production' ? 600 : 400,
                }}
              >
                ⚡ Produksjon
              </button>
            )}
            {hasVD && (
              <button
                onClick={() => setActiveTab('voltagedrop')}
                style={{
                  background: resolvedTab === 'voltagedrop' ? '#0F1F30' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'voltagedrop' ? '2px solid #8BC34A' : '2px solid transparent',
                  color: resolvedTab === 'voltagedrop' ? '#8BC34A' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'voltagedrop' ? 600 : 400,
                }}
              >
                ΔU Spenningsfall
              </button>
            )}
            {hasSC && (
              <button
                onClick={() => setActiveTab('shortcircuit')}
                style={{
                  background: resolvedTab === 'shortcircuit' ? '#1A0000' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'shortcircuit' ? '2px solid #EF5350' : '2px solid transparent',
                  color: resolvedTab === 'shortcircuit' ? '#EF5350' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'shortcircuit' ? 600 : 400,
                }}
              >
                ⚡ Kortslutning
              </button>
            )}
            {hasRing && (
              <button
                onClick={() => setActiveTab('ringnetwork')}
                style={{
                  background: resolvedTab === 'ringnetwork' ? '#001A00' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'ringnetwork' ? '2px solid #4CAF50' : '2px solid transparent',
                  color: resolvedTab === 'ringnetwork' ? '#4CAF50' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'ringnetwork' ? 600 : 400,
                }}
              >
                ⭕ Ringnett
              </button>
            )}
            {hasProt && (
              <button
                onClick={() => setActiveTab('protection')}
                style={{
                  background: resolvedTab === 'protection' ? '#1A1A00' : 'none',
                  border: 'none',
                  borderRight: '1px solid #1565C0',
                  borderBottom: resolvedTab === 'protection' ? '2px solid #F9A825' : '2px solid transparent',
                  color: resolvedTab === 'protection' ? '#F9A825' : '#607D8B',
                  cursor: 'pointer',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: resolvedTab === 'protection' ? 600 : 400,
                }}
              >
                🛡 Vernkoordinering
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
          {resolvedTab === 'production' && hasProd && (
            <ProductionSummaryPanel onClose={() => setShowProduction(false)} />
          )}
          {resolvedTab === 'voltagedrop' && hasVD && (
            <VoltageDropResultPanel
              results={voltageDropResults}
              onClose={() => setShowVoltageDropResults(false)}
            />
          )}
          {resolvedTab === 'shortcircuit' && hasSC && (
            <ShortCircuitResultPanel
              results={shortCircuitResults}
              onClose={() => setShowShortCircuitResults(false)}
            />
          )}
          {resolvedTab === 'ringnetwork' && hasRing && (
            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1B5E20' }}>
              <RingNetworkResultPanel />
              <div style={{ width: 1, background: '#1B5E20' }} />
              <RadialVsRingPanel />
            </div>
          )}
          {resolvedTab === 'protection' && hasProt && (
            <SelectivityPanel onClose={() => setShowProtectionResults(false)} />
          )}
        </div>
      )}

      {/* Copyright + version badge */}
      <div className="fixed bottom-2 left-2 z-50 text-xs text-gray-500 opacity-40 select-none pointer-events-none leading-relaxed">
        <div>© 2026 Bård Reinton-Kjellhov</div>
        <div>v{version}</div>
      </div>
    </div>
  );
}
