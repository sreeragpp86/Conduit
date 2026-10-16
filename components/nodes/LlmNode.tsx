'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { LlmNodeData, useWorkflowStore } from '@/store/workflowStore';
import { Cpu, ChevronDown } from 'lucide-react';
import { NodeStatusRing } from '@/components/NodeStatusRing';

export type LlmFlowNode = Node<LlmNodeData, 'llmNode'>;

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
  { value: 'llama-3.1-405b', label: 'Llama 3.1 405B' },
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
];

const statusColors = {
  IDLE: 'border-white/10',
  RUNNING: 'border-amber-400/80',
  COMPLETED: 'border-emerald-500/80',
  ERROR: 'border-red-500/80',
} as const;

function LlmNodeComponent({ id, data }: NodeProps<LlmFlowNode>) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { model: e.target.value } as Partial<LlmNodeData>);
    },
    [id, updateNodeData]
  );

  const handleInstructionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { systemInstruction: e.target.value } as Partial<LlmNodeData>);
    },
    [id, updateNodeData]
  );

  return (
    <div className={`relative w-72 rounded-xl bg-[#121214] border ${statusColors[data.status]} shadow-xl shadow-black/40 transition-all duration-500`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-blue-400/80 !bg-[#121214] !shadow-lg !shadow-blue-500/20"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400">
          <Cpu size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/90 truncate">{data.label}</p>
          <p className="text-[10px] text-white/30 font-mono">type:llm_inference</p>
        </div>
        <NodeStatusRing status={data.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">
            Model
          </label>
          <div className="relative">
            <select
              value={data.model}
              onChange={handleModelChange}
              className="nodrag w-full appearance-none rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-mono px-2.5 py-2 pr-7 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[#18181B]">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">
            System Instruction
          </label>
          <input
            type="text"
            value={data.systemInstruction}
            onChange={handleInstructionChange}
            className="nodrag w-full rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-xs font-mono px-2.5 py-2 placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
            placeholder="You are a helpful assistant…"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400/80 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
            {MODELS.find((m) => m.value === data.model)?.label ?? data.model}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-blue-400/80 !bg-[#121214] !shadow-lg !shadow-blue-500/20"
      />
    </div>
  );
}

export const LlmNode = memo(LlmNodeComponent);
