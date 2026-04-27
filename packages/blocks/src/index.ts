import type { BlockType, WorkflowBlock } from '../../core/src/index';

export const BLOCK_CATALOG: Array<{ type: BlockType; name: string }> = [
  { type: 'text-input', name: 'Text Input' },
  { type: 'ad-input', name: 'Associated Data' },
  { type: 'key-input', name: 'Key (16 byte)' },
  { type: 'nonce-input', name: 'Nonce (16 byte)' },
  { type: 'padding', name: 'Padding' },
  { type: 'encrypt', name: 'PHOTON-Beetle Encrypt' },
  { type: 'output', name: 'Output' },
];

export function createBlock(type: BlockType, id: string): WorkflowBlock {
  const catalogItem = BLOCK_CATALOG.find((item) => item.type === type);
  return {
    id,
    type,
    name: catalogItem?.name ?? type,
    data: {},
  };
}
