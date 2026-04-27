Grup-B: Grup-1, Grup-5, Grup-7, Grup-8

#PHOTON-Beetle Authenticated Encryption

Drag-and-drop tabanli bir arayuz ile PHOTON-Beetle AEAD akisini test etmenizi saglayan bir prototiptir.

## Ozellikler

- React Flow ile node tabanli surukle-birak arayuz
- PHOTON-Beetle AEAD WASM entegrasyonu
- `Padding` blogu ile giris verilerini kosullu pad etme
- Runtime log panelinde ciphertext/tag/hash ve efektif girislerin gosterimi

## Proje Yapisi

- `apps/web`: Arayuz (Vite + React + TypeScript)
- `packages/core`: Workflow tipleri
- `packages/blocks`: Palette blok katalogu
- `packages/runtime`: Workflow calistirma ve loglama
- `packages/crypto-photon`: PHOTON-Beetle engine (WASM + fallback stub)
- `photon-beetle`: Algoritma C kaynaklari

## Kurulum

```bash
npm install
```

## Gelistirme Modu

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## WASM Derleme

Emscripten kurulumu gerektirir (`emcc` komutu erisilebilir olmali).

```bash
npm run build:wasm --workspace @toolkit/crypto-photon
```

Bu komut asagidaki dosyalari uretir:

- `apps/web/public/photon_beetle_wasm.js`
- `apps/web/public/photon_beetle_wasm.wasm`

## Arayuzde Bloklari Baglama

AEAD encrypt akisi icin oneri:

1. `Key (16 byte)` -> `Padding`
2. `Nonce (16 byte)` -> `Padding`
3. `Text Input` -> `Padding`
4. `Associated Data` -> `Padding`
5. `Padding` -> `PHOTON-Beetle Encrypt`
6. `PHOTON-Beetle Encrypt` -> `Output`

## Padding Davranisi

`Padding` blogu aktif degilse:

- `Key` ve `Nonce` tam 16 byte olmali.

`Padding` blogu aktifse:

- `Key`/`Nonce` 16 byte'dan kucukse zero-padding ile 16 byte'a tamamlanir.
- `Key`/`Nonce` zaten 16 byte ise padding uygulanmaz.
- `Text` ve `AD` 16-byte block hizasina zero-padding ile tamamlanir.
- `Text`/`AD` bos ise 16 byte (128-bit) zero block uretilir.

## Loglar

Runtime panelde asagidaki bilgiler gorunur:

- `engine mode: wasm | stub`
- `engine note` (gerekirse fallback nedeni)
- `padding applied/skipped` satirlari
- `key/nonce/text/ad (padded/effective)`
- `ciphertext(hex)`
- `tag(hex)`
- `hash(hex)`

## Test Vektörleri

Key      : 461060a398b812e0659630d4eee673c2
Nonce    : 6dbc941e6ccedb48e6eb994bfb08cd5e
Data     : 894f0077bf8bcb818cbcb9e1b6eea1223dd8e5ba3a5a467f1c4c2d337b6435d2
Text     : e23c22b545a707c27be9c97db6669b4b3c5d0687cabc13c78f836d810ce010bc30f69587dcb40a9ce609b59ec75c63954284d47b5fb9c83c013b92ff5b7343f6
Tag      : de69da70bffa6f6b2da38af8ea1b2544
Cipher   : 908c82cc001bf8b69389b9db1cbddc630b79a59b25c4afa9ca163f3f3ffa5e2611ee4fd8eb47ff6feb28893ed08f7bd377cb21c129b9685f733f7149d0e22375


Key = 000102030405060708090A0B0C0D0E0F
Nonce = 000102030405060708090A0B0C0D0E0F
Text = 000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F
Data = 000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F
Cipher = 33D7FBDAD65081BCA6307C8EF9FCD7C2573D6E55F230C06D882FADE5B01062DB
Tag = 43206E02D43443600BE2C1FB1EE65BD9


## Notlar

- Test vektorleri hex olarak girilebilir (bosluklar otomatik temizlenir).
- Dogrulama icin `ciphertext(hex)` ve `tag(hex)` degerlerini esas alin.
- Kullanılan ai toollar: Gemini, Claude
