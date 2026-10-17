'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { PromptNodeData, useWorkflowStore } from '@/store/workflowStore';
import { AlignLeft } from 'lucide-react';
import { NodeStatusRing } from '@/components/NodeStatusRing';

export type PromptFlowNode = Node<PromptNodeData, 'promptNode'>;

const statusColors = {
  IDLE: 'border-white/10',
  RUNNING: 'border-amber-400/80',
  COMPLETED: 'border-emerald-500/80',
  ERROR: 'border-red-500/80',
} as const;

function PromptNodeComponent({ id, data }: NodeProps<PromptFlowNode>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { prompt: e.target.value } as Partial<PromptNodeData>);
    },
    [id, updateNodeData]
  );

  return (
    <div className={`relative w-72 rounded-xl bg-[#121214] border ${statusColors[data.status]} shadow-xl shadow-black/40 transition-all duration-500`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400">
          <AlignLeft size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/90 truncate">{data.label}</p>
          <p className="text-[10px] text-white/30 font-mono">type:prompt_input</p>
        </div>
        <NodeStatusRing status={data.status} duration_ms={data.duration_ms} />
      </div>


      {/* Body */}
      <div className="px-4 py-3">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">
          Prompt / Topic
        </label>
        <textarea
          value={data.prompt}
          onChange={handlePromptChange}
          rows={4}
          className="nodrag w-full resize-none rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-mono p-2.5 placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
          placeholder="Enter a topic or prompt variable…"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-violet-400/80 !bg-[#121214] !shadow-lg !shadow-violet-500/20"
      />
    </div>
  );
}

export const PromptNode = memo(PromptNodeComponent);
