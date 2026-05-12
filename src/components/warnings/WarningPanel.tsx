import type { RenResult } from '../../validation/ren-rules.js';
import { useNetworkStore } from '../../store/useNetworkStore.js';

const AREA_LABEL: Record<string, string> = {
  cable: 'Kabel',
  voltage_drop: 'Spenningsfall',
  short_circuit: 'Kortslutning',
  protection: 'Vern',
  earthing: 'Jording',
};

function SeverityIcon({ s }: { s: RenResult['severity'] }) {
  if (s === 'error') return <span style={{ color: '#EF5350', fontWeight: 700 }}>✕ Feil</span>;
  if (s === 'warning') return <span style={{ color: '#F9A825', fontWeight: 700 }}>⚠ Advarsel</span>;
  return <span style={{ color: '#4CAF50' }}>✓ OK</span>;
}

interface WarningPanelProps {
  onClose: () => void;
}

export function WarningPanel({ onClose }: WarningPanelProps) {
  const renResults = useNetworkStore((s) => s.renResults);

  const errors = renResults.filter((r) => r.severity === 'error');
  const warnings = renResults.filter((r) => r.severity === 'warning');

  return (
    <div
      data-tour="warning-panel"
      style={{
        background: '#0D1B2A',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        width: 360,
        maxHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', borderBottom: '1px solid #1E3A5F', background: '#0F1F2E',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#F9A825' }}>
          ⚠ REN-advarsler
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {errors.length > 0 && (
            <span style={{ fontSize: 11, color: '#EF5350', fontWeight: 600 }}>
              {errors.length} feil
            </span>
          )}
          {warnings.length > 0 && (
            <span style={{ fontSize: 11, color: '#F9A825', fontWeight: 600 }}>
              {warnings.length} advarsel{warnings.length !== 1 ? 'er' : ''}
            </span>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {renResults.length === 0 ? (
          <div style={{ padding: '20px 16px', color: '#4CAF50', fontSize: 13, textAlign: 'center' }}>
            ✓ Ingen REN-avvik funnet
          </div>
        ) : (
          renResults.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '8px 14px',
                borderBottom: '1px solid #0F1F2E',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#607D8B',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  {AREA_LABEL[r.area] ?? r.area}
                </span>
                <SeverityIcon s={r.severity} />
              </div>
              <div style={{ fontSize: 12, color: '#CFD8DC', lineHeight: 1.4 }}>{r.message}</div>
              <div style={{ fontSize: 10, color: '#37474F' }}>{r.reference}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
