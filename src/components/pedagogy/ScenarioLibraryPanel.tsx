import { ALL_SCENARIOS } from '../../data/scenarios.js';
import type { ScenarioMeta } from '../../data/scenarios.js';
import { useNetworkStore } from '../../store/useNetworkStore.js';

interface Props {
  onClose: () => void;
}

const DIFF_COLOR: Record<string, string> = {
  'Grunnleggende': '#4CAF50',
  'Middels': '#FFC107',
  'Avansert': '#EF5350',
};

function ScenarioCard({ s, onLoad }: { s: ScenarioMeta; onLoad: (s: ScenarioMeta) => void }) {
  return (
    <div
      style={{
        background: '#0D2137',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#E8F0FE' }}>
          {s.icon} {s.name}
        </div>
        <span
          style={{
            fontSize: 10,
            color: DIFF_COLOR[s.difficulty] ?? '#607D8B',
            background: `${DIFF_COLOR[s.difficulty]}22`,
            border: `1px solid ${DIFF_COLOR[s.difficulty]}44`,
            borderRadius: 3,
            padding: '1px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          {s.difficulty}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#90A4AE', marginBottom: 10, lineHeight: 1.5 }}>{s.description}</div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#607D8B', fontWeight: 700, marginBottom: 4 }}>LÆRINGSMÅL</div>
        {s.goals.map((g, i) => (
          <div key={i} style={{ fontSize: 11, color: '#B0BEC5', display: 'flex', gap: 6, marginBottom: 2 }}>
            <span style={{ color: '#4FC3F7' }}>→</span> {g}
          </div>
        ))}
      </div>

      <div style={{ background: '#0A1929', borderRadius: 4, padding: '6px 10px', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 2 }}>FORVENTET RESULTAT</div>
        <div style={{ fontSize: 11, color: '#80CBC4', lineHeight: 1.5 }}>{s.expectedResult}</div>
      </div>

      <button
        onClick={() => onLoad(s)}
        style={{
          background: '#1565C0',
          border: 'none',
          borderRadius: 4,
          color: '#E8F0FE',
          padding: '6px 16px',
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 600,
          width: '100%',
        }}
      >
        Last inn scenario
      </button>
    </div>
  );
}

export function ScenarioLibraryPanel({ onClose }: Props) {
  const loadProject = useNetworkStore((s) => s.loadProject);

  function handleLoad(s: ScenarioMeta) {
    loadProject(s.project);
    onClose();
  }

  return (
    <div
      style={{
        background: '#0A1929',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        width: 500,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #1E3A5F', background: '#0D2137' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#90CAF9' }}>📚 Scenariobibliotek — {ALL_SCENARIOS.length} scenarioer</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#607D8B', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ALL_SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} s={s} onLoad={handleLoad} />
        ))}
      </div>
    </div>
  );
}
