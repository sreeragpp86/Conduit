import { create } from 'zustand';
import {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';

export type NodeStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';

export interface PromptNodeData extends Record<string, unknown> {
  label: string;
  prompt: string;
  status: NodeStatus;
}

export interface LlmNodeData extends Record<string, unknown> {
  label: string;
  model: string;
  systemInstruction: string;
  status: NodeStatus;
}

export interface OutputNodeData extends Record<string, unknown> {
  label: string;
  output: string;
  status: NodeStatus;
}

export type WorkflowNodeData = PromptNodeData | LlmNodeData | OutputNodeData;

const defaultNodes: Node<WorkflowNodeData>[] = [
  {
    id: 'prompt-1',
    type: 'promptNode',
    position: { x: 80, y: 220 },
    data: {
      label: 'Prompt Input',
      prompt: 'Explain the concept of Large Language Models in simple terms.',
      status: 'IDLE',
    } as PromptNodeData,
  },
  {
    id: 'llm-1',
    type: 'llmNode',
    position: { x: 480, y: 180 },
    data: {
      label: 'LLM Agent',
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are a concise technical writer. Provide clear, accurate explanations.',
      status: 'IDLE',
    } as LlmNodeData,
  },
  {
    id: 'output-1',
    type: 'outputNode',
    position: { x: 880, y: 220 },
    data: {
      label: 'Output',
      output: '',
      status: 'IDLE',
    } as OutputNodeData,
  },
];

const defaultEdges: Edge[] = [
  {
    id: 'e-prompt-llm',
    source: 'prompt-1',
    target: 'llm-1',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#52525B', strokeWidth: 2 },
  },
  {
    id: 'e-llm-output',
    source: 'llm-1',
    target: 'output-1',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#52525B', strokeWidth: 2 },
  },
];

let nodeCounter = 2;

interface WorkflowState {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  isExecuting: boolean;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addPromptNode: () => void;
  addLlmNode: () => void;
  addOutputNode: () => void;
  setNodeStatus: (id: string, status: NodeStatus) => void;
  setNodeOutput: (id: string, output: string) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
  setEdgesAnimated: (animated: boolean) => void;
  setIsExecuting: (v: boolean) => void;
  resetNodeStatuses: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: defaultNodes,
  edges: defaultEdges,
  isExecuting: false,

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as Node<WorkflowNodeData>[] })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        { ...connection, type: 'smoothstep', animated: false, style: { stroke: '#52525B', strokeWidth: 2 } },
        state.edges
      ),
    })),

  addPromptNode: () =>
    set((state) => {
      const id = `prompt-${++nodeCounter}`;
      return {
        nodes: [
          ...state.nodes,
          {
            id,
            type: 'promptNode',
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            data: { label: 'Prompt Input', prompt: '', status: 'IDLE' } as PromptNodeData,
          },
        ],
      };
    }),

  addLlmNode: () =>
    set((state) => {
      const id = `llm-${++nodeCounter}`;
      return {
        nodes: [
          ...state.nodes,
          {
            id,
            type: 'llmNode',
            position: { x: Math.random() * 400 + 300, y: Math.random() * 300 + 100 },
            data: {
              label: 'LLM Agent',
              model: 'gemini-2.5-flash',
              systemInstruction: '',
              status: 'IDLE',
            } as LlmNodeData,
          },
        ],
      };
    }),

  addOutputNode: () =>
    set((state) => {
      const id = `output-${++nodeCounter}`;
      return {
        nodes: [
          ...state.nodes,
          {
            id,
            type: 'outputNode',
            position: { x: Math.random() * 400 + 600, y: Math.random() * 300 + 100 },
            data: { label: 'Output', output: '', status: 'IDLE' } as OutputNodeData,
          },
        ],
      };
    }),

  setNodeStatus: (id, status) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status } } : n
      ),
    })),

  setNodeOutput: (id, output) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, output } } : n
      ),
    })),

  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  setEdgesAnimated: (animated) =>
    set((state) => ({
      edges: state.edges.map((e) => ({
        ...e,
        animated,
        style: {
          ...e.style,
          stroke: animated ? '#10B981' : '#52525B',
        },
      })),
    })),

  setIsExecuting: (v) => set({ isExecuting: v }),

  resetNodeStatuses: () =>
    set((state) => ({
      nodes: state.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          status: 'IDLE' as NodeStatus,
          ...(n.type === 'outputNode' ? { output: '' } : {}),
        },
      })),
    })),
}));
