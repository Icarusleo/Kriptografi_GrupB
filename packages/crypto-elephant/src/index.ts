export const ELEPHANT_AEAD_KEY_BYTES = 16;
export const ELEPHANT_AEAD_NONCE_BYTES = 12;

export type ElephantVariant = 'elephant160v2' | 'elephant176v2' | 'elephant200v2';

export interface AeadEncryptInput {
  plaintext: Uint8Array;
  associatedData: Uint8Array;
  key: Uint8Array;
  nonce: Uint8Array;
}

export interface AeadEncryptOutput {
  ciphertext: Uint8Array;
  tag: Uint8Array;
}

export interface ElephantEngine {
  aeadEncrypt(input: AeadEncryptInput): Promise<AeadEncryptOutput>;
}

export interface EngineLoadResult {
  engine: ElephantEngine;
  mode: 'wasm';
}

export class ElephantEngineWasm implements ElephantEngine {
  private readonly module: EmscriptenModule;
  private readonly moduleName: string;
  private readonly exportName: string;
  private readonly tagBytes: number;

  private constructor(
    module: EmscriptenModule,
    moduleName: string,
    exportName: string,
    tagBytes: number,
  ) {
    this.module = module;
    this.moduleName = moduleName;
    this.exportName = exportName;
    this.tagBytes = tagBytes;
  }

  static async create(variant: ElephantVariant): Promise<ElephantEngineWasm> {
    const config = getVariantConfig(variant);
    const createModule = await loadWasmFactory(config.moduleName);
    const wasmBaseUrl = `${window.location.origin}/`;
    const module = await createModule({
      locateFile: (path: string) => `${wasmBaseUrl}${path}`,
    });
    assertModuleShape(module);
    return new ElephantEngineWasm(module, config.moduleName, config.exportName, config.tagBytes);
  }

  async aeadEncrypt(input: AeadEncryptInput): Promise<AeadEncryptOutput> {
    validateLengths(input.key, ELEPHANT_AEAD_KEY_BYTES, 'key');
    validateLengths(input.nonce, ELEPHANT_AEAD_NONCE_BYTES, 'nonce');

    const msgLen = input.plaintext.length;
    if (!this.module.HEAPU8) {
      throw new Error('WASM memory is unavailable');
    }
    const ctPtr = this.module._malloc(msgLen);
    const tagPtr = this.module._malloc(this.tagBytes);
    const msgPtr = this.module._malloc(msgLen);
    const adPtr = this.module._malloc(input.associatedData.length);
    const noncePtr = this.module._malloc(input.nonce.length);
    const keyPtr = this.module._malloc(input.key.length);

    try {
      this.module.HEAPU8.set(input.plaintext, msgPtr);
      this.module.HEAPU8.set(input.associatedData, adPtr);
      this.module.HEAPU8.set(input.nonce, noncePtr);
      this.module.HEAPU8.set(input.key, keyPtr);

      const encryptFn = this.module.cwrap(this.exportName, 'number', [
        'number',
        'number',
        'number',
        'bigint',
        'number',
        'bigint',
        'number',
        'number',
      ]);

      const rc = encryptFn(
        ctPtr,
        tagPtr,
        msgPtr,
        BigInt(msgLen),
        adPtr,
        BigInt(input.associatedData.length),
        noncePtr,
        keyPtr,
      );

      if (rc !== 0) {
        throw new Error(
          `${this.exportName} failed with code ${rc} (module: ${this.moduleName})`,
        );
      }

      const ciphertext = new Uint8Array(this.module.HEAPU8.subarray(ctPtr, ctPtr + msgLen));
      const tag = new Uint8Array(this.module.HEAPU8.subarray(tagPtr, tagPtr + this.tagBytes));
      return { ciphertext, tag };
    } finally {
      this.module._free(ctPtr);
      this.module._free(tagPtr);
      this.module._free(msgPtr);
      this.module._free(adPtr);
      this.module._free(noncePtr);
      this.module._free(keyPtr);
    }
  }
}

export async function createElephantEngine(variant: ElephantVariant): Promise<EngineLoadResult> {
  const engine = await ElephantEngineWasm.create(variant);
  return { engine, mode: 'wasm' };
}

export function getElephantTagBytes(variant: ElephantVariant): number {
  return getVariantConfig(variant).tagBytes;
}

function validateLengths(value: Uint8Array, size: number, label: string): void {
  if (value.length !== size) {
    throw new Error(`${label} must be exactly ${size} bytes`);
  }
}

type CreateModuleFactory = (opts: {
  locateFile: (path: string) => string;
}) => Promise<unknown>;

interface EmscriptenModule {
  cwrap: (
    name: string,
    returnType: string,
    argTypes: string[],
  ) => (...args: Array<number | bigint>) => number;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
}

function assertModuleShape(module: unknown): asserts module is EmscriptenModule {
  const maybe = module as Partial<EmscriptenModule> | null | undefined;
  if (
    !maybe ||
    typeof maybe.cwrap !== 'function' ||
    typeof maybe._malloc !== 'function' ||
    typeof maybe._free !== 'function' ||
    !(maybe.HEAPU8 instanceof Uint8Array)
  ) {
    throw new Error('Invalid WASM module shape');
  }
}

async function loadWasmFactory(moduleName: string): Promise<CreateModuleFactory> {
  const modulePath = `${window.location.origin}/${moduleName}.js`;
  const factoryModule = await import(/* @vite-ignore */ modulePath);
  return factoryModule.default as CreateModuleFactory;
}

function getVariantConfig(variant: ElephantVariant): {
  moduleName: string;
  exportName: string;
  tagBytes: number;
} {
  switch (variant) {
    case 'elephant160v2':
      return {
        moduleName: 'elephant160_wasm',
        exportName: 'elephant160_aead_encrypt',
        tagBytes: 8,
      };
    case 'elephant176v2':
      return {
        moduleName: 'elephant176_wasm',
        exportName: 'elephant176_aead_encrypt',
        tagBytes: 8,
      };
    case 'elephant200v2':
      return {
        moduleName: 'elephant200_wasm',
        exportName: 'elephant200_aead_encrypt',
        tagBytes: 16,
      };
    default:
      throw new Error(`Unsupported Elephant variant: ${variant}`);
  }
}
