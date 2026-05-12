import { useState } from 'react';

interface Props {
  onClose: () => void;
}

interface FormulaGroup {
  title: string;
  icon: string;
  color: string;
  formulas: { name: string; expr: string; unit?: string; note?: string }[];
}

const GROUPS: FormulaGroup[] = [
  {
    title: 'Lastflyt',
    icon: '⚡',
    color: '#4FC3F7',
    formulas: [
      { name: 'Tilsynelatende effekt', expr: 'S = P + jQ = U · I*', unit: 'MVA' },
      { name: 'Effektfaktor', expr: 'cosφ = P / |S|', unit: '-' },
      { name: 'Strøm', expr: 'I = S / (√3 · U)', unit: 'A', note: '3-fase' },
      { name: 'Reaktiv effekt', expr: 'Q = P · tan(arccos(φ))', unit: 'MVAr' },
      { name: 'Buseffekt (NR)', expr: 'P_i = Σⱼ |V_i||V_j|(G_ij cosδ_ij + B_ij sinδ_ij)', unit: 'pu' },
      { name: 'Mismatch', expr: 'ΔP_i = P_i,sched − P_i,calc', unit: 'pu' },
    ],
  },
  {
    title: 'Spenningsfall',
    icon: 'ΔU',
    color: '#8BC34A',
    formulas: [
      { name: 'Enkel modell', expr: 'ΔU = √3 · I · (R·cosφ + X·sinφ) · L', unit: 'V' },
      { name: 'π-modell', expr: 'ΔU = √3 · I · Z − jB·U²/2', unit: 'V' },
      { name: 'Relativt spenningsfall', expr: 'ΔU% = ΔU / U_n · 100', unit: '%' },
      { name: 'Grense (IEC 60038)', expr: 'ΔU% ≤ ±5 %', unit: '%' },
      { name: 'Linjemotstand', expr: 'R = ρ · L / A', unit: 'Ω', note: 'ρ_Cu = 0.0175 Ω·mm²/m' },
    ],
  },
  {
    title: 'Kortslutning',
    icon: '⚡',
    color: '#EF5350',
    formulas: [
      { name: '3-fase kortslutning', expr: 'Ik3p = c · Un / (√3 · |Z_k|)', unit: 'A', note: 'c = 1.0 (min), 1.1 (max)' },
      { name: '2-fase kortslutning', expr: 'Ik2p = Ik3p · √3/2 ≈ 0.866 · Ik3p', unit: 'A' },
      { name: 'Kortslutningsimpedans', expr: 'Z_k = Z_thevenin (sett fra feilsted)', unit: 'Ω' },
      { name: 'Transformatorimpedans', expr: 'Z_T = e_k% · U_n² / (100 · S_n)', unit: 'Ω' },
      { name: 'Bryterevne', expr: 'I_cb ≥ Ik3p,max', unit: 'A', note: 'IEC 60909' },
    ],
  },
  {
    title: 'Vern (IDMT)',
    icon: '🛡',
    color: '#F9A825',
    formulas: [
      { name: 'Normal invers', expr: 't = TMS · 0.14 / ((I/Is)^0.02 − 1)', unit: 's', note: 'IEC 60255-151' },
      { name: 'Svært invers', expr: 't = TMS · 13.5 / ((I/Is) − 1)', unit: 's' },
      { name: 'Ekstremt invers', expr: 't = TMS · 80 / ((I/Is)² − 1)', unit: 's' },
      { name: 'Innstillingsstrøm', expr: 'Is = k_s · I_n  (k_s ≈ 1.05 – 1.2)', unit: 'A' },
      { name: 'Selektivitetstid', expr: 'Δt ≥ 0.3 s  (mellom vern i hierarki)', unit: 's' },
    ],
  },
  {
    title: 'Vannkraft',
    icon: '💧',
    color: '#4FC3F7',
    formulas: [
      { name: 'Generatoreffekt', expr: 'P = η · ρ · g · H · Q / 10⁶', unit: 'MW', note: 'η ≈ 0.85–0.95, ρ = 1000 kg/m³' },
      { name: 'Hydraulisk effekt', expr: 'P_hyd = ρ · g · H · Q', unit: 'W' },
      { name: 'Virkningsgrad', expr: 'η = P_el / P_hyd', unit: '-' },
      { name: 'Energiutbytte', expr: 'E_år = P · 8760 · CF', unit: 'MWh', note: 'CF ≈ 0.45 vannkraft' },
    ],
  },
  {
    title: 'Vindkraft',
    icon: '🌬',
    color: '#4CAF50',
    formulas: [
      { name: 'Innkoblingsregion', expr: 'P = Pn · ((v − vci) / (vr − vci))³', unit: 'MW', note: 'vci ≤ v ≤ vr' },
      { name: 'Rated region', expr: 'P = Pn', unit: 'MW', note: 'vr < v ≤ vco' },
      { name: 'Utkoblet', expr: 'P = 0', unit: 'MW', note: 'v < vci eller v > vco' },
      { name: 'Energiutbytte', expr: 'E_år = Pn · 8760 · CF', unit: 'MWh', note: 'CF ≈ 0.25–0.45 vind' },
    ],
  },
  {
    title: 'Solkraft',
    icon: '☀',
    color: '#FFC107',
    formulas: [
      { name: 'Soleffekt (dag)', expr: 'P_sol = P_peak · sin(π · (h − 6) / 14)', unit: 'MW', note: 'h = 6..20' },
      { name: 'Natt', expr: 'P_sol = 0', unit: 'MW', note: 'h < 6 eller h > 20' },
      { name: 'Kapasitetsfaktor', expr: 'CF_sol ≈ 0.10 – 0.20 (Norge)', unit: '-' },
    ],
  },
  {
    title: 'Jordfeil',
    icon: '⏚',
    color: '#66BB6A',
    formulas: [
      { name: 'IT-nett (kapasitiv)', expr: 'I_CE = 3 · ω · C₀ · U_n / √3', unit: 'A' },
      { name: 'Petersen-spole', expr: 'L_P = 1 / (3 · ω² · C₀)', unit: 'H', note: 'Full kompensering' },
      { name: 'Reststrøm', expr: 'I_rest = I_CE − I_L', unit: 'A' },
      { name: 'TN-nett (resistiv)', expr: 'I_f = U_f / (Z_s + Z_PE)', unit: 'A' },
    ],
  },
];

export function FormulaSheet({ onClose }: Props) {
  const [active, setActive] = useState(0);
  const group = GROUPS[active];

  return (
    <div
      style={{
        background: '#0A1929',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        width: 500,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #1E3A5F', background: '#0D2137' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#90CAF9' }}>📐 Formelark — GridMaster Edu</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#607D8B', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #1E3A5F', background: '#0D1B2A' }}>
        {GROUPS.map((g, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              background: active === i ? '#0F3B55' : 'transparent',
              border: 'none',
              borderBottom: active === i ? `2px solid ${g.color}` : '2px solid transparent',
              color: active === i ? g.color : '#607D8B',
              padding: '6px 10px',
              fontSize: 11,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: active === i ? 700 : 400,
            }}
          >
            {g.icon} {g.title}
          </button>
        ))}
      </div>

      {/* Formulas */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: group.color, marginBottom: 12 }}>
          {group.icon} {group.title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.formulas.map((f, i) => (
            <div
              key={i}
              style={{
                background: '#0D2137',
                border: `1px solid #1E3A5F`,
                borderRadius: 6,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 10, color: '#607D8B', marginBottom: 4 }}>{f.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#E8F0FE', marginBottom: f.note ? 4 : 0 }}>
                {f.expr}
                {f.unit && <span style={{ color: '#546E7A', fontSize: 12, marginLeft: 8 }}>[{f.unit}]</span>}
              </div>
              {f.note && <div style={{ fontSize: 10, color: '#546E7A' }}>{f.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
