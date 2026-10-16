'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeTypes,
  Panel,
  Node,
} from '@xyflow/react';
import { useWorkflowStore } from '@/store/workflowStore';
import { PromptNode } from '@/components/nodes/PromptNode';
import { LlmNode } from '@/components/nodes/LlmNode';
import { OutputNode } from '@/components/nodes/OutputNode';
import { TopBar } from '@/components/TopBar';

// ⚠️ CRITICAL: Must be at module scope — never inside the component.
// Defining nodeTypes inside the component causes React Flow to re-render infinitely.
const nodeTypes: NodeTypes = {
  promptNode: PromptNode,
  llmNode: LlmNode,
  outputNode: OutputNode,
};

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

  const nodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'promptNode': return '#7C3AED';
      case 'llmNode':    return '#2563EB';
      case 'outputNode': return '#059669';
      default:           return '#52525B';
    }
  }, []);

  return (
    // ⚠️ CRITICAL: Container must have explicit dimensions for React Flow to render
    <div className="w-screen h-screen overflow-hidden bg-[#09090B]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#52525B', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272A"
        />

        <Controls
          className="!bg-[#121214] !border-white/10 !shadow-xl [&>button]:!bg-[#121214] [&>button]:!border-white/10 [&>button]:!text-white/50 [&>button:hover]:!bg-white/5 [&>button:hover]:!text-white/90"
          position="bottom-right"
        />

        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(9,9,11,0.85)"
          className="!bg-[#121214] !border-white/10 !rounded-xl !shadow-xl overflow-hidden"
          position="bottom-left"
          pannable
          zoomable
        />

        <Panel position="top-right">
          <div className="flex items-center px-3 py-1.5 rounded-xl bg-[#121214]/80 border border-white/[0.08] backdrop-blur-md">
            <span className="text-[10px] font-mono text-white/30">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
            </span>
          </div>
        </Panel>
      </ReactFlow>

      <TopBar />
    </div>
  );
}
