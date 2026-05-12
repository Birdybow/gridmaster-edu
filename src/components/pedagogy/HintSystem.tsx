import type { ValidationMessage, VoltageDropResult, ShortCircuitResult } from '../../types/index.js';
import { useNetworkStore } from '../../store/useNetworkStore.js';

interface Hint {
  id: string;
  icon: string;
  title: string;
  tips: string[];
  color: string;
}

function deriveHints(
  validationErrors: ValidationMessage[],
  voltageDropResults: VoltageDropResult[],
  shortCircuitResults: ShortCircuitResult[],
): Hint[] {
  const hints: Hint[] = [];

  const hasNoSlack = validationErrors.some((e) =>
    e.message.toLowerCase().includes('slack') || e.message.toLowerCase().includes('referanse'),
  );
  if (hasNoSlack) {
    hints.push({
      id: 'no-slack',
      icon: '💡',
      title: 'Ingen slack-buss',
      color: '#FFC107',
      tips: [
        'Slack-bussen er referansepunktet i nettet.',
        'Legg til én buss av type Slack (holder U=1.0∠0°).',
        'Klikk "+Buss" og velg type "Slack" i komponentpanelet.',
      ],
    });
  }

  const highVD = voltageDropResults.filter((r) => r.deltaUPercent > 5);
  if (highVD.length > 0) {
    hints.push({
      id: 'high-vd',
      icon: '💡',
      title: 'Spenningsfall over 5 %',
      color: '#8BC34A',
      tips: [
        'Spenningsfallet er for høyt (IEC 60038 tillater ±5 %).',
        '1. Forkort linjene (reduser lengde)',
        '2. Øk ledertverrsnittet (reduser R/km)',
        '3. Legg til fasekompensering (kondensator)',
      ],
    });
  }

  const highSC = shortCircuitResults.filter((r) => r.ik3pMaxKA > 25);
  if (highSC.length > 0) {
    hints.push({
      id: 'high-sc',
      icon: '💡',
      title: 'Høy kortslutningsstrøm',
      color: '#EF5350',
      tips: [
        'Kortslutningsstrømmen overskrider typisk bryterevne på 25 kA.',
        '1. Øk nettimpedansen (lengre linje eller trafo med høyere e_k%)',
        '2. Velg bryter med høyere bryterevne',
        '3. Sjekk om verdiene er realistiske for nettnivået',
      ],
    });
  }

  return hints;
}

export function HintSystem() {
  const validationResult = useNetworkStore((s) => s.validationResult);
  const rawVD = useNetworkStore((s) => s.project.results.voltageDrop);
  const rawSC = useNetworkStore((s) => s.project.results.shortCircuit);

  const errors = validationResult?.valid === false ? validationResult.errors : [];
  const vdResults = rawVD ?? [];
  const scResults = rawSC ?? [];

  const hints = deriveHints(errors, vdResults, scResults);

  if (hints.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 60,
        right: 16,
        zIndex: 55,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 320,
        pointerEvents: 'none',
      }}
    >
      {hints.map((h) => (
        <div
          key={h.id}
          style={{
            background: '#0A1929',
            border: `1px solid ${h.color}33`,
            borderLeft: `3px solid ${h.color}`,
            borderRadius: 6,
            padding: '10px 12px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: h.color, marginBottom: 6 }}>
            {h.icon} {h.title}
          </div>
          {h.tips.map((tip, i) => (
            <div key={i} style={{ fontSize: 11, color: '#90A4AE', lineHeight: 1.5, marginBottom: 2 }}>
              {tip}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
