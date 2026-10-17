'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Terminal } from 'lucide-react';
import { OutputNodeData } from '@/store/workflowStore';
import { NodeStatusRing } from '@/components/NodeStatusRing';

export type OutputFlowNode = Node<OutputNodeData, 'outputNode'>;

const statusColors = {
  IDLE: 'border-white/10',
  RUNNING: 'border-amber-400/80',
  COMPLETED: 'border-emerald-500/80',
  ERROR: 'border-red-500/80',
} as const;

function OutputNodeComponent({ data }: NodeProps<OutputFlowNode>) {
  return (
    <div className={`relative w-80 rounded-xl bg-[#121214] border ${statusColors[data.status]} shadow-xl shadow-black/40 transition-all duration-500`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-emerald-400/80 !bg-[#121214] !shadow-lg !shadow-emerald-500/20"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Terminal size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/90 truncate">{data.label}</p>
          <p className="text-[10px] text-white/30 font-mono">type:output_renderer</p>
        </div>
        <NodeStatusRing status={data.status} duration_ms={data.duration_ms} />
      </div>


      {/* Body */}
      <div className="px-4 py-3">
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5 block">
          Generated Output
        </label>
        <div className="relative min-h-[100px] max-h-[200px] overflow-y-auto rounded-lg bg-white/[0.03] border border-white/[0.08] p-2.5">
          {data.output ? (
            <p className="text-white/75 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {data.output}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 gap-2">
              {data.status === 'RUNNING' ? (
                <>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-mono text-amber-400/60">Generating…</p>
                </>
              ) : (
                <p className="text-[11px] font-mono text-white/20">Waiting for execution…</p>
              )}
            </div>
          )}
        </div>

        {data.output && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/80 text-[10px] font-mono">
              ~{Math.ceil(data.output.split(' ').length * 1.3)} tokens
            </span>
            <span className="text-[10px] font-mono text-white/20">estimated</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
