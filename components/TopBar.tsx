'use client';

import { useWorkflowStore } from '@/store/workflowStore';
import { Play, Plus, Zap, AlertCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

const SIMULATED_OUTPUT = `Large Language Models (LLMs) are a type of artificial intelligence trained on massive datasets of text. Think of them as extraordinarily well-read systems that have internalized patterns from billions of documents — books, code, websites, and scientific papers.

At their core, LLMs predict what token (word or sub-word) comes next given a sequence of previous tokens. Through training on vast corpora, they develop emergent capabilities: translation, reasoning, code generation, and nuanced conversation.

Key characteristics:
• Scale: Hundreds of billions of parameters encode learned associations
• Context window: They process and attend to thousands of tokens simultaneously  
• Instruction following: RLHF fine-tuning aligns them with human preferences

Modern LLMs like Gemini, GPT-4, and Llama represent the frontier of this paradigm.`;

export function TopBar() {
  const {
    addPromptNode, addLlmNode, addOutputNode,
    nodes, setNodeStatus, setNodeOutput,
    setEdgesAnimated, setIsExecuting, isExecuting, resetNodeStatuses,
  } = useWorkflowStore();
  const [execError, setExecError] = useState<string | null>(null);

  const executeDAG = useCallback(async () => {
    if (isExecuting) return;
    setExecError(null);
    resetNodeStatuses();
    setIsExecuting(true);
    setEdgesAnimated(true);

    const orderedIds = ['prompt-1', 'llm-1', 'output-1'];
    const durations = [1000, 1200, 900];

    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (!nodes.some((n) => n.id === id)) continue;
        if (i > 0) await new Promise<void>((r) => setTimeout(r, 400));
        setNodeStatus(id, 'RUNNING');
        await new Promise<void>((r) => setTimeout(r, durations[i]));
        setNodeStatus(id, 'COMPLETED');
        if (id === 'output-1') {
          const words = SIMULATED_OUTPUT.split(' ');
          let accumulated = '';
          for (let w = 0; w < words.length; w++) {
            accumulated += (w === 0 ? '' : ' ') + words[w];
            setNodeOutput(id, accumulated);
            await new Promise<void>((r) => setTimeout(r, 18));
          }
        }
      }
    } catch {
      setExecError('Execution failed.');
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, nodes, resetNodeStatuses, setEdgesAnimated, setIsExecuting, setNodeOutput, setNodeStatus]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#121214]/90 border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">Conduit</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400/90 border border-violet-500/20">
              v0.1.0-alpha
            </span>
          </div>
          <p className="text-[9px] font-mono text-white/30 leading-none">DAG Workflow Engine</p>
        </div>
      </div>

      {/* Add node buttons */}
      <div className="flex items-center gap-1.5">
        <button onClick={addPromptNode} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white/60 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all duration-150">
          <Plus size={11} /> Prompt
        </button>
        <button onClick={addLlmNode} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white/60 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all duration-150">
          <Plus size={11} /> LLM Agent
        </button>
        <button onClick={addOutputNode} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all duration-150">
          <Plus size={11} /> Output
        </button>
      </div>

      <div className="w-px h-6 bg-white/[0.08]" />

      {/* Execute */}
      <button
        onClick={executeDAG}
        disabled={isExecuting}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          isExecuting
            ? 'bg-amber-500/20 text-amber-400/80 border border-amber-500/30 cursor-not-allowed'
            : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border border-transparent shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        <Play size={11} className={isExecuting ? 'animate-pulse' : ''} />
        {isExecuting ? 'Executing…' : 'Execute DAG'}
      </button>

      {execError && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400/80">
          <AlertCircle size={11} /> {execError}
        </div>
      )}
    </div>
  );
}
