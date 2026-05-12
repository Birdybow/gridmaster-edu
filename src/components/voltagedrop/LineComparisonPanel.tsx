import { useMemo } from 'react';
import { calcVoltageDrop, calcVoltageDropPi } from '../../core/voltage-drop.js';
import { useNetworkStore } from '../../store/useNetworkStore.js';

// Reference cable parameters per spec
const OVERHEAD_REF = { r: 0.30, x: 0.35, b: 2.8e-6,  label: 'Luftlinje FeAl 95mm²' };
const CABLE_REF    = { r: 0.206, x: 0.106, b: 160e-6, label: 'Jordkabel TSLF 150mm²' };

const REN_GREEN = 5;
const REN_YELLOW = 10;
function statusColor(pct: number) {
  if (pct < REN_GREEN) return '#4CAF50';
  if (pct < REN_YELLOW) return '#FFB74D';
  return '#EF5350';
}

interface Props {
  lineId: string;
}

export function LineComparisonPanel({ lineId }: Props) {
  const lines = useNetworkStore((s) => s.project.lines);
  const buses = useNetworkStore((s) => s.project.buses);
  const pfResult = useNetworkStore((s) => s.project.results.powerFlow);
  const voltageDropModel = useNetworkStore((s) => s.voltageDropModel);

  const line = lines.find((l) => l.id === lineId);
  const lineResult = pfResult?.lines.find((lr) => lr.lineId === lineId);

  const comparison = useMemo(() => {
    if (!line || !lineResult) return null;
    const fromBus = buses.find((b) => b.id === line.fromBusId);
    if (!fromBus) return null;

    const Un = fromBus.voltageKV * 1000;
    const len = line.lengthKm;
    const useSimple = voltageDropModel === 'simple' || (voltageDropModel === 'auto' && len < 50);

    const S = Math.sqrt(lineResult.pFromMW ** 2 + lineResult.qFromMVAr ** 2);
    const cosPhi = S > 0 ? Math.abs(lineResult.pFromMW) / S : 1;
    const I = lineResult.currentKA * 1000;
    const fromBusResult = pfResult?.buses.find((br) => br.busId === line.fromBusId);
    const Vs = fromBusResult ? fromBusResult.vMagKV * 1000 : Un;
    const P = lineResult.pFromMW * 1e6;
    const Q = lineResult.qFromMVAr * 1e6;

    function calc(ref: typeof OVERHEAD_REF) {
      const R = ref.r * len;
      const X = ref.x * len;
      const B = ref.b * len;
      if (useSimple) return calcVoltageDrop(I, R, X, cosPhi, Un);
      return calcVoltageDropPi(P, Q, Vs, R, X, B, Un);
    }

    return {
      overhead: calc(OVERHEAD_REF),
      cable: calc(CABLE_REF),
      len,
      Un,
      model: useSimple ? 'Enkel modell' : 'Pi-modell',
    };
  }, [line, lineResult, buses, pfResult, voltageDropModel]);

  if (!line) return null;
  if (!pfResult || !pfResult.converged) {
    return (
      <div style={{ padding: '10px 14px', fontSize: 11, color: '#607D8B' }}>
        Kjør lastflyt for å sammenligne trasevalg.
      </div>
    );
  }
  if (!comparison) return null;

  const { overhead, cable } = comparison;
  const betterLabel = overhead.deltaUPercent <= cable.deltaUPercent ? 'Luftlinje' : 'Jordkabel';
  const betterColor = overhead.deltaUPercent <= cable.deltaUPercent ? '#1565C0' : '#00796B';

  return (
    <div style={{ padding: '10px 14px', borderTop: '1px solid #1E3A5F' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9E9E', marginBottom: 8 }}>
        TRASESAMMENLIGNING — {comparison.model}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { ref: OVERHEAD_REF, res: overhead, accent: '#1565C0' },
          { ref: CABLE_REF,    res: cable,    accent: '#00796B' },
        ].map(({ ref, res, accent }) => (
          <div
            key={ref.label}
            style={{
              background: '#0A1520',
              border: `1px solid ${accent}`,
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 10, color: accent, fontWeight: 700, marginBottom: 4 }}>
              {ref.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: statusColor(res.deltaUPercent) }}>
              {res.deltaUPercent.toFixed(2)}%
            </div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>ΔU = {res.deltaUVolts.toFixed(0)} V</div>
            <div style={{ fontSize: 10, color: '#607D8B' }}>U_mot = {res.uReceivingKV.toFixed(3)} kV</div>
            <div style={{ fontSize: 10, color: '#4A5568', marginTop: 4 }}>
              r={ref.r} x={ref.x} b={ref.b * 1e6} μS/km
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          padding: '5px 8px',
          background: `${betterColor}22`,
          border: `1px solid ${betterColor}`,
          borderRadius: 4,
          color: betterColor,
        }}
      >
        💡 <strong>{betterLabel}</strong> gir lavest spenningsfall for denne traséen.
        {overhead.deltaUPercent > cable.deltaUPercent &&
          ' Jordkabel har lavere reaktans (X), men høyere kapasitans (B) — fordelaktig på kortere strekk.'}
        {overhead.deltaUPercent <= cable.deltaUPercent &&
          ' Luftlinje er tilstrekkelig her. Jordkabel kan vurderes ved krav om lavere EMF eller økt kapasitet.'}
      </div>
    </div>
  );
}
