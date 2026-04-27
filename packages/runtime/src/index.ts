import type { WorkflowGraph } from '../../core/src/index';
import {
  createPhotonBeetleEngine,
  photonBeetleHash,
} from '../../crypto-photon/src/index';

const encoder = new TextEncoder();

export async function executeWorkflow(graph: WorkflowGraph): Promise<string[]> {
  const logs: string[] = [];
  const { engine, mode, reason } = await createPhotonBeetleEngine();
  logs.push(`engine mode: ${mode}`);
  if (reason) {
    logs.push(`engine note: ${reason}`);
  }

  const paddingEnabled = graph.blocks.some((block) => block.type === 'padding');
  if (paddingEnabled) {
    logs.push('padding block: active');
  }
  const textRaw = parseDataInput(findValue(graph, 'text-input', 'hello photon'));
  const adRaw = parseDataInput(findValue(graph, 'ad-input', 'meta'));
  const text = paddingEnabled ? padToBlockSize(textRaw, 16, 'text', logs) : textRaw;
  const ad = paddingEnabled ? padToBlockSize(adRaw, 16, 'ad', logs) : adRaw;
  const key = parseFixedLengthInput(
    findValue(graph, 'key-input', '1234567890123456'),
    16,
    'key',
    paddingEnabled,
    logs,
  );
  const nonce = parseFixedLengthInput(
    findValue(graph, 'nonce-input', '6543210987654321'),
    16,
    'nonce',
    paddingEnabled,
    logs,
  );
  if (paddingEnabled) {
    logs.push(`key(padded/effective): ${toHex(key)}`);
    logs.push(`nonce(padded/effective): ${toHex(nonce)}`);
    logs.push(`text(padded/effective): ${toHex(text)}`);
    logs.push(`ad(padded/effective): ${toHex(ad)}`);
  }

  const encrypted = await engine.aeadEncrypt({
    plaintext: text,
    associatedData: ad,
    key,
    nonce,
  });
  logs.push(`ciphertext(hex): ${toHex(encrypted.ciphertext)}`);
  logs.push(`tag(hex): ${toHex(encrypted.tag)}`);

  const digest = await photonBeetleHash(text);
  logs.push(`hash(hex): ${toHex(digest)}`);

  return logs;
}

function findValue(graph: WorkflowGraph, type: string, fallback: string): string {
  const block = graph.blocks.find((item) => item.type === type);
  return block?.data?.value ?? fallback;
}

function parseDataInput(value: string): Uint8Array {
  const hex = normalizeHex(value);
  if (isHexString(hex)) {
    return hexToBytes(hex);
  }
  return encoder.encode(value);
}

function padToBlockSize(data: Uint8Array, blockSize: number, label: string, logs: string[]): Uint8Array {
  if (data.length === 0) {
    const paddedEmpty = new Uint8Array(blockSize);
    logs.push(`padding applied to ${label}: empty -> ${blockSize} bytes`);
    return paddedEmpty;
  }

  const remainder = data.length % blockSize;
  if (remainder === 0) {
    logs.push(`padding skipped for ${label}: already ${blockSize}-byte aligned`);
    return data;
  }

  const targetLength = data.length + (blockSize - remainder);
  const padded = new Uint8Array(targetLength);
  padded.set(data);
  logs.push(`padding applied to ${label}: ${data.length} -> ${targetLength} bytes`);
  return padded;
}

function parseFixedLengthInput(
  value: string,
  requiredBytes: number,
  label: string,
  paddingEnabled: boolean,
  logs: string[],
): Uint8Array {
  const hex = normalizeHex(value);
  const bytes = isHexString(hex) ? hexToBytes(hex) : encoder.encode(value);

  if (bytes.length === requiredBytes) {
    if (paddingEnabled) {
      logs.push(`padding skipped for ${label}: already ${requiredBytes} bytes`);
    }
    return bytes;
  }

  if (!paddingEnabled) {
    throw new Error(`${label} must be exactly ${requiredBytes} bytes`);
  }

  if (bytes.length > requiredBytes) {
    throw new Error(`${label} cannot be larger than ${requiredBytes} bytes`);
  }

  const padded = new Uint8Array(requiredBytes);
  padded.set(bytes);
  logs.push(`padding applied to ${label}: ${bytes.length} -> ${requiredBytes} bytes`);
  return padded;
}

function normalizeHex(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function isHexString(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function toHex(data: Uint8Array): string {
  return Array.from(data)
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}
