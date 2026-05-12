import type { RenResult, RenSeverity } from '../../validation/ren-rules.js';

interface WarningBadgeProps {
  results: RenResult[];
  size?: number;
}

function severityColor(s: RenSeverity): string {
  if (s === 'error') return '#EF5350';
  if (s === 'warning') return '#F9A825';
  return '#4CAF50';
}

function worstSeverity(results: RenResult[]): RenSeverity | null {
  if (results.some((r) => r.severity === 'error')) return 'error';
  if (results.some((r) => r.severity === 'warning')) return 'warning';
  if (results.length > 0) return 'ok';
  return null;
}

export function WarningBadge({ results, size = 14 }: WarningBadgeProps) {
  const worst = worstSeverity(results);
  if (!worst || worst === 'ok') return null;

  const color = severityColor(worst);
  const icon = worst === 'error' ? '✕' : '!';

  return (
    <div
      title={results.map((r) => r.message).join('\n')}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        fontSize: size * 0.65,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: `0 0 4px ${color}`,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}
