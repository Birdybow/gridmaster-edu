import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useNetworkStore } from '../../store/useNetworkStore.js';
import { BusNode } from './BusNode.js';
import { LineEdge } from './LineEdge.js';
import { CompensatorNode } from './CompensatorNode.js';
import { CompensatorLinkEdge } from './CompensatorLinkEdge.js';
import type { Bus, Line, Transformer, Compensator } from '../../types/index.js';

// Defined at module level — never recreated, prevents React Flow nodeTypes warning
const nodeTypes = { busNode: BusNode, compensatorNode: CompensatorNode };
const edgeTypes = { lineEdge: LineEdge, compensatorLink: CompensatorLinkEdge };

function busToNode(bus: Bus): Node {
  return {
    id: bus.id,
    type: 'busNode',
    position: bus.position,
    data: bus,
  };
}

function lineToEdge(line: Line): Edge {
  return {
    id: line.id,
    source: line.fromBusId,
    target: line.toBusId,
    type: 'lineEdge',
    data: { ...line, label: line.name },
  };
}

function compensatorToNode(c: Compensator, buses: Bus[]): Node {
  const bus = buses.find((b) => b.id === c.busId);
  // Position relative to connected bus so it's derived from stable store data
  const position = bus
    ? { x: bus.position.x + 140, y: bus.position.y - 20 }
    : { x: 200, y: 200 };
  return {
    id: `comp_${c.id}`,
    type: 'compensatorNode',
    position,
    data: c,
  };
}

function trafoToEdge(t: Transformer): Edge {
  return {
    id: t.id,
    source: t.fromBusId,
    target: t.toBusId,
    type: 'lineEdge',
    data: {
      name: t.name,
      label: t.name,
      lineType: 'cable',
    },
  };
}

export function NetworkCanvas() {
  // Granular selectors — NetworkCanvas only re-renders when topology changes,
  // not on every power-flow / compensation result update.
  const buses = useNetworkStore((s) => s.project.buses);
  const lines = useNetworkStore((s) => s.project.lines);
  const transformers = useNetworkStore((s) => s.project.transformers);
  const compensators = useNetworkStore((s) => s.project.compensators);

  // useMemo gives React Flow stable array references between store updates,
  // preventing the setNodes → re-render → setNodes infinite loop.
  const nodes: Node[] = useMemo(
    () => [
      ...buses.map(busToNode),
      ...compensators.map((c) => compensatorToNode(c, buses)),
    ],
    [buses, compensators],
  );

  const edges: Edge[] = useMemo(
    () => [
      ...lines.map(lineToEdge),
      ...transformers.map(trafoToEdge),
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
    [lines, transformers, compensators],
  );

  return (
    <div style={{ width: '100%', height: '100%', background: '#0D1B2A' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#1A2A3A"
          gap={24}
        />
        <Controls style={{ background: '#1A2A3A', border: '1px solid #0D3B66' }} />
        <MiniMap
          style={{ background: '#0D1B2A', border: '1px solid #0D3B66' }}
          nodeColor="#1565C0"
        />
      </ReactFlow>
    </div>
  );
}
