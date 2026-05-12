import { useState } from 'react';

interface Props {
  onClose: () => void;
}

interface Term {
  no: string;
  en: string;
  symbol?: string;
  definition: string;
  category: string;
}

const TERMS: Term[] = [
  { no: 'Slack-buss', en: 'Slack bus / Swing bus', symbol: 'V∠δ = 1.0∠0°', definition: 'Referansebuss i lastflytanalyse. Holder spenning og vinkel fast (V=1.0 pu, δ=0°). Absorberer effektbalansefeil.', category: 'Lastflyt' },
  { no: 'PV-buss', en: 'PV bus / Generator bus', symbol: 'P, V gitt', definition: 'Generatorbuss. Aktiv effekt P og spenning V er gitt. Reaktiv effekt Q og vinkel δ beregnes av Newton-Raphson.', category: 'Lastflyt' },
  { no: 'PQ-buss', en: 'PQ bus / Load bus', symbol: 'P, Q gitt', definition: 'Lastbuss. Aktiv effekt P og reaktiv effekt Q er gitt. Spenning V og vinkel δ beregnes av Newton-Raphson.', category: 'Lastflyt' },
  { no: 'Admittansmatrise', en: 'Bus admittance matrix', symbol: 'Y_bus', definition: 'Matrise som beskriver admittansene mellom alle busser. Y_ii = sum av alle admittanser til buss i. Y_ij = −admittans mellom i og j.', category: 'Lastflyt' },
  { no: 'Mismatch', en: 'Power mismatch', symbol: 'ΔP, ΔQ', definition: 'Differanse mellom planlagt og beregnet effekt per buss. Newton-Raphson itererer til |ΔP|, |ΔQ| < ε (konvergenskriterium).', category: 'Lastflyt' },
  { no: 'Kortslutningsstrøm', en: 'Short-circuit current', symbol: 'Ik', definition: 'Strøm ved kortslutning. Dimensjonerer bryterevne og vern. Trefaset Ik3p = c·Un/(√3·Zk).', category: 'Kortslutning' },
  { no: 'Thévenin-ekvivalent', en: 'Thévenin equivalent', symbol: 'Z_th', definition: 'Nettverket sett fra et punkt forenklet til én spenningskilde og én impedans. Brukes i kortslutningsberegning.', category: 'Kortslutning' },
  { no: 'Bryterevne', en: 'Breaking capacity', symbol: 'I_cb', definition: 'Høyeste kortslutningsstrøm en sikring eller bryter kan slukke uten skade. Iht. IEC 60909.', category: 'Kortslutning' },
  { no: 'Overstrømsvern', en: 'Overcurrent protection relay', symbol: 'OC', definition: 'Vern som løser ut når strøm overstiger innstillingsverdi Is innen beregningstid t.', category: 'Vern' },
  { no: 'IDMT-karakteristikk', en: 'IDMT curve (Inverse Definite Minimum Time)', symbol: 'TMS, Is', definition: 'Utløsningstid er invers proporsjonal med overstrøm. Normal invers: t = TMS·0.14/((I/Is)^0.02−1). IEC 60255-151.', category: 'Vern' },
  { no: 'Selektivitet', en: 'Selectivity / Discrimination', definition: 'Vernhierarkiet sikrer at nærmeste vern alltid løser ut først. Sikrer at minst mulig del av nettet kobles ut.', category: 'Vern' },
  { no: 'TMS', en: 'Time Multiplier Setting', symbol: 'TMS', definition: 'Innstillingsparameter som skalerer IDMT-kurven. Høy TMS → lengre utløsningstid. Typisk 0.05–1.2.', category: 'Vern' },
  { no: 'Spenningsfall', en: 'Voltage drop', symbol: 'ΔU', definition: 'Spenningsreduksjon langs en linje pga. motstand og reaktans. ΔU = √3·I·(R·cosφ+X·sinφ)·L. Grense ±5% iht. IEC 60038.', category: 'Spenning' },
  { no: 'Effektfaktor', en: 'Power factor', symbol: 'cosφ', definition: 'Forhold mellom aktiv og tilsynelatende effekt. cosφ = P/|S|. Lav cosφ → mye reaktiv strøm → tap og spenningsfall.', category: 'Generelt' },
  { no: 'Reaktiv effekt', en: 'Reactive power', symbol: 'Q [kVAr, MVAr]', definition: 'Effekt som oscillerer frem og tilbake mellom kilde og last. Gjør ikke nyttig arbeid, men belaster kabler og transformatorer.', category: 'Generelt' },
  { no: 'Fasekompensering', en: 'Power factor correction', symbol: 'Q_c', definition: 'Kondensatorbatteri som leverer reaktiv effekt lokalt og reduserer reaktiv strøm i nettet. Q_c = P(tanφ₁−tanφ₂).', category: 'Kompensering' },
  { no: 'Petersen-spole', en: 'Petersen coil / Arc suppression coil', symbol: 'L_P', definition: 'Induktans koblet i nøytralpunktet. Kompenserer kapasitiv jordfeilstrøm. L_P = 1/(3ω²C₀). Brukes i IT-nett.', category: 'Jordfeil' },
  { no: 'IT-nett', en: 'IT system (isolated neutral)', definition: 'Nett med isolert nøytralpunkt. Ved første jordfeil er strømmen liten (kapasitiv). Driften kan fortsette. Brukes i industri og sykehus.', category: 'Jordfeil' },
  { no: 'TN-nett', en: 'TN system (solid earthed neutral)', definition: 'Nøytralledere jordet direkte. Ved jordfeil blir feilen kortslutning → vernet løser ut raskt. Vanligst i bygningsinstallasjoner.', category: 'Jordfeil' },
  { no: 'Kapasitetsfaktor', en: 'Capacity factor', symbol: 'CF', definition: 'Faktisk produsert energi delt på teoretisk maksimalproduksjon. CF_vind ≈ 0.25–0.45. CF_sol ≈ 0.10–0.20 (Norge).', category: 'Produksjon' },
  { no: 'Ringnett', en: 'Ring network / Loop network', definition: 'Nettopologi der last forsynes fra to sider. Gir N-1 redundans: én linje kan kobles ut uten at last mister forsyning.', category: 'Nett' },
  { no: 'Radialnett', en: 'Radial network', definition: 'Enklest nettopologi: treststruktur uten sløyfer. Lavere kostnad men ingen redundans. Vanlig i lavspent distribusjonsnett.', category: 'Nett' },
  { no: 'Per-unit system', en: 'Per-unit system', symbol: 'pu', definition: 'Normalisering der størrelser (U, I, S, Z) er oppgitt som andel av basisverdier. Forenkler beregning i nett med flere spenningsnivåer.', category: 'Generelt' },
];

const CATEGORIES = ['Alle', ...Array.from(new Set(TERMS.map((t) => t.category)))];

export function GlossaryPanel({ onClose }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Alle');

  const filtered = TERMS.filter((t) => {
    const matchCat = category === 'Alle' || t.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.no.toLowerCase().includes(q)
      || t.en.toLowerCase().includes(q)
      || t.definition.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

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
        <div style={{ fontSize: 13, fontWeight: 700, color: '#90CAF9' }}>📖 Fagordliste — {TERMS.length} begreper</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#607D8B', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      {/* Search + filter */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1E3A5F', background: '#0D1B2A', display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Søk etter begrep..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: '#0D2137',
            border: '1px solid #1E3A5F',
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '5px 10px',
            fontSize: 12,
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            background: '#0D2137',
            border: '1px solid #1E3A5F',
            borderRadius: 4,
            color: '#E8F0FE',
            padding: '5px 8px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Terms */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
        {filtered.length === 0 && (
          <div style={{ color: '#607D8B', fontSize: 12, textAlign: 'center', padding: 24 }}>
            Ingen treff for "{search}"
          </div>
        )}
        {filtered.map((t, i) => (
          <div
            key={i}
            style={{
              borderBottom: i < filtered.length - 1 ? '1px solid #112233' : 'none',
              padding: '10px 0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E8F0FE' }}>{t.no}</span>
              <span style={{ fontSize: 10, color: '#546E7A', background: '#0D2137', borderRadius: 3, padding: '1px 6px' }}>{t.category}</span>
            </div>
            <div style={{ fontSize: 11, color: '#4FC3F7', marginBottom: 4 }}>
              {t.en}
              {t.symbol && <span style={{ color: '#FFC107', marginLeft: 8, fontFamily: 'monospace' }}>{t.symbol}</span>}
            </div>
            <div style={{ fontSize: 12, color: '#90A4AE', lineHeight: 1.5 }}>{t.definition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
