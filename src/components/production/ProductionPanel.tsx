import { useNetworkStore } from '../../store/useNetworkStore.js';
import { HydroEditor } from './HydroEditor.js';
import { WindEditor } from './WindEditor.js';
import { SolarEditor } from './SolarEditor.js';
import { NuclearEditor } from './NuclearEditor.js';
import type { Generator } from '../../types/index.js';
import { calcHydro, calcWind, calcSolar, calcNuclear } from '../../core/production.js';

export function calcGeneratorP(gen: Generator): number {
  if (gen.generatorType === 'hydro_francis' || gen.generatorType === 'hydro_pelton' || gen.generatorType === 'hydro_kaplan') {
    const defaults = { hydro_francis: { H: 200, Q: 50, eta: 92 }, hydro_pelton: { H: 600, Q: 10, eta: 90 }, hydro_kaplan: { H: 20, Q: 200, eta: 91 } };
    const d = defaults[gen.generatorType];
    return calcHydro(gen.headM ?? d.H, gen.flowM3s ?? d.Q, (gen.efficiencyPct ?? d.eta) / 100);
  }
  if (gen.generatorType === 'wind') {
    const vci = gen.cutInMs ?? 3, vr = gen.ratedWindMs ?? 13, vco = gen.cutOutMs ?? 25;
    return calcWind(vr, vci, vr, vco, gen.windRatedMW ?? gen.ratedMVA, gen.numTurbines ?? 1);
  }
  if (gen.generatorType === 'solar') {
    return calcSolar(gen.solarPeakMW ?? gen.ratedMVA, gen.solarHour ?? 13);
  }
  return calcNuclear(gen.ratedMVA * ((gen.utilizationPct ?? 100) / 100));
}

export function ProductionPanel() {
  const selectedNodeId = useNetworkStore((s) => s.selectedNodeId);
  const generators = useNetworkStore((s) => s.project.generators);
  const buses = useNetworkStore((s) => s.project.buses);
  const runProduction = useNetworkStore((s) => s.runProduction);

  const gen = generators.find((g) => g.busId === selectedNodeId);
  const bus = buses.find((b) => b.id === selectedNodeId);

  if (!gen || !bus || (bus.type !== 'PV' && bus.type !== 'slack')) return null;

  const pPreview = calcGeneratorP(gen);

  function renderEditor() {
    if (!gen) return null;
    const t = gen.generatorType;
    if (t === 'hydro_francis' || t === 'hydro_pelton' || t === 'hydro_kaplan') return <HydroEditor gen={gen} />;
    if (t === 'wind') return <WindEditor gen={gen} />;
    if (t === 'solar') return <SolarEditor gen={gen} />;
    return <NuclearEditor gen={gen} />;
  }

  return (
    <div style={{ borderTop: '1px solid #1E3A5F' }}>
      <div
        style={{
          padding: '6px 14px',
          background: '#0F1F2E',
          borderBottom: '1px solid #1E3A5F',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#4FC3F7' }}>⚡ Produksjonspanel</span>
        <span style={{ fontSize: 11, color: '#66BB6A', fontWeight: 600 }}>~{pPreview.toFixed(1)} MW</span>
      </div>

      {renderEditor()}

      <div style={{ padding: '0 14px 14px' }}>
        <button
          onClick={runProduction}
          style={{
            width: '100%',
            background: '#0F3B55',
            border: '1px solid #4FC3F7',
            borderRadius: 5,
            color: '#4FC3F7',
            padding: '7px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ⚡ Beregn produksjon + kjør lastflyt
        </button>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 4, textAlign: 'center' }}>
          Oppdaterer P_satt på alle generatorer og kjører Newton-Raphson
        </div>
      </div>
    </div>
  );
}
