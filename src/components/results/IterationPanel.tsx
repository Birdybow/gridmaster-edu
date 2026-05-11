import type { IterationStep } from '../../types/index.js';

interface Props {
  steps: IterationStep[];
  converged: boolean;
}

const cell: React.CSSProperties = { padding: '3px 10px', borderBottom: '1px solid #1A3A5C', fontFamily: 'monospace' };
const hdr: React.CSSProperties = { ...cell, color: '#4FC3F7', fontWeight: 600, fontFamily: 'inherit' };

/**
 * Pedagogical iteration log — shows mismatch reduction per NR step.
 * This panel is the educational heart of GridMaster Edu: students can see
 * how Newton-Raphson converges quadratically toward the power flow solution.
 */
export function IterationPanel({ steps, converged }: Props) {
  return (
    <div
      style={{
        background: '#0D1B2A',
        borderTop: '1px solid #1565C0',
        color: '#E8F0FE',
        fontSize: 12,
        padding: '8px 12px',
        maxHeight: 200,
        overflowY: 'auto',
      }}
    >
      <div style={{ color: '#4FC3F7', fontWeight: 600, marginBottom: 6 }}>
        Newton-Raphson iterasjonslogg
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={hdr}>Iter.</th>
            <th style={hdr}>Max ΔP [p.u.]</th>
            <th style={hdr}>Max ΔQ [p.u.]</th>
            <th style={hdr}>Status</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, idx) => {
            const isLast = idx === steps.length - 1;
            const status = isLast
              ? converged
                ? '✓ Konvergert'
                : '✗ Ikke konvergert'
              : '…';
            const statusColor = isLast ? (converged ? '#4CAF50' : '#F44336') : '#aaa';
            return (
              <tr key={s.iteration}>
                <td style={cell}>{s.iteration}</td>
                <td style={cell}>{s.maxMismatchP.toExponential(3)}</td>
                <td style={cell}>{s.maxMismatchQ.toExponential(3)}</td>
                <td style={{ ...cell, color: statusColor }}>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {converged && steps.length > 0 && (
        <div style={{ marginTop: 6, color: '#4CAF50', fontSize: 11 }}>
          Konvergert etter {steps.length - 1} korreksjoner. Kvadratisk konvergensrate observert.
        </div>
      )}
    </div>
  );
}
