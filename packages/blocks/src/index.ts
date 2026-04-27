import type { BlockType, WorkflowBlock } from '../../core/src/index';

export const BLOCK_CATALOG: Array<{ type: BlockType; name: string }> = [
  { type: 'text-input', name: 'Text Input' },
  { type: 'ad-input', name: 'Associated Data' },
  { type: 'key-input', name: 'Key (16 byte)' },
  { type: 'nonce-input', name: 'Nonce (PHOTON:16 / Elephant:12 byte)' },
  { type: 'padding', name: 'Padding' },
  { type: 'photon-encrypt', name: 'PHOTON-Beetle Encrypt' },
  { type: 'elephant160-encrypt', name: 'Elephant-160 Encrypt (v2)' },
  { type: 'elephant176-encrypt', name: 'Elephant-176 Encrypt (v2)' },
  { type: 'elephant200-encrypt', name: 'Elephant-200 Encrypt (v2)' },
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
