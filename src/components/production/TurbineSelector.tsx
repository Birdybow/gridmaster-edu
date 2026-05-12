import type { GeneratorType } from '../../types';

interface TurbineInfo {
  type: GeneratorType;
  label: string;
  headRange: string;
  flowDesc: string;
  etaMax: number;
  description: string;
}

const TURBINES: TurbineInfo[] = [
  {
    type: 'hydro_francis',
    label: 'Francis',
    headRange: '40–600 m',
    flowDesc: 'Stor',
    etaMax: 0.93,
    description: 'Bred effektiv sone, beste valg ved delvis last og middels fall.',
  },
  {
    type: 'hydro_pelton',
    label: 'Pelton',
    headRange: '300–1800 m',
    flowDesc: 'Liten',
    etaMax: 0.91,
    description: 'Impuls-turbin for høyfall. God virkningsgrad ved lav vannføring.',
  },
  {
    type: 'hydro_kaplan',
    label: 'Kaplan',
    headRange: '5–40 m',
    flowDesc: 'Veldig stor',
    etaMax: 0.92,
    description: 'Aksialstrømsturbin for lavfall og høy gjennomstrømning.',
  },
];

interface Props {
  selected: GeneratorType;
  onChange: (t: GeneratorType) => void;
}

export function TurbineSelector({ selected, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#90CAF9', fontWeight: 600, marginBottom: 2 }}>
        TURBINTYPE
      </div>
      {TURBINES.map((t) => {
        const active = selected === t.type;
        return (
          <button
            key={t.type}
            onClick={() => onChange(t.type)}
            style={{
              background: active ? '#1565C0' : '#0D2137',
              border: active ? '1px solid #42A5F5' : '1px solid #1E3A5F',
              borderRadius: 6,
              padding: '8px 10px',
              color: '#E8F0FE',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</span>
              <span style={{ fontSize: 11, color: '#90CAF9' }}>η_max = {(t.etaMax * 100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize: 11, color: '#B0BEC5', marginTop: 2 }}>
              Fall: {t.headRange} · Flow: {t.flowDesc}
            </div>
            <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>{t.description}</div>
          </button>
        );
      })}
    </div>
  );
}

/** Returns η_max for a given hydro turbine type */
export function getEtaMax(turbineType: GeneratorType): number {
  return TURBINES.find((t) => t.type === turbineType)?.etaMax ?? 0.90;
}
