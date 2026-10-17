"""
main.py — Conduit FastAPI DAG Execution Engine
Serves the /api/execute SSE endpoint that drives the React Flow frontend.
"""

import asyncio
import json
from typing import AsyncGenerator

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from schemas import DAGPayload, FlowNode
from dag import topological_sort, resolve_execution_order

app = FastAPI(
    title="Conduit DAG Engine",
    version="0.1.0",
    description="Server-Sent Events execution engine for the Conduit visual AI workflow orchestrator.",
)


# ---------------------------------------------------------------------------
# CORS — allow the Next.js dev server to call us
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sse(data: dict) -> str:
    """Format a dict as a Server-Sent Event frame."""
    return f"data: {json.dumps(data)}\n\n"


def _get_node_by_id(nodes: list[FlowNode], node_id: str) -> FlowNode | None:
    return next((n for n in nodes if n.id == node_id), None)


def _simulate_node_output(node: FlowNode, parent_outputs: dict[str, str]) -> str:
    """
    Simulate what each node type produces.
    Phase 2 uses deterministic simulation — Phase 3 will swap in real LLM calls.
    """
    node_type = node.type
    data = node.data

    if node_type == "promptNode":
        prompt = data.get("prompt", "").strip()
        return prompt if prompt else "[Empty prompt — type something in the Prompt node]"

    elif node_type == "llmNode":
        model = data.get("model", "gemini-2.5-flash")
        system = data.get("systemInstruction", "").strip()

        # Gather all parent text
        parent_text = "\n\n".join(parent_outputs.values()) if parent_outputs else ""
        topic = parent_text or "general AI topics"

        # Structured simulated response
        return (
            f"[{model}] — Simulated inference\n\n"
            f"System: {system or 'No system instruction set.'}\n\n"
            f"Based on the prompt: \"{topic[:120]}{'...' if len(topic) > 120 else ''}\"\n\n"
            "Large Language Models (LLMs) are transformer-based neural networks trained on "
            "vast corpora of text. At their core they learn to predict the next token in a "
            "sequence, which — at sufficient scale — yields emergent abilities like reasoning, "
            "code generation, and nuanced instruction following.\n\n"
            "Key properties:\n"
            "• Scale: hundreds of billions of parameters encoding statistical knowledge\n"
            "• Context window: attends to thousands of tokens simultaneously via self-attention\n"
            "• RLHF alignment: fine-tuned to follow human instructions safely\n\n"
            f"Inference complete. Model: {model} · Tokens: ~{len(topic.split()) * 4 + 280}"
        )

    elif node_type == "outputNode":
        # OutputNode receives the LLM result from its parents
        return "\n\n".join(parent_outputs.values()) if parent_outputs else "[No upstream data received]"

    else:
        return f"[Unknown node type: {node_type}]"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict:
    return {"status": "operational", "engine": "Conduit DAG v0.1.0"}


@app.post("/api/execute")
async def execute_dag(payload: DAGPayload) -> StreamingResponse:
    """
    Accept a DAG payload (nodes + edges) from the React Flow frontend,
    resolve execution order via Kahn's algorithm, and stream SSE events
    as each node transitions through RUNNING → COMPLETED.
    """
    # --- Topological sort + cycle detection ---
    try:
        execution_order, parents = topological_sort(payload.nodes, payload.edges)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    async def stream() -> AsyncGenerator[str, None]:
        # Map node_id -> output string produced by that node
        context_store: dict[str, str] = {}


        # --- Execute nodes in topological order ---
        for node_id in execution_order:
            node = _get_node_by_id(payload.nodes, node_id)
            if node is None:
                continue  # Defensive: skip phantom IDs

            # Signal RUNNING to the frontend
            yield _sse({"node_id": node_id, "status": "RUNNING"})

            # Gather outputs from all parent nodes
            parent_outputs = {
                pid: context_store[pid]
                for pid in parents.get(node_id, [])
                if pid in context_store
            }

            # Simulate async compute (Phase 3: replace with real LLM call)
            await asyncio.sleep(0.8)

            # Produce this node's output
            result = _simulate_node_output(node, parent_outputs)
            context_store[node_id] = result

            # Signal COMPLETED with the produced output
            yield _sse({"node_id": node_id, "status": "COMPLETED", "output": result})

        # --- Pipeline done ---
        yield _sse({"event": "PIPELINE_COMPLETE"})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering if behind a proxy
        },
    )
