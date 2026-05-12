import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import type { NetworkType } from '../../types/index.js';

interface Props {
  onClose: () => void;
}

const NETWORK_TYPE_LABELS: Record<NetworkType, string> = {
  IT: 'IT-nett (isolert nøytralpunkt)',
  TN: 'TN-nett (jordet nøytralpunkt)',
  Petersen: 'Petersen-spolet (resonansjordet)',
};

const NETWORK_TYPE_DESC: Record<NetworkType, string> = {
  IT: 'Lav jordfeilstrøm (~12 A). Driften kan fortsette ved én jordfeil. Norsk tradisjon i høyspentnett.',
  TN: 'Høy jordfeilstrøm (~230 A). Rask utkobling kreves. Brukes i lavspentnett (230/400 V).',
  Petersen: 'Spolen kompenserer kapasitiv strøm. Reststrøm nær null ved full kompensasjon. Brukes i Europa.',
};

export function EarthFaultPanel({ onClose }: Props) {
  const buses = useNetworkStore((s) => s.project.buses);
  const networkType = useNetworkStore((s) => s.networkType);
  const setNetworkType = useNetworkStore((s) => s.setNetworkType);
  const selectedEarthFaultBusId = useNetworkStore((s) => s.selectedEarthFaultBusId);
  const runEarthFault = useNetworkStore((s) => s.runEarthFault);
  const clearEarthFault = useNetworkStore((s) => s.clearEarthFault);
  const efResult = useNetworkStore((s) => s.project.results.earthFault);

  const [localBusId, setLocalBusId] = useState<string>(selectedEarthFaultBusId ?? buses[0]?.id ?? '');
  const [localNetworkType, setLocalNetworkType] = useState<NetworkType>(networkType);

  const hasNetwork = buses.length >= 1;
  const canCompute = hasNetwork && localBusId;

  function handleCompute() {
    if (!localBusId) return;
    setNetworkType(localNetworkType);
    runEarthFault(localBusId, localNetworkType);
  }

  return (
    <div style={{ background: '#0D1B0D', border: '1px solid #2E7D32', borderRadius: 8 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: '#001A00',
          borderBottom: '1px solid #2E7D32',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#66BB6A' }}>
          ⏚ Jordfeilberegning
        </span>
        <button
          onClick={() => { clearEarthFault(); onClose(); }}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Network type selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>
            Netttype / nøytralbehandling
          </div>
          <select
            value={localNetworkType}
            onChange={(e) => setLocalNetworkType(e.target.value as NetworkType)}
            style={{
              width: '100%',
              background: '#131F0D',
              border: '1px solid #2E7D32',
              borderRadius: 4,
              color: '#E8F0FE',
              padding: '5px 8px',
              fontSize: 12,
            }}
          >
            {(Object.keys(NETWORK_TYPE_LABELS) as NetworkType[]).map((t) => (
              <option key={t} value={t}>{NETWORK_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <div style={{ fontSize: 10, color: '#558B2F', marginTop: 4, lineHeight: 1.4 }}>
            {NETWORK_TYPE_DESC[localNetworkType]}
          </div>
        </div>

        {/* Bus selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>
            Velg buss (feilsted)
          </div>
          <select
            value={localBusId}
            onChange={(e) => setLocalBusId(e.target.value)}
            style={{
              width: '100%',
              background: '#131F0D',
              border: '1px solid #2E7D32',
              borderRadius: 4,
              color: '#E8F0FE',
              padding: '5px 8px',
              fontSize: 12,
            }}
          >
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.voltageKV} kV)
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        {efResult && efResult.busId === localBusId && (
          <div
            style={{
              background: '#0A1F0A',
              border: '1px solid #388E3C',
              borderRadius: 4,
              padding: '10px 12px',
              marginBottom: 12,
              fontSize: 12,
            }}
          >
            <div style={{ color: '#66BB6A', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>
              ⏚ Jordfeilresultat — {NETWORK_TYPE_LABELS[efResult.networkType]}
            </div>
            <div style={{ color: '#A5D6A7', marginBottom: 3 }}>
              <span style={{ color: '#9E9E9E' }}>Jordfeilstrøm:</span>{' '}
              <strong>{efResult.earthFaultCurrentA.toFixed(2)} A</strong>
            </div>
            {efResult.petersenCoilH !== undefined && (
              <div style={{ color: '#A5D6A7', marginBottom: 3 }}>
                <span style={{ color: '#9E9E9E' }}>Petersen-spole:</span>{' '}
                <strong>L = {efResult.petersenCoilH.toFixed(3)} H</strong>
              </div>
            )}
            {efResult.residualCurrentA !== undefined && (
              <div style={{ color: '#A5D6A7' }}>
                <span style={{ color: '#9E9E9E' }}>Reststrøm (k=1):</span>{' '}
                <strong>{efResult.residualCurrentA.toFixed(4)} A</strong>
              </div>
            )}
          </div>
        )}

        {!hasNetwork && (
          <div style={{ color: '#EF9A9A', fontSize: 11, marginBottom: 8 }}>
            ⚠ Legg til minst én buss for å beregne jordfeil.
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { clearEarthFault(); onClose(); }}
            style={{
              background: '#E65100',
              border: '1px solid #BF360C',
              borderRadius: 4,
              color: '#fff',
              padding: '7px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            🗑 Nullstill
          </button>
          <button
            onClick={handleCompute}
            disabled={!canCompute}
            style={{
              flex: 1,
              background: canCompute ? '#2E7D32' : '#1A1A1A',
              border: `1px solid ${canCompute ? '#66BB6A' : '#333'}`,
              borderRadius: 4,
              color: canCompute ? '#C8E6C9' : '#555',
              padding: '7px 0',
              cursor: canCompute ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Beregn jordfeilstrøm
          </button>
        </div>
      </div>
    </div>
  );
}
