from pydantic import BaseModel
from typing import Any


class NodeData(BaseModel):
    """Flexible node data — all fields are optional since different node types use different fields."""

    label: str = ""
    prompt: str = ""
    model: str = "gemini-2.5-flash"
    systemInstruction: str = ""
    output: str = ""
    status: str = "IDLE"

    model_config = {"extra": "allow"}  # Accept any extra frontend fields


class FlowNode(BaseModel):
    id: str
    type: str
    data: dict[str, Any]


class FlowEdge(BaseModel):
    id: str
    source: str
    target: str


class DAGPayload(BaseModel):
    nodes: list[FlowNode]
    edges: list[FlowEdge]


# Aliases matching both specifications
NodeItem = FlowNode
EdgeItem = FlowEdge

