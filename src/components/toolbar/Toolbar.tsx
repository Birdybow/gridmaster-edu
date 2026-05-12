import { useRef, useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { saveProject, loadProject, importLegacyGmx, saveToCloud, loadFromCloud, listCloudProjects } from '../../io/gmx.js';
import type { CloudProjectSummary } from '../../types/index.js';
import { migrateProject } from '../../io/migration.js';

interface ToolbarProps {
  onToggleReport?: () => void;
  onToggleExport?: () => void;
  onTogglePerUnit?: () => void;
  onToggleWarnings?: () => void;
  onToggleHelp?: () => void;
  onRestartTour?: () => void;
  onToggleCompensation?: () => void;
  onToggleProduction?: () => void;
  onToggleVoltageDrop?: () => void;
  onToggleShortCircuit?: () => void;
  onToggleRingNetwork?: () => void;
  onToggleProtection?: () => void;
  onToggleEarthFault?: () => void;
  onToggleNeutralTreatment?: () => void;
  onToggleProductionDashboard?: () => void;
  onToggleTimeSeries?: () => void;
  onToggleFormulaSheet?: () => void;
  onToggleScenarioLibrary?: () => void;
  onToggleGlossary?: () => void;
  onToggleLearningObjectives?: () => void;
}

type MigrationBanner = { fromVersion: string; toVersion: string } | null;
type CloudSaveState = 'idle' | 'input' | 'saving' | 'done' | 'error';
type CloudLoadState = 'idle' | 'loading' | 'list' | 'error';

export function Toolbar({ onToggleCompensation, onToggleProduction, onToggleVoltageDrop, onToggleShortCircuit, onToggleRingNetwork, onToggleProtection, onToggleEarthFault, onToggleNeutralTreatment, onToggleProductionDashboard, onToggleTimeSeries, onToggleFormulaSheet, onToggleScenarioLibrary, onToggleGlossary, onToggleLearningObjectives, onToggleReport, onToggleExport, onTogglePerUnit, onToggleWarnings, onToggleHelp, onRestartTour }: ToolbarProps) {
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

  // Migration banner
  const [migrationBanner, setMigrationBanner] = useState<MigrationBanner>(null);

  function handleSave() {
    saveProject(project);
  }

  async function handleLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await loadProject(file);
      storeLoad(result.project);
      if (result.migrated) {
        setMigrationBanner({ fromVersion: result.fromVersion, toVersion: result.toVersion });
        setTimeout(() => setMigrationBanner(null), 8000);
      }
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
      const migResult = migrateProject(p);
      storeLoad(migResult.project);
      if (migResult.migrated) {
        setMigrationBanner({ fromVersion: migResult.fromVersion, toVersion: migResult.toVersion });
        setTimeout(() => setMigrationBanner(null), 8000);
      }
      setCloudLoadState('idle');
    } catch (err) {
      alert(`Feil ved lasting: ${String(err)}`);
    }
  }

  return (
    <>
      {/* Migrasjonsbanner */}
      {migrationBanner && (
        <div style={{
          background: '#1A2800', border: '1px solid #689F38', borderRadius: 0,
          padding: '7px 20px', fontSize: 12, color: '#CCFF90',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 200,
        }}>
          <span>
            🔄 Prosjektet ble migrert fra v{migrationBanner.fromVersion} til v{migrationBanner.toVersion}.
            Lagre på nytt for å beholde endringene.
          </span>
          <button
            onClick={() => setMigrationBanner(null)}
            style={{ background: 'none', border: 'none', color: '#8BC34A', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ background: '#0D1B2A', borderBottom: '1px solid #0E3A5F' }}>
        {/* Rad 1: Fil og prosjekt */}
        <div data-tour="toolbar-row1" className="flex items-center gap-2 px-4" style={{ color: '#E8F0FE', height: 46 }}>
          <img src="/logo.png" alt="GridMaster Edu" style={{ height: 30, objectFit: 'contain' }} />
          <span className="font-bold tracking-wide" style={{ color: '#4FC3F7', fontSize: 14, whiteSpace: 'nowrap' }}>
            GridMaster Edu
          </span>

          <div className="flex-1" />

          <span style={{ fontSize: 12, color: '#607D8B', whiteSpace: 'nowrap' }}>
            {project.metadata.projectName}
          </span>

          <button
            onClick={() => { if (confirm('Nytt prosjekt? Ulagrede endringer går tapt.')) clearProject(); }}
            style={btnStyle}
          >
            Nytt
          </button>

          <button onClick={handleSave} style={btnStyle}>
            Lagre .gmx
          </button>

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

          <button
            onClick={() => {
              setCloudStudentName(project.metadata.student ?? '');
              setCloudSaveState('input');
              setCloudSaveError('');
            }}
            style={{ ...btnStyle, background: '#0A3B5C', border: '1px solid #1E88E5' }}
          >
            ☁ Lagre til sky
          </button>

          <button
            onClick={handleOpenCloudList}
            style={{ ...btnStyle, background: '#0A3B5C', border: '1px solid #1E88E5' }}
          >
            ☁ Åpne fra sky
          </button>

          <button
            onClick={() => legacyInputRef.current?.click()}
            style={{ ...btnStyle, background: '#1A5C3A' }}
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

          <div style={{ width: 1, height: 20, background: '#1E3A5F', margin: '0 4px' }} />

          <button onClick={onToggleWarnings} style={{ ...btnStyle, background: '#1A2800', border: '1px solid #F9A825' }}>
            ⚠ REN
          </button>
          <button onClick={onToggleHelp} style={{ ...btnStyle, background: '#0F2A45', border: '1px solid #4FC3F7' }}>
            ? Hjelp
          </button>
          <button onClick={onRestartTour} style={{ ...btnStyle, background: '#0F2A45' }}>
            Vis omvisning
          </button>
        </div>

        {/* Rad 2: Analyse-verktøy */}
        <div data-tour="toolbar-row2" style={{ overflowX: 'auto', borderTop: '1px solid #0E3A5F' }}>
          <div className="flex items-center gap-2 px-4" style={{ color: '#E8F0FE', height: 38, minWidth: 'max-content' }}>
            <button
              onClick={runPowerFlow}
              disabled={project.buses.length === 0 || powerFlowStatus === 'running'}
              title={validationResult && !validationResult.valid ? `${validationResult.errors.length} valideringsfeil` : undefined}
              style={{
                ...anaBtnStyle,
                background: validationResult && !validationResult.valid ? '#5C1A1A'
                  : powerFlowStatus === 'converged' ? '#1A5C3A'
                  : powerFlowStatus === 'failed' ? '#5C1A1A'
                  : '#0D3B66',
                border: validationResult && !validationResult.valid ? '1px solid #EF4444' : '1px solid #1565C0',
                opacity: project.buses.length === 0 ? 0.5 : 1,
              }}
            >
              {powerFlowStatus === 'running' ? '…'
                : validationResult && !validationResult.valid ? `✗ ${validationResult.errors.length} feil`
                : 'Lastflyt'}
            </button>

            <button
              onClick={onToggleCompensation}
              disabled={project.buses.length === 0}
              style={{ ...anaBtnStyle, background: '#3A1A5C', border: '1px solid #9C27B0', opacity: project.buses.length === 0 ? 0.5 : 1 }}
            >
              Kompensering
            </button>

            <button
              onClick={onToggleProduction}
              disabled={project.generators.length === 0}
              style={{ ...anaBtnStyle, background: '#0F3B1E', border: '1px solid #2E7D32', opacity: project.generators.length === 0 ? 0.5 : 1 }}
            >
              ⚡ Produksjon
            </button>

            <button
              onClick={onToggleVoltageDrop}
              disabled={project.lines.length === 0}
              style={{ ...anaBtnStyle, background: '#1A2B0F', border: '1px solid #558B2F', opacity: project.lines.length === 0 ? 0.5 : 1 }}
            >
              ΔU Spenning
            </button>

            <button
              onClick={onToggleShortCircuit}
              disabled={project.buses.length < 2}
              style={{ ...anaBtnStyle, background: '#1A0000', color: '#EF9A9A', border: '1px solid #B71C1C', opacity: project.buses.length < 2 ? 0.5 : 1 }}
            >
              ⚡ Kortslutning
            </button>

            <button
              onClick={onToggleRingNetwork}
              disabled={project.buses.length < 3}
              style={{ ...anaBtnStyle, background: '#001A00', color: '#A5D6A7', border: '1px solid #1B5E20', opacity: project.buses.length < 3 ? 0.5 : 1 }}
            >
              ⭕ Ringnett
            </button>

            <button
              onClick={onToggleProtection}
              disabled={project.lines.length === 0}
              title="Klikk på en linje for å legge til vern"
              style={{ ...anaBtnStyle, background: '#1A1A0F', color: '#F9A825', border: '1px solid #827717', opacity: project.lines.length === 0 ? 0.5 : 1 }}
            >
              🛡 Vern
            </button>

            <button
              onClick={onToggleProductionDashboard}
              disabled={project.generators.length === 0}
              title="Produksjonsdashboard — MW, MWh/år, CO₂"
              style={{ ...anaBtnStyle, background: '#0D1A0D', color: '#A5D6A7', border: '1px solid #388E3C', opacity: project.generators.length === 0 ? 0.5 : 1 }}
            >
              ☀ Dashboard
            </button>

            <button
              onClick={onToggleTimeSeries}
              title="Tidsserie-simulering 24t — lastprofil, produksjon, balanse"
              style={{ ...anaBtnStyle, background: '#0D1A0D', color: '#80CBC4', border: '1px solid #00796B' }}
            >
              ⏱ Tidsserie
            </button>

            <button
              onClick={onToggleEarthFault}
              disabled={project.buses.length < 1}
              title="Beregn jordfeilstrøm (IT/TN/Petersen)"
              style={{ ...anaBtnStyle, background: '#0D1A0D', color: '#66BB6A', border: '1px solid #2E7D32', opacity: project.buses.length < 1 ? 0.5 : 1 }}
            >
              ⏚ Jordfeil
            </button>

            <button
              onClick={onToggleNeutralTreatment}
              title="Nøytralbehandling — IT / TN / Petersen sammenligning"
              style={{ ...anaBtnStyle, background: '#0D1520', color: '#4FC3F7', border: '1px solid #1565C0' }}
            >
              ∿ Nøytral
            </button>

            <div style={{ width: 1, height: 20, background: '#1E3A5F', margin: '0 4px' }} />

            <button
              onClick={onToggleScenarioLibrary}
              title="Scenariobibliotek — last inn ferdigbygde nett"
              style={{ ...anaBtnStyle, background: '#1A0D2E', color: '#CE93D8', border: '1px solid #7B1FA2' }}
            >
              📚 Scenarioer
            </button>

            <button
              onClick={onToggleFormulaSheet}
              title="Formelark — alle nøkkelformler gruppert per tema"
              style={{ ...anaBtnStyle, background: '#1A1200', color: '#FFE082', border: '1px solid #F9A825' }}
            >
              📐 Formelark
            </button>

            <button
              onClick={onToggleGlossary}
              title="Fagordliste — søkbar liste med 20+ fagtermer"
              style={{ ...anaBtnStyle, background: '#001A1A', color: '#80CBC4', border: '1px solid #00796B' }}
            >
              📖 Ordliste
            </button>

            <button
              onClick={onToggleLearningObjectives}
              title="Læringsmål — hva du lærer av hver funksjon"
              style={{ ...anaBtnStyle, background: '#001A0A', color: '#A5D6A7', border: '1px solid #2E7D32' }}
            >
              🎓 Læringsmål
            </button>

            <div style={{ width: 1, height: 20, background: '#1E3A5F', margin: '0 4px' }} />

            <button
              onClick={onTogglePerUnit}
              title="Per-unit visning — normaliser alle verdier mot valgt base"
              style={{ ...anaBtnStyle, background: '#001A1A', color: '#80CBC4', border: '1px solid #00796B' }}
            >
              ∿ Per-unit
            </button>

            <button
              onClick={onToggleExport}
              title="CSV-eksport — last ned resultater som regneark"
              style={{ ...anaBtnStyle, background: '#0A1A0A', color: '#A5D6A7', border: '1px solid #388E3C' }}
            >
              📊 CSV
            </button>

            <button
              onClick={onToggleReport}
              title="Generer PDF-rapport"
              style={{ ...anaBtnStyle, background: '#0D2040', color: '#90CAF9', border: '1px solid #1565C0' }}
            >
              📄 Rapport
            </button>
          </div>
        </div>
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

const btnStyle: React.CSSProperties = {
  background: '#0D3B66',
  color: '#E8F0FE',
  border: '1px solid #1565C0',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 12,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const anaBtnStyle: React.CSSProperties = {
  background: '#0D3B66',
  color: '#E8F0FE',
  border: '1px solid #1565C0',
  borderRadius: 5,
  padding: '4px 10px',
  fontSize: 12,
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
