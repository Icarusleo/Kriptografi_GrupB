export type BlockType =
  | 'text-input'
  | 'ad-input'
  | 'key-input'
  | 'nonce-input'
  | 'padding'
  | 'encrypt'
  | 'decrypt'
  | 'hash'
  | 'output';

export interface WorkflowBlock {
  id: string;
  type: BlockType;
  name: string;
  data?: Record<string, string>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
}

export interface WorkflowGraph {
  blocks: WorkflowBlock[];
  edges: WorkflowEdge[];
}
