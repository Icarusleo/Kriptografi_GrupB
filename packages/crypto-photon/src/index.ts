export const PHOTON_BEETLE_AEAD_KEY_BYTES = 16;
export const PHOTON_BEETLE_AEAD_NONCE_BYTES = 16;
export const PHOTON_BEETLE_AEAD_TAG_BYTES = 16;
export const PHOTON_BEETLE_HASH_BYTES = 32;

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

export interface PhotonBeetleEngine {
  aeadEncrypt(input: AeadEncryptInput): Promise<AeadEncryptOutput>;
}

export interface EngineLoadResult {
  engine: PhotonBeetleEngine;
  mode: 'wasm' | 'stub';
  reason?: string;
}

export class PhotonBeetleEngineStub implements PhotonBeetleEngine {
  async aeadEncrypt(input: AeadEncryptInput): Promise<AeadEncryptOutput> {
    validateLengths(input.key, PHOTON_BEETLE_AEAD_KEY_BYTES, 'key');
    validateLengths(input.nonce, PHOTON_BEETLE_AEAD_NONCE_BYTES, 'nonce');

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      toBufferSource(input.key),
      { name: 'HKDF' },
      false,
      ['deriveBits'],
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: toBufferSource(input.nonce),
        info: toBufferSource(input.associatedData),
      },
      keyMaterial,
      input.plaintext.length * 8,
    );

    const keystream = new Uint8Array(bits);
    const ciphertext = xorBytes(input.plaintext, keystream);
    const tag = await hashConcat(input.associatedData, ciphertext);

    return { ciphertext, tag: tag.slice(0, PHOTON_BEETLE_AEAD_TAG_BYTES) };
  }
}

export class PhotonBeetleEngineWasm implements PhotonBeetleEngine {
  private readonly module: EmscriptenModule;

  private constructor(module: EmscriptenModule) {
    this.module = module;
  }

  static async create(): Promise<PhotonBeetleEngineWasm> {
    const createModule = await loadWasmFactory();
    const wasmBaseUrl = `${window.location.origin}/`;
    const module = await createModule({
      locateFile: (path: string) => `${wasmBaseUrl}${path}`,
    });
    assertModuleShape(module);
    return new PhotonBeetleEngineWasm(module);
  }

  async aeadEncrypt(input: AeadEncryptInput): Promise<AeadEncryptOutput> {
    validateLengths(input.key, PHOTON_BEETLE_AEAD_KEY_BYTES, 'key');
    validateLengths(input.nonce, PHOTON_BEETLE_AEAD_NONCE_BYTES, 'nonce');

    const msgLen = input.plaintext.length;
    if (!this.module.HEAPU8) {
      throw new Error('WASM memory is unavailable');
    }
    const ctPtr = this.module._malloc(msgLen);
    const tagPtr = this.module._malloc(PHOTON_BEETLE_AEAD_TAG_BYTES);
    const msgPtr = this.module._malloc(msgLen);
    const adPtr = this.module._malloc(input.associatedData.length);
    const noncePtr = this.module._malloc(input.nonce.length);
    const keyPtr = this.module._malloc(input.key.length);

    try {
      this.module.HEAPU8.set(input.plaintext, msgPtr);
      this.module.HEAPU8.set(input.associatedData, adPtr);
      this.module.HEAPU8.set(input.nonce, noncePtr);
      this.module.HEAPU8.set(input.key, keyPtr);

      const encryptFn = this.module.cwrap('photon_beetle_aead_encrypt', 'number', [
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
        throw new Error(`photon_beetle_aead_encrypt failed with code ${rc}`);
      }

      const ciphertext = new Uint8Array(this.module.HEAPU8.subarray(ctPtr, ctPtr + msgLen));
      const tag = new Uint8Array(
        this.module.HEAPU8.subarray(tagPtr, tagPtr + PHOTON_BEETLE_AEAD_TAG_BYTES),
      );
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

export async function createPhotonBeetleEngine(): Promise<EngineLoadResult> {
  try {
    const engine = await PhotonBeetleEngineWasm.create();
    return { engine, mode: 'wasm' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { engine: new PhotonBeetleEngineStub(), mode: 'stub', reason };
  }
}

export async function photonBeetleHash(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', toBufferSource(data));
  return new Uint8Array(digest).slice(0, PHOTON_BEETLE_HASH_BYTES);
}

function validateLengths(value: Uint8Array, size: number, label: string): void {
  if (value.length !== size) {
    throw new Error(`${label} must be exactly ${size} bytes`);
  }
}

function xorBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  if (left.length !== right.length) {
    throw new Error('xor input lengths differ');
  }
  return left.map((value, index) => value ^ right[index]);
}

async function hashConcat(a: Uint8Array, b: Uint8Array): Promise<Uint8Array> {
  const merged = new Uint8Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);
  const digest = await crypto.subtle.digest('SHA-256', toBufferSource(merged));
  return new Uint8Array(digest);
}

function toBufferSource(value: Uint8Array): ArrayBuffer {
  return new Uint8Array(value).buffer;
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

async function loadWasmFactory(): Promise<CreateModuleFactory> {
  const modulePath = `${window.location.origin}/photon_beetle_wasm.js`;
  const factoryModule = await import(/* @vite-ignore */ modulePath);
  return factoryModule.default as CreateModuleFactory;
}
