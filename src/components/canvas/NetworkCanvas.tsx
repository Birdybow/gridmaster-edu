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
import type { Bus, Line, Transformer } from '../../types/index.js';

const nodeTypes = { busNode: BusNode };
const edgeTypes = { lineEdge: LineEdge };

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
  const { buses, lines, transformers } = useNetworkStore((s) => s.project);

  const nodes: Node[] = buses.map(busToNode);
  const edges: Edge[] = [
    ...lines.map(lineToEdge),
    ...transformers.map(trafoToEdge),
  ];

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
