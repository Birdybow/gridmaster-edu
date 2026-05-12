import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { generateReport } from '../../report/generateReport.js';
import type { ReportSections } from '../../report/generateReport.js';
import { HelpIcon } from '../common/HelpIcon.js';

interface ReportPanelProps {
  onClose: () => void;
}

const DEFAULT_SECTIONS: ReportSections = {
  singleLine: true,
  yBus: true,
  loadFlow: true,
  compensation: true,
  shortCircuit: true,
  ringNetwork: true,
  protection: true,
  timeSeries: true,
};

const SECTION_LABELS: Array<[keyof ReportSections, string]> = [
  ['singleLine', 'Enlinjeskjema'],
  ['yBus', 'Y-bussmatrise'],
  ['loadFlow', 'Lastflyt + spenningsfall'],
  ['compensation', 'Fasekompensering'],
  ['shortCircuit', 'Kortslutning'],
  ['ringNetwork', 'Ringnett'],
  ['protection', 'Vernkoordinering'],
  ['timeSeries', 'Tidsserie 24t'],
];

export function ReportPanel({ onClose }: ReportPanelProps) {
  const project = useNetworkStore((s) => s.project);
  const selectivityResults = useNetworkStore((s) => s.selectivityResults);

  const [sections, setSections] = useState<ReportSections>({ ...DEFAULT_SECTIONS });
  const [studentName, setStudentName] = useState(project.metadata.student ?? '');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  function toggleSection(key: keyof ReportSections) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    setGenerating(true);
    setDone(false);
    try {
      const canvasEl = document.querySelector<HTMLElement>('.react-flow__viewport');
      const opts = {
        projectName: project.metadata.projectName,
        studentName,
        date: new Date().toLocaleDateString('nb-NO'),
        sections,
        selectivityResults,
      };
      await generateReport(project, opts, canvasEl?.parentElement ?? null);
      setDone(true);
    } catch (err) {
      alert(`PDF-generering feilet: ${String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{
      background: '#0F1F30',
      border: '1px solid #1E3A5F',
      borderRadius: 8,
      padding: '16px 20px',
      width: 320,
      color: '#E8F0FE',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, color: '#4FC3F7', fontSize: 13 }}>📄 Generer PDF-rapport</span>
          <HelpIcon title="PDF-rapport" text={"A4-format, jsPDF+html2canvas\nVelg seksjoner, sett studentnavn\nKlar til innlevering"} />
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 15 }}>✕</button>
      </div>

      {/* Studentnavn */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', marginBottom: 4 }}>Studentnavn</div>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Skriv inn studentnavn..."
          style={{
            width: '100%', background: '#1A2A3A', border: '1px solid #374151',
            borderRadius: 4, color: '#E8F0FE', padding: '6px 10px',
            fontSize: 12, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Seksjoner */}
      <div style={{ fontSize: 11, color: '#9E9E9E', marginBottom: 6 }}>Inkluder seksjoner</div>
      <div style={{ marginBottom: 14 }}>
        {SECTION_LABELS.map(([key, label]) => (
          <label
            key={key}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '3px 0', cursor: 'pointer', fontSize: 12,
              color: sections[key] ? '#E8F0FE' : '#607D8B',
            }}
          >
            <input
              type="checkbox"
              checked={sections[key]}
              onChange={() => toggleSection(key)}
              style={{ accentColor: '#4FC3F7' }}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Prosjektinfo */}
      <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 12, padding: '6px 8px', background: '#1A2A3A', borderRadius: 4 }}>
        <div>{project.metadata.projectName}</div>
        <div>{project.buses.length} busser · {project.lines.length} linjer · {project.transformers.length} trafos</div>
      </div>

      {done && (
        <div style={{ color: '#81C784', fontSize: 12, marginBottom: 8 }}>
          ✓ PDF lastet ned!
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          width: '100%',
          background: generating ? '#1A2A3A' : '#1F4E79',
          color: generating ? '#607D8B' : '#E8F0FE',
          border: '1px solid #1565C0',
          borderRadius: 5, padding: '8px 0',
          fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer',
        }}
      >
        {generating ? 'Genererer PDF...' : '⬇ Last ned rapport'}
      </button>
    </div>
  );
}
