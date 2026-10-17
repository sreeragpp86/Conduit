'use client';

import { useWorkflowStore } from '@/store/workflowStore';
import { Play, Plus, Zap, AlertCircle, X } from 'lucide-react';
import { useCallback, useState } from 'react';

const BACKEND_URL = 'http://localhost:8000';

type SseEvent =
  | { node_id: string; status: 'RUNNING' }
  | { node_id: string; status: 'COMPLETED'; output: string }
  | { event: 'PIPELINE_COMPLETE' }
  | { event: 'ERROR'; message: string };

export function TopBar() {
  const {
    addPromptNode, addLlmNode, addOutputNode,
    nodes, edges,
    setNodeStatus, setNodeOutput,
    setEdgesAnimated, setIsExecuting, isExecuting,
    resetNodeStatuses,
  } = useWorkflowStore();

  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // SSE-based DAG execution
  // ---------------------------------------------------------------------------
  const executeDAG = useCallback(async () => {
    if (isExecuting) return;
    setError(null);
    resetNodeStatuses();
    setIsExecuting(true);
    setEdgesAnimated(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        }),
      });

      // HTTP-level error (e.g. 400 Cycle Detected, 422 Validation, 500)
      if (!res.ok) {
        let msg = `Server error (${res.status})`;
        try {
          const body = await res.json();
          msg = body?.detail ?? body?.message ?? msg;
        } catch { /* ignore parse error */ }
        if (res.status === 400 && (msg.toLowerCase().includes('cycle') || msg.toLowerCase().includes('loop'))) {
          setError('DAG Error: Infinite loop detected in node connections');
        } else {
          setError(`DAG Error: ${msg}`);
        }
        setIsExecuting(false);
        setEdgesAnimated(false);
        return;
      }


      // --- Read the SSE stream ---
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body — cannot read SSE stream.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE frame separator)
        const frames = buffer.split('\n\n');
        // Keep the last (potentially incomplete) chunk in the buffer
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith('data:')) continue;

          const jsonStr = line.slice('data:'.length).trim();
          if (!jsonStr) continue;

          let evt: SseEvent;
          try {
            evt = JSON.parse(jsonStr);
          } catch {
            console.warn('[Conduit] Failed to parse SSE frame:', jsonStr);
            continue;
          }

          // Dispatch to Zustand store
          if ('event' in evt) {
            if (evt.event === 'ERROR') {
              setError(`DAG Error: ${evt.message}`);
              setEdgesAnimated(false);
              setIsExecuting(false);
              return;
            }
            if (evt.event === 'PIPELINE_COMPLETE') {
              // Keep edges green — execution done
              break;
            }
          } else if ('node_id' in evt) {
            if (evt.status === 'RUNNING') {
              setNodeStatus(evt.node_id, 'RUNNING');
            } else if (evt.status === 'COMPLETED') {
              setNodeStatus(evt.node_id, 'COMPLETED');
              if (evt.output !== undefined) {
                setNodeOutput(evt.node_id, evt.output);
              }
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // Friendly message when backend is not running
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED')) {
        setError('Cannot connect to backend. Start the FastAPI server: cd backend && uvicorn main:app --reload');
      } else {
        setError(`Execution failed: ${msg}`);
      }
      setEdgesAnimated(false);
    } finally {
      setIsExecuting(false);
    }
  }, [
    isExecuting, nodes, edges,
    resetNodeStatuses, setEdgesAnimated, setIsExecuting,
    setNodeOutput, setNodeStatus,
  ]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
      {/* Main bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#121214]/90 border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-xl">
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
          <button
            onClick={addPromptNode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white/60 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all duration-150"
          >
            <Plus size={11} /> Prompt
          </button>
          <button
            onClick={addLlmNode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white/60 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all duration-150"
          >
            <Plus size={11} /> LLM Agent
          </button>
          <button
            onClick={addOutputNode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all duration-150"
          >
            <Plus size={11} /> Output
          </button>
        </div>

        <div className="w-px h-6 bg-white/[0.08]" />

        {/* Execute DAG */}
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
      </div>

      {/* Error banner — shown below the top bar */}
      {error && (
        <div className="flex items-start gap-2.5 max-w-2xl px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 shadow-lg shadow-red-500/10 backdrop-blur-xl">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-[11px] font-mono text-red-300/90 leading-relaxed flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
