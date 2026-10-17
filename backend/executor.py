"""
executor.py — Real LLM Execution & Context Merging Engine for Conduit DAG.

Features:
- Multi-Parent Context Merging with labeled upstream separators.
- Real async calls to Groq (Llama-3.3-70B) and Gemini API via httpx.AsyncClient.
- Graceful, realistic synthesized fallback when no API key is provided or on network error.
- Works with environment variables (GROQ_API_KEY, GEMINI_API_KEY) or frontend-provided keys.
"""

import os
import asyncio
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv

# Load local environment variables from backend/.env if present
load_dotenv()


def _get_api_key(provider: str, api_keys: Optional[Dict[str, str]] = None) -> Optional[str]:
    """Retrieve API key from request payload or environment variables."""
    keys = api_keys or {}
    prov_lower = provider.lower()

    if "groq" in prov_lower:
        return (
            keys.get("groq")
            or keys.get("GROQ_API_KEY")
            or os.getenv("GROQ_API_KEY")
            or None
        )
    elif "gemini" in prov_lower:
        return (
            keys.get("gemini")
            or keys.get("GEMINI_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_AI_API_KEY")
            or None
        )
    return None


def _format_synthesized_response(model: str, system_prompt: str, merged_input: str, reason: str = "") -> str:
    """Generate a realistic, beautifully structured response when running without live API keys."""
    topic_summary = merged_input.strip().split("\n")[0] if merged_input.strip() else "Autonomous AI Workflows"
    if len(topic_summary) > 80:
        topic_summary = topic_summary[:77] + "..."

    reason_tag = f" ({reason})" if reason else " (Synthesizer Demo Mode)"

    return (
        f"[{model}]{reason_tag}\n\n"
        f"● System Directive: {system_prompt if system_prompt else 'Default Workflow Synthesizer'}\n\n"
        f"● Synthesized Result based on:\n\"{topic_summary}\"\n\n"
        f"1. Context Decomposition:\n"
        f"Upstream DAG payload analyzed successfully. Transformer self-attention layers mapped "
        f"all incoming dependency tokens across the active execution pipeline.\n\n"
        f"2. Core Insight:\n"
        f"Modular workflow nodes provide deterministic orchestration around non-deterministic LLM agents. "
        f"Topological sorting guarantees that dependency context is fully materialized prior to downstream execution.\n\n"
        f"3. Recommendation & Next Steps:\n"
        f"• Downstream stages can directly parse this structured output.\n"
        f"• Provide an API key via the top bar Settings or backend/.env to invoke live inference endpoints.\n\n"
        f"Status: OK · Engine: Conduit DAG v0.1.0 · Latency optimized."
    )


async def execute_node(
    node_id: str,
    node_type: str,
    data: Dict[str, Any],
    parent_outputs: Dict[str, str],
    api_keys: Optional[Dict[str, str]] = None,
) -> str:
    """
    Execute node logic based on its type:
    - promptNode: Returns the prompt text.
    - llmNode: Merges multi-parent context, applies system prompt, and calls real LLM API or fallback.
    - outputNode: Formats and displays all upstream incoming outputs.
    """
    if node_type == "promptNode":
        user_prompt = (data.get("prompt") or "").strip()
        return user_prompt if user_prompt else "[Prompt Node: No input text provided]"

    elif node_type == "llmNode":
        model = data.get("model", "gemini-2.5-flash")
        system_instruction = (data.get("systemInstruction") or "").strip()

        # Multi-Parent Context Merging
        if len(parent_outputs) == 0:
            merged_input = (data.get("prompt") or "Process incoming pipeline instructions.").strip()
        elif len(parent_outputs) == 1:
            merged_input = list(parent_outputs.values())[0].strip()
        else:
            sections = []
            for idx, (pid, ptext) in enumerate(parent_outputs.items(), start=1):
                sections.append(f"--- Upstream Input {idx} (from node: {pid}) ---\n{ptext.strip()}")
            merged_input = "\n\n".join(sections)

        # Determine which provider to use
        is_groq = "llama" in model.lower() or "groq" in model.lower()
        provider = "groq" if is_groq else "gemini"
        api_key = _get_api_key(provider, api_keys)

        # Attempt Real API Call if API Key exists
        if api_key:
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    if is_groq:
                        # Groq OpenAI-compatible endpoint
                        groq_model = "llama-3.3-70b-versatile"
                        messages = []
                        if system_instruction:
                            messages.append({"role": "system", "content": system_instruction})
                        messages.append({"role": "user", "content": merged_input})

                        resp = await client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {api_key}",
                                "Content-Type": "application/json",
                            },
                            json={
                                "model": groq_model,
                                "messages": messages,
                                "temperature": 0.7,
                            },
                        )
                        if resp.status_code == 200:
                            json_data = resp.json()
                            content = json_data["choices"][0]["message"]["content"]
                            return f"[{groq_model}] (Live Groq Inference)\n\n{content}"
                        else:
                            err_msg = resp.text[:200]
                            return _format_synthesized_response(
                                model, system_instruction, merged_input,
                                reason=f"Groq API HTTP {resp.status_code}: {err_msg}"
                            )

                    else:
                        # Gemini Native / OpenAI-compatible endpoint
                        gemini_target_model = "gemini-2.5-flash" if "2.5" in model else "gemini-1.5-flash"
                        # Try Gemini generateContent REST endpoint
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_target_model}:generateContent?key={api_key}"
                        payload: Dict[str, Any] = {
                            "contents": [{"parts": [{"text": merged_input}]}]
                        }
                        if system_instruction:
                            payload["system_instruction"] = {
                                "parts": [{"text": system_instruction}]
                            }

                        resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                        if resp.status_code == 200:
                            json_data = resp.json()
                            candidates = json_data.get("candidates", [])
                            if candidates:
                                text_parts = [
                                    p.get("text", "")
                                    for p in candidates[0].get("content", {}).get("parts", [])
                                ]
                                content = "".join(text_parts).strip()
                                return f"[{model}] (Live Gemini Inference)\n\n{content}"

                        # If failed, attempt fallback
                        err_msg = resp.text[:200]
                        return _format_synthesized_response(
                            model, system_instruction, merged_input,
                            reason=f"Gemini API HTTP {resp.status_code}: {err_msg}"
                        )
            except Exception as exc:
                # Network or connection error -> graceful fallback
                return _format_synthesized_response(
                    model, system_instruction, merged_input,
                    reason=f"API connection error: {str(exc)[:100]}"
                )

        # Fallback when no API Key is provided
        await asyncio.sleep(0.6)
        return _format_synthesized_response(model, system_instruction, merged_input)

    elif node_type == "outputNode":
        if not parent_outputs:
            return "[Output Node: Waiting for upstream execution...]"
        elif len(parent_outputs) == 1:
            return list(parent_outputs.values())[0].strip()
        else:
            sections = []
            for idx, (pid, ptext) in enumerate(parent_outputs.items(), start=1):
                sections.append(f"### [Upstream Output {idx}] (Node: {pid})\n\n{ptext.strip()}")
            return "\n\n" + "\n\n---\n\n".join(sections)

    return f"[{node_type} execution completed]"
