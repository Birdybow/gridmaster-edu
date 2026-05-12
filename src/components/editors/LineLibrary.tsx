export interface LibraryCable {
  id: string;
  label: string;
  type: 'overhead' | 'cable';
  rOhmPerKm: number;
  xOhmPerKm: number;
  bMuSPerKm: number;
  iMaxA: number;
}

export const LINE_LIBRARY: LibraryCable[] = [
  { id: 'feal50', label: 'FeAl 50mm² luftlinje', type: 'overhead', rOhmPerKm: 0.570, xOhmPerKm: 0.350, bMuSPerKm: 2.8, iMaxA: 130 },
  { id: 'feal95', label: 'FeAl 95mm² luftlinje', type: 'overhead', rOhmPerKm: 0.300, xOhmPerKm: 0.330, bMuSPerKm: 2.9, iMaxA: 220 },
  { id: 'feal150', label: 'FeAl 150mm² luftlinje', type: 'overhead', rOhmPerKm: 0.200, xOhmPerKm: 0.310, bMuSPerKm: 3.0, iMaxA: 310 },
  { id: 'tslf95', label: 'TSLF 22kV 3×1×95 Al', type: 'cable', rOhmPerKm: 0.320, xOhmPerKm: 0.110, bMuSPerKm: 150, iMaxA: 230 },
  { id: 'tslf150', label: 'TSLF 22kV 3×1×150 Al', type: 'cable', rOhmPerKm: 0.206, xOhmPerKm: 0.106, bMuSPerKm: 160, iMaxA: 305 },
  { id: 'tslf240', label: 'TSLF 22kV 3×1×240 Al', type: 'cable', rOhmPerKm: 0.125, xOhmPerKm: 0.100, bMuSPerKm: 175, iMaxA: 410 },
];

interface Props {
  currentType: 'overhead' | 'cable';
  onSelect: (cable: LibraryCable) => void;
}

export function LineLibrary({ currentType, onSelect }: Props) {
  const filtered = LINE_LIBRARY.filter((c) => c.type === currentType);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>
        Linjebibliotek
      </div>
      <select
        defaultValue=""
        onChange={(e) => {
          const cable = LINE_LIBRARY.find((c) => c.id === e.target.value);
          if (cable) onSelect(cable);
          e.target.value = '';
        }}
        style={{
          width: '100%',
          background: '#131F2E',
          border: '1px solid #1E3A5F',
          borderRadius: 4,
          color: '#E8F0FE',
          padding: '4px 8px',
          fontSize: 12,
        }}
      >
        <option value="" disabled>Velg standardkabel...</option>
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} (I_max {c.iMaxA} A)
          </option>
        ))}
      </select>
      <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
        💡 Velg fra bibliotek for å fylle R, X og B automatisk
      </div>
    </div>
  );
}
