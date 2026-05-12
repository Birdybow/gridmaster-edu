import { useNetworkStore } from '../../store/useNetworkStore.js';
import {
  exportYBusCsv,
  exportLoadFlowCsv,
  exportShortCircuitCsv,
  exportRingNetworkCsv,
  exportVoltageDropCsv,
} from '../../export/csv.js';
import { HelpIcon } from '../common/HelpIcon.js';

interface ExportPanelProps {
  onClose: () => void;
}

export function ExportPanel({ onClose }: ExportPanelProps) {
  const project = useNetworkStore((s) => s.project);
  const ringNetworkResults = useNetworkStore((s) => s.ringNetworkResults);

  const pf = project.results.powerFlow;
  const scResults = project.results.shortCircuit ?? [];
  const vdResults = project.results.voltageDrop ?? [];

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: enabled ? '#0D3B66' : '#1A2A3A',
    color: enabled ? '#E8F0FE' : '#455A64',
    border: `1px solid ${enabled ? '#1565C0' : '#263238'}`,
    borderRadius: 5,
    padding: '7px 12px',
    fontSize: 12,
    cursor: enabled ? 'pointer' : 'not-allowed',
    marginBottom: 6,
  });

  return (
    <div style={{
      background: '#0F1F30',
      border: '1px solid #1E3A5F',
      borderRadius: 8,
      padding: '16px 20px',
      width: 280,
      color: '#E8F0FE',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, color: '#4FC3F7', fontSize: 13 }}>📊 CSV-eksport</span>
          <HelpIcon title="CSV-eksport" text={"Semikolonseparator (;) + UTF-8 BOM\nKlar for import i Excel\nEksporter YBus, lastflyt, kortslutning m.m."} />
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 15 }}>✕</button>
      </div>

      <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 12 }}>
        Separator: semikolon ( ; )  ·  UTF-8 BOM (norsk Excel)
      </div>

      <button
        style={btnStyle(project.buses.length > 0)}
        disabled={project.buses.length === 0}
        onClick={() => exportYBusCsv(project)}
      >
        Y-bussmatrise
        {project.buses.length === 0 && <span style={{ fontSize: 10, marginLeft: 6 }}>(ingen busser)</span>}
      </button>

      <button
        style={btnStyle(!!pf && pf.converged)}
        disabled={!pf || !pf.converged}
        onClick={() => pf && exportLoadFlowCsv(project, pf)}
      >
        Lastflyt-resultater
        {(!pf || !pf.converged) && <span style={{ fontSize: 10, marginLeft: 6 }}>(kjør lastflyt først)</span>}
      </button>

      <button
        style={btnStyle(vdResults.length > 0)}
        disabled={vdResults.length === 0}
        onClick={() => exportVoltageDropCsv(project, vdResults)}
      >
        Spenningsfall
        {vdResults.length === 0 && <span style={{ fontSize: 10, marginLeft: 6 }}>(ingen resultater)</span>}
      </button>

      <button
        style={btnStyle(scResults.length > 0)}
        disabled={scResults.length === 0}
        onClick={() => exportShortCircuitCsv(project, scResults)}
      >
        Kortslutning
        {scResults.length === 0 && <span style={{ fontSize: 10, marginLeft: 6 }}>(ingen resultater)</span>}
      </button>

      <button
        style={btnStyle(ringNetworkResults !== null)}
        disabled={ringNetworkResults === null}
        onClick={() => ringNetworkResults && exportRingNetworkCsv(project, ringNetworkResults)}
      >
        Ringnett
        {ringNetworkResults === null && <span style={{ fontSize: 10, marginLeft: 6 }}>(ingen resultater)</span>}
      </button>
    </div>
  );
}
