import { useRef, useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { saveProject, loadProject, importLegacyGmx, saveToCloud, loadFromCloud, listCloudProjects } from '../../io/gmx.js';
import type { CloudProjectSummary } from '../../types/index.js';

interface ToolbarProps {
  onToggleCompensation?: () => void;
  onToggleProduction?: () => void;
  onToggleVoltageDrop?: () => void;
  onToggleShortCircuit?: () => void;
  onToggleRingNetwork?: () => void;
  onToggleProtection?: () => void;
}

type CloudSaveState = 'idle' | 'input' | 'saving' | 'done' | 'error';
type CloudLoadState = 'idle' | 'loading' | 'list' | 'error';

export function Toolbar({ onToggleCompensation, onToggleProduction, onToggleVoltageDrop, onToggleShortCircuit, onToggleRingNetwork, onToggleProtection }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legacyInputRef = useRef<HTMLInputElement>(null);

  const { project, loadProject: storeLoad, clearProject, runPowerFlow, powerFlowStatus } =
    useNetworkStore();
  const validationResult = useNetworkStore((s) => s.validationResult);

  // Cloud save state
  const [cloudSaveState, setCloudSaveState] = useState<CloudSaveState>('idle');
  const [cloudStudentName, setCloudStudentName] = useState(project.metadata.student ?? '');
  const [savedCloudId, setSavedCloudId] = useState('');
  const [cloudSaveError, setCloudSaveError] = useState('');

  // Cloud load state
  const [cloudLoadState, setCloudLoadState] = useState<CloudLoadState>('idle');
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [cloudLoadError, setCloudLoadError] = useState('');

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

  async function handleCloudSave() {
    setCloudSaveState('saving');
    setCloudSaveError('');
    const patched = {
      ...project,
      metadata: { ...project.metadata, student: cloudStudentName },
    };
    try {
      const id = await saveToCloud(patched);
      setSavedCloudId(id);
      setCloudSaveState('done');
    } catch (err) {
      setCloudSaveError(String(err));
      setCloudSaveState('error');
    }
  }

  async function handleOpenCloudList() {
    setCloudLoadState('loading');
    setCloudLoadError('');
    try {
      const list = await listCloudProjects();
      setCloudProjects(list);
      setCloudLoadState('list');
    } catch (err) {
      setCloudLoadError(String(err));
      setCloudLoadState('error');
    }
  }

  async function handleLoadCloudProject(id: string) {
    try {
      const p = await loadFromCloud(id);
      storeLoad(p);
      setCloudLoadState('idle');
    } catch (err) {
      alert(`Feil ved lasting: ${String(err)}`);
    }
  }

  return (
    <>
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
          style={{ ...btnBase, backgroundColor: '#0D3B66', color: '#E8F0FE', border: '1px solid #1565C0' }}
        >
          Nytt
        </button>

        {/* Save local */}
        <button
          onClick={handleSave}
          style={{ ...btnBase, backgroundColor: '#0D3B66', color: '#E8F0FE', border: '1px solid #1565C0' }}
        >
          Lagre .gmx
        </button>

        {/* Load local */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ ...btnBase, backgroundColor: '#0D3B66', color: '#E8F0FE', border: '1px solid #1565C0' }}
        >
          Åpne .gmx
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gmx,.json"
          style={{ display: 'none' }}
          onChange={handleLoad}
        />

        {/* Save to cloud */}
        <button
          onClick={() => {
            setCloudStudentName(project.metadata.student ?? '');
            setCloudSaveState('input');
            setCloudSaveError('');
          }}
          style={{ ...btnBase, backgroundColor: '#0A3B5C', color: '#E8F0FE', border: '1px solid #1E88E5' }}
        >
          ☁ Lagre til sky
        </button>

        {/* Open from cloud */}
        <button
          onClick={handleOpenCloudList}
          style={{ ...btnBase, backgroundColor: '#0A3B5C', color: '#E8F0FE', border: '1px solid #1E88E5' }}
        >
          ☁ Åpne fra sky
        </button>

        {/* Beregn lastflyt */}
        <button
          onClick={runPowerFlow}
          disabled={project.buses.length === 0 || powerFlowStatus === 'running'}
          title={validationResult && !validationResult.valid ? `${validationResult.errors.length} valideringsfeil` : undefined}
          style={{
            ...btnBase,
            backgroundColor: validationResult && !validationResult.valid ? '#5C1A1A'
              : powerFlowStatus === 'converged' ? '#1A5C3A'
              : powerFlowStatus === 'failed' ? '#5C1A1A'
              : '#0D3B66',
            color: '#E8F0FE',
            border: validationResult && !validationResult.valid ? '1px solid #EF4444' : '1px solid #1565C0',
            opacity: project.buses.length === 0 ? 0.5 : 1,
          }}
        >
          {powerFlowStatus === 'running' ? '…'
            : validationResult && !validationResult.valid ? `✗ ${validationResult.errors.length} feil`
            : 'Lastflyt'}
        </button>

        {/* Fasekompensering */}
        <button
          onClick={onToggleCompensation}
          disabled={project.buses.length === 0}
          style={{
            ...btnBase,
            backgroundColor: '#3A1A5C',
            color: '#E8F0FE',
            border: '1px solid #9C27B0',
            opacity: project.buses.length === 0 ? 0.5 : 1,
          }}
        >
          Kompensering
        </button>

        {/* Produksjon */}
        <button
          onClick={onToggleProduction}
          disabled={project.generators.length === 0}
          style={{
            ...btnBase,
            backgroundColor: '#0F3B1E',
            color: '#E8F0FE',
            border: '1px solid #2E7D32',
            opacity: project.generators.length === 0 ? 0.5 : 1,
          }}
        >
          ⚡ Produksjon
        </button>

        {/* Spenningsfall */}
        <button
          onClick={onToggleVoltageDrop}
          disabled={project.lines.length === 0}
          style={{
            ...btnBase,
            backgroundColor: '#1A2B0F',
            color: '#E8F0FE',
            border: '1px solid #558B2F',
            opacity: project.lines.length === 0 ? 0.5 : 1,
          }}
        >
          ΔU Spenning
        </button>

        {/* Kortslutning */}
        <button
          onClick={onToggleShortCircuit}
          disabled={project.buses.length < 2}
          style={{
            ...btnBase,
            backgroundColor: '#1A0000',
            color: '#EF9A9A',
            border: '1px solid #B71C1C',
            opacity: project.buses.length < 2 ? 0.5 : 1,
          }}
        >
          ⚡ Kortslutning
        </button>

        {/* Ringnett */}
        <button
          onClick={onToggleRingNetwork}
          disabled={project.buses.length < 3}
          style={{
            ...btnBase,
            backgroundColor: '#001A00',
            color: '#A5D6A7',
            border: '1px solid #1B5E20',
            opacity: project.buses.length < 3 ? 0.5 : 1,
          }}
        >
          ⭕ Ringnett
        </button>

        {/* Vernkoordinering */}
        <button
          onClick={onToggleProtection}
          disabled={project.lines.length === 0}
          title="Klikk på en linje for å legge til vern"
          style={{
            ...btnBase,
            backgroundColor: '#1A1A0F',
            color: '#F9A825',
            border: '1px solid #827717',
            opacity: project.lines.length === 0 ? 0.5 : 1,
          }}
        >
          🛡 Vern
        </button>

        {/* Import legacy (Gemini scenario) */}
        <button
          onClick={() => legacyInputRef.current?.click()}
          style={{ ...btnBase, backgroundColor: '#1A5C3A', color: '#E8F0FE', border: '1px solid #0D3B22' }}
        >
          Importer
        </button>
        <input
          ref={legacyInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportLegacy}
        />
      </div>

      {/* Cloud save dialog */}
      {cloudSaveState !== 'idle' && (
        <div style={overlayStyle}>
          <div style={dialogStyle}>
            <div style={{ fontWeight: 700, color: '#4FC3F7', marginBottom: 14, fontSize: 14 }}>
              ☁ Lagre til sky
            </div>

            {(cloudSaveState === 'input' || cloudSaveState === 'saving') && (
              <>
                <div style={{ color: '#9E9E9E', fontSize: 12, marginBottom: 4 }}>Studentnavn</div>
                <input
                  autoFocus
                  value={cloudStudentName}
                  onChange={(e) => setCloudStudentName(e.target.value)}
                  placeholder="Skriv inn studentnavn..."
                  style={inputStyle}
                />
                <div style={{ color: '#607D8B', fontSize: 11, marginBottom: 14 }}>
                  Prosjekt: {project.metadata.projectName}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleCloudSave}
                    disabled={cloudSaveState === 'saving' || !cloudStudentName.trim()}
                    style={{
                      ...dialogBtnStyle,
                      background: cloudStudentName.trim() ? '#1565C0' : '#1A2A3A',
                      opacity: cloudSaveState === 'saving' ? 0.7 : 1,
                    }}
                  >
                    {cloudSaveState === 'saving' ? 'Lagrer...' : 'Lagre'}
                  </button>
                  <button
                    onClick={() => setCloudSaveState('idle')}
                    style={{ ...dialogBtnStyle, background: '#2A2A2A' }}
                  >
                    Avbryt
                  </button>
                </div>
              </>
            )}

            {cloudSaveState === 'done' && (
              <>
                <div style={{ color: '#81C784', fontSize: 13, marginBottom: 8 }}>
                  ✓ Prosjekt lagret!
                </div>
                <div style={{ color: '#607D8B', fontSize: 11, marginBottom: 4 }}>Prosjekt-ID:</div>
                <div style={{ color: '#CE93D8', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', marginBottom: 14 }}>
                  {savedCloudId}
                </div>
                <button onClick={() => setCloudSaveState('idle')} style={{ ...dialogBtnStyle, background: '#1A5C3A' }}>
                  Lukk
                </button>
              </>
            )}

            {cloudSaveState === 'error' && (
              <>
                <div style={{ color: '#EF9A9A', fontSize: 12, marginBottom: 14 }}>{cloudSaveError}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setCloudSaveState('input')} style={{ ...dialogBtnStyle, background: '#1565C0' }}>
                    Prøv igjen
                  </button>
                  <button onClick={() => setCloudSaveState('idle')} style={{ ...dialogBtnStyle, background: '#2A2A2A' }}>
                    Avbryt
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cloud load dialog */}
      {cloudLoadState !== 'idle' && (
        <div style={overlayStyle}>
          <div style={{ ...dialogStyle, width: 480, maxHeight: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#4FC3F7', fontSize: 14 }}>
                ☁ Åpne fra sky
              </div>
              <button
                onClick={() => setCloudLoadState('idle')}
                style={{ background: 'none', border: 'none', color: '#757575', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {cloudLoadState === 'loading' && (
              <div style={{ color: '#9E9E9E', fontSize: 12 }}>Henter prosjekter...</div>
            )}

            {cloudLoadState === 'error' && (
              <>
                <div style={{ color: '#EF9A9A', fontSize: 12, marginBottom: 12 }}>{cloudLoadError}</div>
                <button onClick={handleOpenCloudList} style={{ ...dialogBtnStyle, background: '#1565C0' }}>
                  Prøv igjen
                </button>
              </>
            )}

            {cloudLoadState === 'list' && cloudProjects.length === 0 && (
              <div style={{ color: '#607D8B', fontSize: 12 }}>Ingen prosjekter lagret i skyen ennå.</div>
            )}

            {cloudLoadState === 'list' && cloudProjects.length > 0 && (
              <div style={{ overflowY: 'auto', maxHeight: 340 }}>
                {cloudProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleLoadCloudProject(p.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 5,
                      marginBottom: 4,
                      cursor: 'pointer',
                      background: '#1A2A3A',
                      border: '1px solid #1E3A5F',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0F2A45')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#1A2A3A')}
                  >
                    <div>
                      <div style={{ color: '#E8F0FE', fontWeight: 600, fontSize: 12 }}>{p.projectName}</div>
                      <div style={{ color: '#9E9E9E', fontSize: 11 }}>{p.studentName} · {p.course}</div>
                    </div>
                    <div style={{ color: '#607D8B', fontSize: 10, textAlign: 'right' }}>
                      {new Date(p.updatedAt).toLocaleString('nb-NO')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const btnBase: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  borderRadius: '4px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const dialogStyle: React.CSSProperties = {
  background: '#0F1F30',
  border: '1px solid #1E3A5F',
  borderRadius: 8,
  padding: '20px 24px',
  width: 360,
  boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
  color: '#E8F0FE',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1A2A3A',
  border: '1px solid #374151',
  borderRadius: 4,
  color: '#E8F0FE',
  padding: '6px 10px',
  fontSize: 13,
  marginBottom: 10,
  boxSizing: 'border-box',
};

const dialogBtnStyle: React.CSSProperties = {
  color: '#E8F0FE',
  border: 'none',
  borderRadius: 5,
  padding: '6px 16px',
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 600,
};
