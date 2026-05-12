import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { vToPU, pToPU, qToPU, iToPU } from '../../core/per-unit.js';
import { HelpIcon } from '../common/HelpIcon.js';

interface PerUnitPanelProps {
  onClose: () => void;
}

const HINT_TEXT =
  'Per-unit normaliserer alle verdier mot valgt base (S_base, U_base).\n' +
  'Det gjør det enklere å sammenligne nett av forskjellig størrelse.\n' +
  'Z_pu = Z_ohm · S_base / U_base². Spenninger over 1.0 pu er overspenning.';

export function PerUnitPanel({ onClose }: PerUnitPanelProps) {
  const project = useNetworkStore((s) => s.project);
  const pf = project.results.powerFlow;

  const [sBase, setSBase] = useState(project.system.sBaseMVA ?? 100);
  const [uBase, setUBase] = useState(22);
  const [showHint, setShowHint] = useState(true);

  const busResults = pf?.buses ?? [];
  const lineResults = pf?.lines ?? [];

  return (
    <div style={{
      background: '#0F1F30',
      border: '1px solid #1E3A5F',
      borderRadius: 8,
      padding: '16px 20px',
      width: 380,
      maxHeight: 520,
      overflowY: 'auto',
      color: '#E8F0FE',
      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, color: '#80CBC4', fontSize: 13 }}>∿ Per-unit visning</span>
          <HelpIcon title="Per-unit" text={"Z_base = U_base² / S_base\nZ_pu = Z_ohm / Z_base\nStandard: S=100 MVA, U=22 kV"} />
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 15 }}>✕</button>
      </div>

      {/* Pedagogisk hint */}
      {showHint && (
        <div style={{
          background: '#0D2A1A', border: '1px solid #2E7D32', borderRadius: 6,
          padding: '10px 12px', marginBottom: 12, fontSize: 11, color: '#A5D6A7', lineHeight: 1.6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ whiteSpace: 'pre-line' }}>{HINT_TEXT}</span>
            <button
              onClick={() => setShowHint(false)}
              style={{ background: 'none', border: 'none', color: '#4CAF50', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Base-innstillinger */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#9E9E9E', marginBottom: 3 }}>S_base [MVA]</div>
          <input
            type="number"
            value={sBase}
            onChange={(e) => setSBase(Number(e.target.value) || 100)}
            style={{
              width: '100%', background: '#1A2A3A', border: '1px solid #374151',
              borderRadius: 4, color: '#E8F0FE', padding: '5px 8px', fontSize: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#9E9E9E', marginBottom: 3 }}>U_base [kV]</div>
          <input
            type="number"
            value={uBase}
            onChange={(e) => setUBase(Number(e.target.value) || 22)}
            style={{
              width: '100%', background: '#1A2A3A', border: '1px solid #374151',
              borderRadius: 4, color: '#E8F0FE', padding: '5px 8px', fontSize: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {!pf && (
        <div style={{ color: '#607D8B', fontSize: 12, padding: '12px 0' }}>
          Kjør lastflyt for å se per-unit resultater.
        </div>
      )}

      {/* Buss-resultater i pu */}
      {busResults.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#80CBC4', fontWeight: 700, marginBottom: 6 }}>BUSSER — per-unit</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Buss', 'U [pu]', 'δ [°]', 'P [pu]', 'Q [pu]'].map((h) => (
                  <th key={h} style={{ padding: '4px 6px', color: '#80CBC4', fontWeight: 600, textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {busResults.map((r) => {
                const bus = project.buses.find((b) => b.id === r.busId);
                const vPU = vToPU(r.vMagKV, uBase);
                const pPU = pToPU(r.pMW, sBase);
                const qPU = qToPU(r.qMVAr, sBase);
                const isOverV = vPU > 1.05;
                const isUnderV = vPU < 0.95;
                return (
                  <tr key={r.busId} style={{ background: 'transparent' }}>
                    <td style={{ padding: '3px 6px', color: '#E8F0FE' }}>{bus?.name ?? r.busId}</td>
                    <td style={{
                      padding: '3px 6px',
                      color: isOverV ? '#EF5350' : isUnderV ? '#FFA726' : '#81C784',
                      fontWeight: 600,
                    }}>
                      {vPU.toFixed(4)}
                      {isOverV && ' ▲'}
                      {isUnderV && ' ▼'}
                    </td>
                    <td style={{ padding: '3px 6px', color: '#B0BEC5' }}>{r.vAngDeg.toFixed(3)}</td>
                    <td style={{ padding: '3px 6px', color: '#80CBC4' }}>{pPU.toFixed(4)}</td>
                    <td style={{ padding: '3px 6px', color: '#80CBC4' }}>{qPU.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Linje-resultater i pu */}
      {lineResults.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: '#80CBC4', fontWeight: 700, marginBottom: 6 }}>LINJER — per-unit</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#0D1B2A' }}>
                {['Linje', 'I [pu]', 'P_fra [pu]', 'Tap [pu]'].map((h) => (
                  <th key={h} style={{ padding: '4px 6px', color: '#80CBC4', fontWeight: 600, textAlign: 'left', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineResults.map((r) => {
                const line = project.lines.find((l) => l.id === r.lineId);
                const iPU = iToPU(r.currentKA * 1000, sBase, uBase);
                const pPU = pToPU(r.pFromMW, sBase);
                const lossPU = pToPU(r.lossesActiveMW, sBase);
                return (
                  <tr key={r.lineId}>
                    <td style={{ padding: '3px 6px', color: '#E8F0FE' }}>{line?.name ?? r.lineId}</td>
                    <td style={{ padding: '3px 6px', color: '#80CBC4' }}>{iPU.toFixed(4)}</td>
                    <td style={{ padding: '3px 6px', color: '#80CBC4' }}>{pPU.toFixed(4)}</td>
                    <td style={{ padding: '3px 6px', color: '#FFA726' }}>{lossPU.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Z_base info */}
      <div style={{ marginTop: 12, padding: '8px 10px', background: '#1A2A3A', borderRadius: 5, fontSize: 10, color: '#607D8B' }}>
        Z_base = U²_base / S_base = {uBase}² / {sBase} = {((uBase ** 2) / sBase).toFixed(4)} Ω
        <br />
        I_base = S_base / (√3 · U_base) = {((sBase * 1e6) / (Math.sqrt(3) * uBase * 1e3)).toFixed(1)} A
      </div>
    </div>
  );
}
