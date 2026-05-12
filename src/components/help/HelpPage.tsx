interface HelpPageProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    id: 'formulas',
    title: 'Formler og beregninger',
    content: [
      {
        name: 'Newton-Raphson lastflyt',
        formula: 'P = V·Σ Vk·(Gik·cos(δi−δk) + Bik·sin(δi−δk))',
        note: 'Itererer til maksimalt ubalanse < 10⁻⁶ p.u.',
      },
      {
        name: 'Spenningsfall (enkel)',
        formula: 'ΔU% = (I·(R·cosφ + X·sinφ) / Uₙ) × 100',
        note: 'Brukes for linjer < 50 km (REN blad 6002)',
      },
      {
        name: 'Spenningsfall (pi-modell)',
        formula: 'ΔU% basert på pi-ekvivalentkrets med shunt-kapasitans',
        note: 'Brukes for linjer ≥ 50 km',
      },
      {
        name: 'Kortslutningsstrøm (IEC 60909)',
        formula: "I''k3p = c·Un / (√3·|Zk|)",
        note: 'c = 1.10 (maks), 0.95 (min)',
      },
      {
        name: 'Støtfaktor',
        formula: 'ip = κ·√2·I\'\'k3p,  κ = 1.02 + 0.98·e^(−3R/X)',
        note: 'Typisk κ = 1.5–1.8 for norske nett',
      },
      {
        name: 'Fasekompensering',
        formula: 'Qkomp = P·(tanφ₁ − tanφ₂)',
        note: 'P beregnes fra lastflyt',
      },
      {
        name: 'Ringnett (symmetrisk)',
        formula: 'IA = Σ(Load·dist_from_B) / Total_dist',
        note: 'Strømdeling omvendt proporsjonalt med motstand',
      },
    ],
  },
  {
    id: 'ren',
    title: 'REN-regler (Norsk Elektroteknisk Norm)',
    content: [
      {
        name: 'Kabelregel (REN blad 4004 §3.3)',
        formula: 'Ib ≤ In ≤ Iz',
        note: 'Ib = belastningsstrøm, In = vernrating, Iz = kabelkapasitet',
      },
      {
        name: 'Spenningsfall (REN blad 6002 §4.1)',
        formula: 'ΔU% < 4% (OK), 4–10% (advarsel), ≥ 10% (feil)',
        note: 'Gjelder fordeling og forbruk',
      },
      {
        name: 'Kortslutningsvern (REN blad 7002 §2.2)',
        formula: 'Ik3p ≥ 2 × Ia (5-sekunders krav)',
        note: 'Ia = øyeblikkstrøm for type C-vern = 10 × In',
      },
      {
        name: 'Selektivitet (REN blad 7002 §5.1)',
        formula: 'Δt = t_opp − t_ned ≥ 200 ms',
        note: 'Oppstrøms vern må holde under nedstrøms utløser',
      },
      {
        name: 'Jordmotstand IT-nett (REN blad 9001 §3.2)',
        formula: 'Rjord ≤ 100 Ω',
        note: 'Gjelde for IT og Petersen-nettet',
      },
      {
        name: 'Jordmotstand TN-nett (REN blad 9001 §3.2)',
        formula: 'Rjord ≤ 50 Ω',
        note: 'Strengere krav for TN-nett',
      },
    ],
  },
  {
    id: 'fasitsvar',
    title: 'Fasitsvar (scenarier)',
    content: [
      { name: 'NR lastflyt', formula: 'I = 148 A, ΔU = 4.76%', note: '3-buss radialtest' },
      { name: 'Fasekompensering', formula: 'Qkomp ≈ 0.991 MVAr', note: 'cosφ 0.85 → 0.95' },
      { name: 'Vannkraft (Francis)', formula: 'P = 90.252 MW', note: 'H=200m, Q=50m³/s, η=0.92' },
      { name: 'Kortslutning I\'\'k3p', formula: '1.252 kA', note: 'IEC 60909, c=1.10' },
      { name: 'Kortslutning I\'\'k2p', formula: '1.084 kA', note: '= I\'\'k3p × √3/2' },
      { name: 'Støtfaktor ip', formula: '2.557 kA', note: 'κ ≈ 1.448' },
      { name: 'Ringnett I_A = I_B', formula: '83 A (symmetrisk)', note: 'tap = 20.6 kW, reduksjon = 75%' },
      { name: 'Vern SI (t)', formula: '0.429 s', note: 'TMS=0.1, Is=100A, I=500A' },
      { name: 'Vern VI (t)', formula: '0.338 s', note: 'Standard very inverse' },
      { name: 'Tidsserie kl.12', formula: '−1.552 MW', note: 'Nettoverskudd middag' },
      { name: 'Tidsserie kl.03', formula: '+2.2 MW', note: 'Nettunderskudd natt' },
    ],
  },
  {
    id: 'shortcuts',
    title: 'Hurtigtaster og tips',
    content: [
      { name: 'Zoom', formula: 'Musehjul', note: 'Zoom inn/ut på canvas' },
      { name: 'Flytt canvas', formula: 'Venstreklikk + dra', note: 'Pan kanvasvisningen' },
      { name: 'Velg komponent', formula: 'Klikk', note: 'Åpner editor i høyre panel' },
      { name: 'Slett komponent', formula: 'Delete / Backspace', note: 'Sletter valgt element' },
      { name: 'Ny buss', formula: 'ComponentPanel → dra', note: 'Dra fra venstre panel' },
      { name: 'Lagre', formula: 'Fil → Lagre', note: 'Laster ned .gmx-fil' },
    ],
  },
];

export function HelpPage({ onClose }: HelpPageProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0D1B2A', border: '1px solid #1E3A5F', borderRadius: 12,
        width: '85vw', maxWidth: 900, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 8px 64px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid #1E3A5F', background: '#0F1F2E',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#4FC3F7' }}>
            Hjelp — GridMaster Edu
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#4FC3F7', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {section.title}
              </h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {section.content.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid', gridTemplateColumns: '180px 1fr 1fr',
                      gap: 12, padding: '8px 12px', background: '#0F1F2E',
                      borderRadius: 6, border: '1px solid #1E3A5F', alignItems: 'start',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#90A4AE' }}>{item.name}</span>
                    <code style={{ fontSize: 11, color: '#FFD54F', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {item.formula}
                    </code>
                    <span style={{ fontSize: 11, color: '#607D8B' }}>{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #1E3A5F', paddingTop: 16, color: '#37474F', fontSize: 11, textAlign: 'center' }}>
            GridMaster Edu v13.0.0 — © 2026 Bård Reinton-Kjellhov — Malakoff Videregående skole / 00TE13I
          </div>
        </div>
      </div>
    </div>
  );
}
