import { useRef } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { saveProject, loadProject, importLegacyGmx } from '../../io/gmx.js';

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyInputRef = useRef<HTMLInputElement>(null);

  const { project, loadProject: storeLoad, clearProject, runPowerFlow, powerFlowStatus } =
    useNetworkStore();

  function handleSave() {
    saveProject(project);
  }

  async function handleLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const p = await loadProject(file);
      storeLoad(p);
    } catch (err) {
      alert(`Feil ved innlasting: ${String(err)}`);
    }
    e.target.value = '';
  }

  async function handleImportLegacy(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      const p = importLegacyGmx(raw);
      storeLoad(p);
    } catch (err) {
      alert(`Feil ved import: ${String(err)}`);
    }
    e.target.value = '';
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-b border-cyan-900"
      style={{ background: '#0D1B2A', color: '#E8F0FE' }}
    >
      {/* Logo */}
      <img
        src="/logo.png"
        alt="GridMaster Edu"
        style={{ height: 36, objectFit: 'contain' }}
      />
      <span
        className="font-bold text-lg tracking-wide"
        style={{ color: '#4FC3F7' }}
      >
        GridMaster Edu
      </span>

      <div className="flex-1" />

      {/* Project name */}
      <span className="text-sm text-gray-400 mr-2">
        {project.metadata.projectName}
      </span>

      {/* New */}
      <button
        onClick={() => { if (confirm('Nytt prosjekt? Ulagrede endringer går tapt.')) clearProject(); }}
        className="toolbar-btn"
        style={btnStyle}
      >
        Nytt
      </button>

      {/* Save */}
      <button onClick={handleSave} style={btnStyle}>
        Lagre .gmx
      </button>

      {/* Load .gmx */}
      <button onClick={() => fileInputRef.current?.click()} style={btnStyle}>
        Åpne .gmx
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".gmx,.json"
        style={{ display: 'none' }}
        onChange={handleLoad}
      />

      {/* Beregn lastflyt */}
      <button
        onClick={runPowerFlow}
        disabled={project.buses.length === 0 || powerFlowStatus === 'running'}
        style={{
          ...btnStyle,
          background: powerFlowStatus === 'converged' ? '#1A5C3A'
            : powerFlowStatus === 'failed' ? '#5C1A1A'
            : '#0D3B66',
          opacity: project.buses.length === 0 ? 0.5 : 1,
        }}
      >
        {powerFlowStatus === 'running' ? '…' : 'Beregn lastflyt'}
      </button>

      {/* Import legacy (Gemini scenario) */}
      <button
        onClick={() => legacyInputRef.current?.click()}
        style={{ ...btnStyle, background: '#1A5C3A' }}
      >
        Importer scenario
      </button>
      <input
        ref={legacyInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportLegacy}
      />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#0D3B66',
  color: '#E8F0FE',
  border: '1px solid #1565C0',
  borderRadius: 6,
  padding: '4px 12px',
  fontSize: 13,
  cursor: 'pointer',
};
