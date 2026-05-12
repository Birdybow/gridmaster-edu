import { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore.js';

interface Props {
  onClose: () => void;
}

export function ShortCircuitPanel({ onClose }: Props) {
  const buses = useNetworkStore((s) => s.project.buses);
  const generators = useNetworkStore((s) => s.project.generators);
  const selectedFaultBusId = useNetworkStore((s) => s.selectedFaultBusId);
  const setSelectedFaultBusId = useNetworkStore((s) => s.setSelectedFaultBusId);
  const runShortCircuit = useNetworkStore((s) => s.runShortCircuit);
  const clearShortCircuit = useNetworkStore((s) => s.clearShortCircuit);

  const [localBusId, setLocalBusId] = useState<string>(selectedFaultBusId ?? buses[0]?.id ?? '');

  const hasGenerators = generators.length > 0;
  const hasNetwork = buses.length >= 2;
  const canCompute = hasGenerators && hasNetwork && localBusId;

  function handleCompute() {
    if (!localBusId) return;
    runShortCircuit(localBusId);
  }

  return (
    <div style={{ background: '#0D1B2A', border: '1px solid #B71C1C', borderRadius: 8 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: '#1A0000',
          borderBottom: '1px solid #B71C1C',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#EF5350' }}>
          ⚡ Kortslutningsberegning (IEC 60909)
        </span>
        <button
          onClick={() => { clearShortCircuit(); onClose(); }}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Fault bus selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600, marginBottom: 4 }}>
            Velg feilsted (buss)
          </div>
          <select
            value={localBusId}
            onChange={(e) => {
              setLocalBusId(e.target.value);
              setSelectedFaultBusId(e.target.value);
            }}
            style={{
              width: '100%',
              background: '#131F2E',
              border: '1px solid #B71C1C',
              borderRadius: 4,
              color: '#E8F0FE',
              padding: '5px 8px',
              fontSize: 12,
            }}
          >
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.voltageKV} kV — {b.type})
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>
            💡 Bussnoden der kortslutning oppstår
          </div>
        </div>

        {/* Method info */}
        <div
          style={{
            background: '#0A1520',
            border: '1px solid #1E3A5F',
            borderRadius: 4,
            padding: '8px 10px',
            marginBottom: 12,
            fontSize: 11,
            color: '#607D8B',
          }}
        >
          <div style={{ color: '#4FC3F7', fontWeight: 600, marginBottom: 4 }}>Metode: IEC 60909</div>
          <div>c_maks = 1.10  •  c_min = 1.00</div>
          <div>Subtransient reaktans x″d fra generatordata</div>
          <div>Z-buss inversjon via Thevenin-ekvivalent</div>
        </div>

        {/* Warnings */}
        {!hasGenerators && (
          <div style={{ color: '#EF9A9A', fontSize: 11, marginBottom: 8 }}>
            ⚠ Ingen generatorer i nettet. Legg til en generator for å beregne kortslutningsstrøm.
          </div>
        )}
        {!hasNetwork && (
          <div style={{ color: '#EF9A9A', fontSize: 11, marginBottom: 8 }}>
            ⚠ Minst 2 busser og 1 linje kreves.
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { clearShortCircuit(); onClose(); }}
            style={{
              background: '#1A1A1A',
              border: '1px solid #37474F',
              borderRadius: 4,
              color: '#607D8B',
              padding: '7px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Nullstill
          </button>
          <button
            onClick={handleCompute}
            disabled={!canCompute}
            style={{
              flex: 1,
              background: canCompute ? '#B71C1C' : '#1A1A1A',
              border: `1px solid ${canCompute ? '#EF5350' : '#333'}`,
              borderRadius: 4,
              color: canCompute ? '#FFCDD2' : '#555',
              padding: '7px 0',
              cursor: canCompute ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Beregn kortslutningsstrøm
          </button>
        </div>
      </div>
    </div>
  );
}
