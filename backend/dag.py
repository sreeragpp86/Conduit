"""
dag.py — Kahn's Algorithm for topological sorting and cycle detection.

Given a list of FlowNode and FlowEdge objects, this module resolves the
correct execution order for the Conduit DAG, ensuring:
  1. No node is executed before all its upstream dependencies.
  2. Cycles are detected and rejected with a clear error.
"""

from collections import deque
from typing import List, Dict, Tuple

from schemas import FlowNode, FlowEdge


def resolve_execution_order(
    nodes: List[FlowNode],
    edges: List[FlowEdge],
) -> Tuple[List[str], Dict[str, List[str]]]:
    """
    Run Kahn's topological sort on the workflow graph.

    Returns:
        execution_order: List of node IDs in valid execution order.
        parents: Dict mapping each node_id -> list of parent node_ids.

    Raises:
        ValueError: If a cycle is detected (i.e., the graph is not a valid DAG).
    """
    node_ids: List[str] = [n.id for n in nodes]

    # --- Build graph structures ---
    # adjacency list: source -> [targets]
    adj: Dict[str, List[str]] = {nid: [] for nid in node_ids}
    # in_degree: how many edges point INTO each node
    in_degree: Dict[str, int] = {nid: 0 for nid in node_ids}
    # parents: child -> [parent node IDs]
    parents: Dict[str, List[str]] = {nid: [] for nid in node_ids}

    for edge in edges:
        src, tgt = edge.source, edge.target
        # Guard against dangling edges referencing unknown nodes
        if src in adj and tgt in adj:
            adj[src].append(tgt)
            in_degree[tgt] += 1
            parents[tgt].append(src)

    # --- Kahn's BFS ---
    # Start with every node that has no dependencies (in_degree == 0)
    queue: deque[str] = deque(nid for nid in node_ids if in_degree[nid] == 0)
    execution_order: List[str] = []

    while queue:
        node_id = queue.popleft()
        execution_order.append(node_id)

        for neighbor in adj[node_id]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # --- Cycle Detection ---
    # If not all nodes made it into execution_order, there is a cycle.
    if len(execution_order) != len(nodes):
        raise ValueError(
            "Cycle detected: Workflow graph must be a valid Directed Acyclic Graph (DAG). Infinite loop detected in node connections."
        )

    return execution_order, parents


# Alias
topological_sort = resolve_execution_order

