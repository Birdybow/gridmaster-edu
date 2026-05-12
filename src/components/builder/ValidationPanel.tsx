import { useNetworkStore } from '../../store/useNetworkStore.js';

export function ValidationPanel() {
  const validationResult = useNetworkStore((s) => s.validationResult);
  if (!validationResult) return null;

  const { valid, errors, warnings } = validationResult;
  if (valid && warnings.length === 0) return null;

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
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, color: valid ? '#F59E0B' : '#EF4444' }}>
        {valid ? '⚠ Advarsler' : '✗ Nettfeil — beregning blokkert'}
      </div>
      {errors.map((e, i) => (
        <div key={i} style={{ color: '#FCA5A5', marginBottom: 3 }}>
          ✗ {e.message}
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={i} style={{ color: '#FCD34D', marginBottom: 3 }}>
          ⚠ {w.message}
        </div>
      ))}
    </div>
  );
}
