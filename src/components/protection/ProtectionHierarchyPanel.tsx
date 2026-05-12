import { useNetworkStore } from '../../store/useNetworkStore.js';
import { getBusName } from '../../utils/display.js';
import { calcTripTime } from '../../core/protection.js';
import type { OcCurve } from '../../types/index.js';

interface HNode {
  lineId: string;
  lineName: string;
  fromBus: string;
  toBus: string;
  hasProt: boolean;
  protName: string;
  tMs: number | null;
  sensitive: boolean | null;
  selective: boolean | null;
  depth: number;
}

export function ProtectionHierarchyPanel({ onClose }: { onClose: () => void }) {
  const buses = useNetworkStore((s) => s.project.buses);
  const lines = useNetworkStore((s) => s.project.lines);
  const protections = useNetworkStore((s) => s.project.protections);
  const scResults = useNetworkStore((s) => s.project.results.shortCircuit);
  const selectivityResults = useNetworkStore((s) => s.selectivityResults);

  const slackBus = buses.find((b) => b.type === 'slack');

  const hierarchy: HNode[] = [];

  // BFS from slack bus; fall back to flat list over all lines when no slack bus
  const startBusId = slackBus?.id ?? null;
  const visited = new Set<string>();
  const queue: Array<{ busId: string; depth: number }> = startBusId
    ? [{ busId: startBusId, depth: 0 }]
    : [];
  if (startBusId) visited.add(startBusId);

  // Flat fallback: enqueue all buses when no slack bus
  if (!startBusId && buses.length > 0) {
    for (const bus of buses) {
      if (!visited.has(bus.id)) { visited.add(bus.id); queue.push({ busId: bus.id, depth: 0 }); }
    }
  }

  if (queue.length > 0) {
    while (queue.length > 0) {
      const { busId, depth } = queue.shift()!;
      const outLines = lines.filter(
        (l) => (l.fromBusId === busId || l.toBusId === busId) &&
               !visited.has(l.fromBusId === busId ? l.toBusId : l.fromBusId),
      );

      for (const line of outLines) {
        const nextBusId = line.fromBusId === busId ? line.toBusId : line.fromBusId;
        const prot = protections.find((p) => p.protectedLineId === line.id);
        const scResult = scResults?.find((r) => r.busId === nextBusId);
        const ikA = scResult ? scResult.ik3pMinKA * 1000 : null;

        let tMs: number | null = null;
        let sensitive: boolean | null = null;
        if (prot && ikA !== null) {
          const tms = prot.tms ?? 0.1;
          const curve = (prot.curve ?? 'standard_inverse') as OcCurve;
          const t = calcTripTime(tms, prot.pickupCurrentA, ikA, curve);
          tMs = isFinite(t) ? t * 1000 : null;
          sensitive = prot.pickupCurrentA < ikA;
        }

        let selective: boolean | null = null;
        if (prot) {
          const sel = selectivityResults.find((r) => r.prot1Id === prot.id || r.prot2Id === prot.id);
          if (sel) selective = sel.selective;
        }

        hierarchy.push({
          lineId: line.id,
          lineName: line.name,
          fromBus: getBusName(line.fromBusId, buses),
          toBus: getBusName(line.toBusId, buses),
          hasProt: !!prot,
          protName: prot?.name ?? '',
          tMs,
          sensitive,
          selective,
          depth,
        });

        visited.add(nextBusId);
        queue.push({ busId: nextBusId, depth: depth + 1 });
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        left: 16,
        width: 280,
        background: '#0F1F30',
        border: '1px solid #1E3A5F',
        borderRadius: 8,
        boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid #1E3A5F',
        }}
      >
        <span style={{ color: '#4FC3F7', fontWeight: 700, fontSize: 13 }}>🛡 Vernhierarki</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#607D8B', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '10px 14px', maxHeight: 420, overflowY: 'auto' }}>
        {slackBus ? (
          <div style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            ⚡ {slackBus.name} (kilde)
          </div>
        ) : lines.length > 0 ? (
          <div style={{ color: '#FFB74D', fontSize: 10, marginBottom: 8 }}>
            ⚠ Ingen slack-buss — viser alle linjer
          </div>
        ) : null}

        {hierarchy.length === 0 && lines.length === 0 && (
          <div style={{ color: '#607D8B', fontSize: 11 }}>Ingen linjer i nettet.</div>
        )}
        {hierarchy.length === 0 && lines.length > 0 && (
          <div style={{ color: '#607D8B', fontSize: 11 }}>Ingen linjer koblet til nettverket.</div>
        )}

        {hierarchy.map((node) => {
          const borderColor =
            node.selective === false ? '#EF5350' :
            node.selective === true ? '#4CAF50' : '#1E3A5F';

          return (
            <div key={node.lineId} style={{ marginLeft: node.depth * 14, marginBottom: 6 }}>
              <div style={{ color: '#263A50', fontSize: 10, lineHeight: 1 }}>└──</div>
              {node.hasProt ? (
                <div
                  style={{
                    background: '#0A1520',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    marginTop: 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#4FC3F7', fontSize: 10 }}>🛡 {node.protName}</span>
                    {node.selective !== null && (
                      <span style={{ fontSize: 10, color: node.selective ? '#4CAF50' : '#EF5350' }}>
                        {node.selective ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#607D8B', fontSize: 9 }}>{node.fromBus} → {node.toBus}</div>
                  {node.tMs !== null && (
                    <div style={{ color: '#81C784', fontSize: 9 }}>t = {(node.tMs / 1000).toFixed(3)} s</div>
                  )}
                  {node.sensitive === false && (
                    <div style={{ color: '#EF5350', fontSize: 9 }}>⚠ Ikke følsom nok</div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#607D8B', fontSize: 10, paddingLeft: 4 }}>
                  〰 {node.lineName}
                  <span style={{ color: '#37474F', marginLeft: 4 }}>(uten vern)</span>
                </div>
              )}
              <div style={{ color: '#546E7A', fontSize: 9, paddingLeft: 8, marginTop: 1 }}>
                🔌 {node.toBus}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
