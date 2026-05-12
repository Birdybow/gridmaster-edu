import { useState } from 'react';

interface Props {
  onClose: () => void;
}

type FunctionKey =
  | 'powerflow'
  | 'compensation'
  | 'production'
  | 'voltagedrop'
  | 'shortcircuit'
  | 'ringnetwork'
  | 'protection'
  | 'earthfault'
  | 'neutral'
  | 'timeseries'
  | 'dashboard';

interface Objective {
  label: string;
  icon: string;
  goals: string[];
  method: string;
  standard?: string;
}

const OBJECTIVES: Record<FunctionKey, Objective> = {
  powerflow: {
    label: 'Lastflyt',
    icon: '⚡',
    goals: [
      'Beregne aktiv (P) og reaktiv (Q) effektflyt i et kraftnett',
      'Forstå bussmatrisen og admittansmatrisen Y_bus',
      'Anvende Newton-Raphson-iterasjonsmetoden på kraftsystemlikninger',
      'Tolke konvergert løsning: spenning, vinkel, og effektbalanse per buss',
    ],
    method: 'Newton-Raphson iterasjon på mismatched ΔP og ΔQ',
    standard: 'IEC 60038',
  },
  compensation: {
    label: 'Kompensering',
    icon: '⟳',
    goals: [
      'Forstå hvorfor reaktiv effekt gir strøm og tap uten å gjøre nyttig arbeid',
      'Beregne nødvendig kondensatoreffekt for å nå ønsket cosφ',
      'Beregne trinn-for-trinn kompensering med fast kondensatorstørrelse',
      'Tegne effekttrekant og tolke kVAr-bidrag',
    ],
    method: 'Q_c = P(tanφ₁ − tanφ₂)',
  },
  production: {
    label: 'Produksjon',
    icon: '⚡',
    goals: [
      'Beregne effekt fra vannkraft, vindkraft og solkraft',
      'Forstå kapasitetsfaktor og energiutbytte [MWh/år]',
      'Sammenligne CO₂-utslipp per produksjonsteknikk',
      'Dimensjonere generator basert på ratedMVA og cosφ',
    ],
    method: 'P_hydro = η·ρ·g·H·Q / 10⁶',
  },
  voltagedrop: {
    label: 'Spenningsfall',
    icon: 'ΔU',
    goals: [
      'Beregne spenningsfall over en linje med enkel modell og π-modell',
      'Forstå hvordan R, X, lengde og last påvirker ΔU',
      'Vurdere om spenningsfall er innenfor ±5 % (IEC 60038)',
      'Velge ledertverrsnitt for å tilfredsstille krav til ΔU',
    ],
    method: 'ΔU = √3·I·(R·cosφ + X·sinφ)·L',
    standard: 'IEC 60038 / NEK EN 60038',
  },
  shortcircuit: {
    label: 'Kortslutning',
    icon: '⚡',
    goals: [
      'Beregne trefaset og tofaset kortslutningsstrøm (Ik3p og Ik2p)',
      'Beregne Thévenin-impedans for nettverket sett fra feilstedet',
      'Dimensjonere bryterevne iht. IEC 60909',
      'Vurdere bidrag fra generatorer og nettet',
    ],
    method: 'Ik3p = c·Un / (√3·|Z_k|)',
    standard: 'IEC 60909',
  },
  ringnetwork: {
    label: 'Ringnett',
    icon: '⭕',
    goals: [
      'Beregne strømfordeling i et symmetrisk og asymmetrisk ringnett',
      'Sammenligne N-1 redundans mellom radial- og ringnettkonfigurasjon',
      'Finne nullpunktet (punktet med minst spenning) i ringnett',
      'Forstå fordeler og ulemper med ringtopologi',
    ],
    method: 'Strømdeling: I_A = I_total·Z_B / (Z_A + Z_B)',
  },
  protection: {
    label: 'Vernkoordinering',
    icon: '🛡',
    goals: [
      'Stille inn overstrømsvern med korrekt Is og TMS',
      'Verifisere selektivitet: at nærmeste vern løser ut først',
      'Beregne utløsningstid t for IDMT-karakteristikk (IEC 60255)',
      'Forstå vernhierarkiet fra lavspent til høyspent',
    ],
    method: 't = TMS · 0.14 / ((I/Is)^0.02 − 1)',
    standard: 'IEC 60255-151',
  },
  earthfault: {
    label: 'Jordfeil',
    icon: '⏚',
    goals: [
      'Beregne jordfeilstrøm i IT-, TN- og Petersen-nett',
      'Forstå kapasitiv jordfeilstrøm i IT-nett',
      'Beregne Petersen-spoleverdien for full kompensering',
      'Vurdere personsikkerhet ved jordfeil (berøringspenning)',
    ],
    method: 'I_CE = 3·ω·C₀·U_n/√3 (IT-nett)',
    standard: 'IEC 60364 / NEK 400',
  },
  neutral: {
    label: 'Nøytralbehandling',
    icon: '∿',
    goals: [
      'Sammenligne IT-, TN- og Petersen-jordet nett',
      'Forstå fordeler ved IT-nett for driftskontinuitet',
      'Vurdere valg av nøytralbehandling for ulike installasjoner',
      'Beregne reststrøm ved Petersen-kompensering',
    ],
    method: 'I_rest = I_CE − I_L (Petersen)',
  },
  timeseries: {
    label: 'Tidsserie',
    icon: '⏱',
    goals: [
      'Beregne 24-timers lastprofil for et kraftnett',
      'Forstå typisk norsk lastprofil med morgen- og kveldstoppene',
      'Beregne produksjonsprofil for vind, sol og vann',
      'Vurdere energibalanse og identifisere over-/underskudd',
    ],
    method: 'Balanse = Σ P_prod − P_last per time',
  },
  dashboard: {
    label: 'Produksjonsdashboard',
    icon: '☀',
    goals: [
      'Lese av total installert effekt og energiutbytte per år',
      'Sammenligne kWh-produksjon mellom ulike generatortyper',
      'Beregne kapasitetsfaktor for vind og sol',
      'Estimere CO₂-besparelse sammenlignet med kullkraft',
    ],
    method: 'E_år = P_ratedMW · CF · 8760 [MWh]',
  },
};

const TABS: FunctionKey[] = [
  'powerflow', 'compensation', 'production', 'voltagedrop', 'shortcircuit',
  'ringnetwork', 'protection', 'earthfault', 'neutral', 'timeseries', 'dashboard',
];

export function LearningObjectivesPanel({ onClose }: Props) {
  const [active, setActive] = useState<FunctionKey>('powerflow');
  const obj = OBJECTIVES[active];

  return (
    <div
      style={{
        background: '#0A1929',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        width: 480,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #1E3A5F', background: '#0D2137' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#90CAF9' }}>🎓 Læringsmål per funksjon</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#607D8B', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #1E3A5F', background: '#0D1B2A' }}>
        {TABS.map((key) => {
          const o = OBJECTIVES[key];
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              style={{
                background: active === key ? '#0F3B55' : 'transparent',
                border: 'none',
                borderBottom: active === key ? '2px solid #4FC3F7' : '2px solid transparent',
                color: active === key ? '#4FC3F7' : '#607D8B',
                padding: '6px 10px',
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: active === key ? 700 : 400,
              }}
            >
              {o.icon} {o.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#90CAF9', marginBottom: 12 }}>
          {obj.icon} {obj.label}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#607D8B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Etter dette kan du:
          </div>
          {obj.goals.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#4CAF50', fontSize: 12, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: '#B0BEC5', lineHeight: 1.5 }}>{g}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0D2137', border: '1px solid #1565C0', borderRadius: 6, padding: '10px 12px', marginTop: 12 }}>
          <div style={{ fontSize: 10, color: '#607D8B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Nøkkelformel
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#FFC107' }}>{obj.method}</div>
          {obj.standard && (
            <div style={{ fontSize: 10, color: '#546E7A', marginTop: 4 }}>Standard: {obj.standard}</div>
          )}
        </div>
      </div>
    </div>
  );
}
