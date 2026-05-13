import { useState, useEffect } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';

export function ValidationPanel() {
  const validationResult = useNetworkStore((s) => s.validationResult);
  const [dismissed, setDismissed] = useState(false);
  const [warningsDismissed, setWarningsDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    setWarningsDismissed(false);
    if (!validationResult?.valid) return;
    const hasMeshedOnly =
      validationResult.warnings.length > 0 &&
      validationResult.warnings.every((w) => w.code === 'MESHED_NETWORK');
    if (!hasMeshedOnly) return;
    const t = setTimeout(() => setDismissed(true), 5000);
    return () => clearTimeout(t);
  }, [validationResult]);

  if (!validationResult || dismissed) return null;

  const { valid, errors, warnings } = validationResult;
  const visibleWarnings = warningsDismissed ? [] : warnings;
  if (valid && visibleWarnings.length === 0) return null;

  return (
    <div
      style={{
        background: '#0F1F2E',
        border: `1px solid ${valid ? '#F59E0B' : '#EF4444'}`,
        borderRadius: 6,
        padding: '10px 14px',
        fontSize: 12,
        color: '#E8F0FE',
        margin: '0 8px 8px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: valid ? '#F59E0B' : '#EF4444' }}>
          {valid ? '⚠ Advarsler' : '✗ Nettfeil — beregning blokkert'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {valid && visibleWarnings.length > 0 && (
            <button
              onClick={() => setWarningsDismissed(true)}
              style={{ background: 'none', border: '1px solid #4A5568', borderRadius: 4, color: '#9E9E9E', cursor: 'pointer', fontSize: 10, padding: '1px 6px' }}
            >
              Tøm advarsler
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
            title="Lukk"
          >
            ×
          </button>
        </div>
      </div>
      {errors.map((e, i) => (
        <div key={i} style={{ color: '#FCA5A5', marginBottom: 3 }}>
          ✗ {e.message}
        </div>
      ))}
      {visibleWarnings.map((w, i) => (
        <div key={i} style={{ color: '#FCD34D', marginBottom: 3 }}>
          ⚠ {w.message}
        </div>
      ))}
    </div>
  );
}
