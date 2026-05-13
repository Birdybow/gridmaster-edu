import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import type { Node, Edge, ReactFlowInstance, Connection, NodeMouseHandler } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { BusNode } from './BusNode.js';
import { LineEdge } from './LineEdge.js';
import { CompensatorNode } from './CompensatorNode.js';
import { CompensatorLinkEdge } from './CompensatorLinkEdge.js';
import type { Bus, Line, Transformer, Compensator, OcCurve } from '../../types/index.js';
import { calcTripTime } from '../../core/protection.js';
import { PALETTE, DRAG_TYPE } from '../builder/ComponentPalette.js';

// Module-level constants — never recreated
const nodeTypes = { busNode: BusNode, compensatorNode: CompensatorNode };
const edgeTypes = { lineEdge: LineEdge, compensatorLink: CompensatorLinkEdge };

function busToNode(bus: Bus, selectedNodeId: string | null): Node {
  return {
    id: bus.id,
    type: 'busNode',
    position: bus.position,
    data: bus,
    selected: bus.id === selectedNodeId,
  };
}

function lineToEdge(
  line: Line,
  selectedEdgeId: string | null,
  voltageDropPct?: number,
  flowCurrentA?: number,
  loadingPercent?: number,
  showFlow?: boolean,
  protectionStatus?: 'ok' | 'warning' | 'error' | 'present',
  protTripTimeS?: number,
  isOpposing?: boolean,
): Edge {
  return {
    id: line.id,
    source: line.fromBusId,
    target: line.toBusId,
    type: 'lineEdge',
    data: { ...line, label: line.name, voltageDropPct, flowCurrentA, loadingPercent, showFlow, protectionStatus, protTripTimeS, isOpposing },
    selected: line.id === selectedEdgeId,
  };
}

function compensatorToNode(c: Compensator, buses: Bus[], selectedNodeId: string | null): Node {
  const bus = buses.find((b) => b.id === c.busId);
  const position = bus
    ? { x: bus.position.x + 140, y: bus.position.y - 20 }
    : { x: 200, y: 200 };
  return {
    id: `comp_${c.id}`,
    type: 'compensatorNode',
    position,
    data: c,
    selected: `comp_${c.id}` === selectedNodeId,
  };
}

function trafoToEdge(t: Transformer, selectedEdgeId: string | null): Edge {
  return {
    id: t.id,
    source: t.fromBusId,
    target: t.toBusId,
    type: 'lineEdge',
    data: { name: t.name, label: t.name, lineType: 'cable' },
    selected: t.id === selectedEdgeId,
  };
}

interface ContextMenu {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
}

export function NetworkCanvas() {
  const buses = useNetworkStore((s) => s.project.buses);
  const lines = useNetworkStore((s) => s.project.lines);
  const transformers = useNetworkStore((s) => s.project.transformers);
  const compensators = useNetworkStore((s) => s.project.compensators);
  const protections = useNetworkStore((s) => s.project.protections);
  const voltageDropResults = useNetworkStore((s) => s.project.results.voltageDrop);
  const powerFlowResult = useNetworkStore((s) => s.project.results.powerFlow);
  const showFlowDirections = useNetworkStore((s) => s.showFlowDirections);
  const scResults = useNetworkStore((s) => s.project.results.shortCircuit);
  const selectedNodeId = useNetworkStore((s) => s.selectedNodeId);
  const selectedEdgeId = useNetworkStore((s) => s.selectedEdgeId);
  const lineDrawingMode = useNetworkStore((s) => s.lineDrawingMode);
  const lineDrawingFromId = useNetworkStore((s) => s.lineDrawingFromId);
  const placingMode = useNetworkStore((s) => s.placingMode);

  const setSelectedNodeId = useNetworkStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useNetworkStore((s) => s.setSelectedEdgeId);
  const setLineDrawingMode = useNetworkStore((s) => s.setLineDrawingMode);
  const setLineDrawingFromId = useNetworkStore((s) => s.setLineDrawingFromId);
  const setPlacingMode = useNetworkStore((s) => s.setPlacingMode);
  const addBusAtPosition = useNetworkStore((s) => s.addBusAtPosition);
  const addLineFromConnect = useNetworkStore((s) => s.addLineFromConnect);
  const addTransformerFromConnect = useNetworkStore((s) => s.addTransformerFromConnect);
  const addGeneratorToBus = useNetworkStore((s) => s.addGeneratorToBus);
  const addCompensatorToBus = useNetworkStore((s) => s.addCompensatorToBus);
  const deleteNode = useNetworkStore((s) => s.deleteNode);
  const deleteEdge = useNetworkStore((s) => s.deleteEdge);
  const updateBus = useNetworkStore((s) => s.updateBus);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const nodes: Node[] = useMemo(
    () => [
      ...buses.map((b) => busToNode(b, selectedNodeId)),
      ...compensators.map((c) => compensatorToNode(c, buses, selectedNodeId)),
    ],
    [buses, compensators, selectedNodeId],
  );

  // Detect "opposing" lines automatically: a line with reversed NR current that is
  // part of a ring (an alternative path exists between its endpoints). BFS is cheap
  // for the small networks GridMaster handles (typically < 20 buses).
  const ringOpposingSet = useMemo(() => {
    const s = new Set<string>();
    if (!powerFlowResult?.converged) return s;
    for (const line of lines) {
      const flr = powerFlowResult.lines.find((r) => r.lineId === line.id);
      if (!flr) continue;
      const nrCurrentA = flr.currentKA * 1000;
      if (nrCurrentA >= -0.1) continue; // only candidate if current is reversed
      // BFS: can we reach toBusId from fromBusId without this line?
      const target = line.toBusId;
      const visited = new Set<string>();
      const queue = [line.fromBusId];
      let found = false;
      while (queue.length > 0 && !found) {
        const curr = queue.shift()!;
        if (curr === target) { found = true; break; }
        if (visited.has(curr)) continue;
        visited.add(curr);
        for (const l of lines) {
          if (l.id === line.id) continue;
          if (l.fromBusId === curr && !visited.has(l.toBusId)) queue.push(l.toBusId);
          if (l.toBusId === curr && !visited.has(l.fromBusId)) queue.push(l.fromBusId);
        }
      }
      if (found) s.add(line.id);
    }
    return s;
  }, [powerFlowResult, lines]);

  const edges: Edge[] = useMemo(
    () => [
      ...lines.map((l) => {
        const vdr = voltageDropResults?.find((r) => r.lineId === l.id);
        const flr = powerFlowResult?.lines.find((r) => r.lineId === l.id);
        const flowA = flr ? flr.currentKA * 1000 : undefined;
        // Protection status for shield icon — based on SC sensitivity
        const prot = protections.find((p) => p.protectedLineId === l.id);
        let protStatus: 'ok' | 'warning' | 'error' | 'present' | undefined;
        let protTripTimeS: number | undefined;
        if (prot) {
          const scResult = scResults?.find((r) => r.busId === l.toBusId);
          if (scResult) {
            const ikA = scResult.ik3pMinKA * 1000;
            const sensitive = prot.pickupCurrentA < ikA;
            if (sensitive) {
              const tms = prot.tms ?? 0.1;
              const curve = (prot.curve ?? 'standard_inverse') as OcCurve;
              const t = calcTripTime(tms, prot.pickupCurrentA, ikA, curve);
              protTripTimeS = isFinite(t) ? t : undefined;
              protStatus = (protTripTimeS !== undefined && protTripTimeS > 1.0) ? 'warning' : 'ok';
            } else {
              protStatus = 'error';
            }
          } else {
            protStatus = 'present';
          }
        }
        return lineToEdge(l, selectedEdgeId, vdr?.deltaUPercent, flowA, flr?.loadingPercent, showFlowDirections && powerFlowResult?.converged, protStatus, protTripTimeS, ringOpposingSet.has(l.id));
      }),
      ...transformers.map((t) => trafoToEdge(t, selectedEdgeId)),
      ...compensators.map((c) => ({
        id: `comp-link-${c.id}`,
        source: `comp_${c.id}`,
        target: c.busId,
        type: 'compensatorLink',
        focusable: false,
        selectable: false,
        data: {},
      })),
    ],
    [lines, transformers, compensators, protections, selectedEdgeId, voltageDropResults, powerFlowResult, showFlowDirections, scResults, ringOpposingSet],
  );

  // Handle keyboard: Delete key, Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLineDrawingMode(null);
        setPlacingMode(null);
        setContextMenu(null);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete when focused on an input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (selectedNodeId) {
          const busId = selectedNodeId.startsWith('comp_') ? null : selectedNodeId;
          if (busId) {
            const connCount =
              lines.filter((l) => l.fromBusId === busId || l.toBusId === busId).length +
              transformers.filter((t) => t.fromBusId === busId || t.toBusId === busId).length;
            if (connCount > 0) {
              if (confirm(`Slette buss? Dette fjerner også ${connCount} tilkoblet(e) linje(r)/trafo(er).`)) {
                deleteNode(selectedNodeId);
              }
            } else {
              deleteNode(selectedNodeId);
            }
          } else {
            deleteNode(selectedNodeId);
          }
        } else if (selectedEdgeId && !selectedEdgeId.startsWith('comp-link-')) {
          deleteEdge(selectedEdgeId);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedNodeId, selectedEdgeId, lines, transformers, deleteNode, deleteEdge, setLineDrawingMode, setPlacingMode]);

  // DnD handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!rfInstance || !wrapperRef.current) return;

      const defId = e.dataTransfer.getData(DRAG_TYPE);
      if (!defId) return;

      const def = PALETTE.find((d) => d.id === defId);
      if (!def) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const pos = rfInstance.project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });

      if (def.kind === 'bus' && def.busType) {
        addBusAtPosition(def.busType, pos.x, pos.y);
      }
      // Lines/transformers/generators/compensators via drag are not placed directly —
      // they require connection. Show a hint instead.
    },
    [rfInstance, addBusAtPosition],
  );

  // Canvas click — handle placing mode
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      setContextMenu(null);
      if (!placingMode || !rfInstance || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const pos = rfInstance.project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });

      if (placingMode.kind === 'bus') {
        addBusAtPosition(placingMode.busType, pos.x, pos.y);
        // Keep placing mode active for rapid placement; user presses Escape to stop
      }
      // Transformer/generator/compensator placing requires node clicks, handled in onNodeClick
    },
    [placingMode, rfInstance, addBusAtPosition],
  );

  // Node click — selection + line drawing mode B
  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      setContextMenu(null);

      if (lineDrawingMode) {
        if (!lineDrawingFromId) {
          setLineDrawingFromId(node.id);
        } else if (lineDrawingFromId !== node.id) {
          addLineFromConnect(lineDrawingFromId, node.id, lineDrawingMode);
        }
        return;
      }

      if (placingMode) {
        if (placingMode.kind === 'transformer') {
          if (!lineDrawingFromId) {
            setLineDrawingFromId(node.id);
          } else if (lineDrawingFromId !== node.id) {
            addTransformerFromConnect(lineDrawingFromId, node.id);
            setLineDrawingFromId(null);
            setPlacingMode(null);
          }
          return;
        }
        if (placingMode.kind === 'generator') {
          if (!node.id.startsWith('comp_')) {
            const bus = buses.find((b) => b.id === node.id);
            if (bus && bus.type === 'PQ') {
              showToast('Generator kan kun kobles til PV-buss eller Slack-buss. PQ-buss er en ren lastbuss uten produksjon.');
            } else {
              addGeneratorToBus(node.id);
              setPlacingMode(null);
              setSelectedNodeId(node.id);
            }
          }
          return;
        }
        if (placingMode.kind === 'compensator') {
          if (!node.id.startsWith('comp_')) {
            addCompensatorToBus(node.id);
            // selectedNodeId set inside addCompensatorToBus
          }
          return;
        }
        setPlacingMode(null);
        setSelectedNodeId(node.id);
        return;
      }

      setSelectedNodeId(node.id);
    },
    [lineDrawingMode, lineDrawingFromId, placingMode, addLineFromConnect, addTransformerFromConnect, addGeneratorToBus, addCompensatorToBus, setLineDrawingFromId, setPlacingMode, setSelectedNodeId],
  );

  // Edge click
  const onEdgeClick = useCallback(
    (_e: React.MouseEvent, edge: Edge) => {
      setContextMenu(null);
      if (!edge.id.startsWith('comp-link-')) {
        setSelectedEdgeId(edge.id);
      }
    },
    [setSelectedEdgeId],
  );

  // Node drag — update position in store
  const onNodeDragStop = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (!node.id.startsWith('comp_')) {
        updateBus(node.id, { position: node.position });
      }
    },
    [updateBus],
  );

  // React Flow onConnect — Metode A
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const mode = lineDrawingMode ?? 'overhead';
      addLineFromConnect(connection.source, connection.target, mode);
    },
    [lineDrawingMode, addLineFromConnect],
  );

  // Right-click on node
  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (e, node) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
    },
    [],
  );

  // Right-click on edge
  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      e.preventDefault();
      if (!edge.id.startsWith('comp-link-')) {
        setContextMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id });
      }
    },
    [],
  );

  function handleContextDelete() {
    if (contextMenu?.nodeId) {
      const id = contextMenu.nodeId;
      const busId = id.startsWith('comp_') ? null : id;
      if (busId) {
        const connCount =
          lines.filter((l) => l.fromBusId === busId || l.toBusId === busId).length +
          transformers.filter((t) => t.fromBusId === busId || t.toBusId === busId).length;
        if (connCount > 0) {
          if (confirm(`Slette buss? Dette fjerner også ${connCount} tilkoblet(e) linje(r)/trafo(er).`)) {
            deleteNode(id);
          }
        } else {
          deleteNode(id);
        }
      } else {
        deleteNode(id);
      }
    } else if (contextMenu?.edgeId) {
      deleteEdge(contextMenu.edgeId);
    }
    setContextMenu(null);
  }

  const cursorStyle =
    lineDrawingMode ? 'crosshair'
    : placingMode ? 'cell'
    : 'default';

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', background: '#0D1B2A', cursor: cursorStyle }}
      onClick={() => setContextMenu(null)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        fitView
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} color="#1A2A3A" gap={24} />
        <Controls style={{ background: '#1A2A3A', border: '1px solid #0D3B66' }} />
        <MiniMap
          style={{ background: '#0D1B2A', border: '1px solid #0D3B66' }}
          nodeColor="#1565C0"
        />
      </ReactFlow>

      {/* Line drawing mode indicator */}
      {lineDrawingMode && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0F3B55',
            border: '1px solid #4FC3F7',
            borderRadius: 6,
            padding: '6px 16px',
            fontSize: 12,
            color: '#4FC3F7',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          {lineDrawingFromId
            ? `✓ Buss 1 valgt — klikk buss 2 for å tegne ${lineDrawingMode === 'overhead' ? 'luftlinje' : 'jordkabel'}`
            : `Klikk buss 1 for ${lineDrawingMode === 'overhead' ? 'luftlinje' : 'jordkabel'} — ESC for å avbryte`}
        </div>
      )}

      {/* Placing mode indicator */}
      {placingMode && !lineDrawingMode && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1A3B1A',
            border: '1px solid #4CAF50',
            borderRadius: 6,
            padding: '6px 16px',
            fontSize: 12,
            color: '#4CAF50',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          {placingMode.kind === 'bus'
            ? `Klikk på canvas for å plassere ${placingMode.busType}-buss — ESC for å avbryte`
            : placingMode.kind === 'transformer' && !lineDrawingFromId
            ? 'Klikk buss 1 (høyspent) — ESC for å avbryte'
            : placingMode.kind === 'transformer' && lineDrawingFromId
            ? 'Klikk buss 2 (lavspent) for å opprette transformator'
            : placingMode.kind === 'generator'
            ? 'Klikk på en buss for å koble til generator — ESC for å avbryte'
            : placingMode.kind === 'compensator'
            ? 'Klikk på en buss for å koble til kondensatorbank — ESC for å avbryte'
            : 'Klikk for å plassere — ESC for å avbryte'}
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#3B1A1A',
            border: '1px solid #EF4444',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 12,
            color: '#FCA5A5',
            pointerEvents: 'none',
            zIndex: 30,
            maxWidth: 400,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          ⚠ {toastMsg}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#1A2A3A',
            border: '1px solid #1E3A5F',
            borderRadius: 6,
            padding: '4px 0',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            minWidth: 160,
          }}
        >
          {contextMenu.nodeId && (
            <div
              style={{ padding: '7px 14px', fontSize: 12, color: '#E8F0FE', cursor: 'pointer' }}
              onClick={() => {
                setSelectedNodeId(contextMenu.nodeId!);
                setContextMenu(null);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0F2A45')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Rediger komponent
            </div>
          )}
          <div
            style={{ padding: '7px 14px', fontSize: 12, color: '#EF4444', cursor: 'pointer' }}
            onClick={handleContextDelete}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3B1A1A')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Slett komponent
          </div>
        </div>
      )}
    </div>
  );
}
