Grup-B: Grup-1, Grup-5, Grup-7, Grup-8

# PHOTON-Beetle + Elephant Authenticated Encryption

Drag-and-drop tabanli bir arayuz ile PHOTON-Beetle ve Elephant AEAD akislarini test etmenizi saglayan bir prototiptir.

## Ozellikler

- React Flow ile node tabanli surukle-birak arayuz
- PHOTON-Beetle AEAD WASM entegrasyonu
- Elephant-160/176/200 v2 AEAD WASM entegrasyonu
- `Padding` blogu ile giris verilerini kosullu pad etme
- Runtime log panelinde ciphertext/tag/hash ve efektif girislerin gosterimi

## Proje Yapisi

- `apps/web`: Arayuz (Vite + React + TypeScript)
- `packages/core`: Workflow tipleri
- `packages/blocks`: Palette blok katalogu
- `packages/runtime`: Workflow calistirma ve loglama
- `packages/crypto-photon`: PHOTON-Beetle engine (WASM + fallback stub)
- `packages/crypto-elephant`: Elephant-160/176/200 v2 engine (WASM)
- `photon-beetle`: Algoritma C kaynaklari
- `../elephant/elephant`: Elephant algoritma C kaynaklari

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
npm run build:wasm --workspace @toolkit/crypto-elephant
```

Bu komut asagidaki dosyalari uretir:

- `apps/web/public/photon_beetle_wasm.js`
- `apps/web/public/photon_beetle_wasm.wasm`
- `apps/web/public/elephant160_wasm.js`
- `apps/web/public/elephant160_wasm.wasm`
- `apps/web/public/elephant176_wasm.js`
- `apps/web/public/elephant176_wasm.wasm`
- `apps/web/public/elephant200_wasm.js`
- `apps/web/public/elephant200_wasm.wasm`

## Arayuzde Bloklari Baglama

AEAD encrypt akisi icin oneri (PHOTON-Beetle):

1. `Key (16 byte)` -> `Padding`
2. `Nonce (16 byte)` -> `Padding`
3. `Text Input` -> `Padding`
4. `Associated Data` -> `Padding`
5. `Padding` -> `PHOTON-Beetle Encrypt`
6. `PHOTON-Beetle Encrypt` -> `Output`

AEAD encrypt akisi icin oneri (Elephant v2):

1. `Key (16 byte)` -> `Padding`
2. `Nonce (PHOTON:16 / Elephant:12 byte)` -> `Padding`
3. `Text Input` -> `Padding`
4. `Associated Data` -> `Padding`
5. `Padding` -> `Elephant-160 Encrypt (v2)` veya `Elephant-176 Encrypt (v2)` veya `Elephant-200 Encrypt (v2)`
6. `Elephant-xxx Encrypt (v2)` -> `Output`

## Padding Davranisi

`Padding` blogu aktif degilse:

- PHOTON-Beetle: `Key` ve `Nonce` tam 16 byte olmali.
- Elephant v2 varyantlari icin: `Key` 16 byte, `Nonce` 12 byte olmali.

`Padding` blogu aktifse:

- PHOTON-Beetle icin: `Key`/`Nonce` 16 byte'dan kucukse zero-padding ile 16 byte'a tamamlanir.
- Elephant v2 varyantlari icin: `Key` 16 byte, `Nonce` 12 byte hedef uzunluguna pad edilir.
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

## Yeni Degisiklikler 

Bu bolum mevcut yapiyi bozmadan son eklenen gelistirmeleri ozetler:

- Elephant tarafi artik tek varyant degil, `Elephant-160/176/200 v2` olarak uc ayri node ile calisir.
- Elephant WASM derleme akisi uc hedefi birden uretir: `elephant160_wasm`, `elephant176_wasm`, `elephant200_wasm`.
- Elephant runtime secimi, canvas'taki aktif encrypt node'una gore varyant bazli yapilir.
- KAT testi icin UI'da karisiklik olmasin diye `Text Input` ve `Associated Data` varsayilanlari bos deger olacak sekilde duzenlenmistir.
- `Padding` davranisi, sadece ilgili encrypt akisinda etkili olacak sekilde iyilestirilmistir (ayri/dangling padding node yan etki olusturmaz).

## UI'dan Dogrulama (Adim Adim)

KAT dogrulamasini dogru yapmak icin asagidaki adimlari uygulayin:

1. Canvas'i temizleyin (eski node kalmasin).
2. Sadece su node'lari ekleyin:
   - `Key (16 byte)`
   - `Nonce (PHOTON:16 / Elephant:12 byte)`
   - `Text Input`
   - `Associated Data`
   - Test edeceginiz varyant (`Elephant-160 Encrypt (v2)` veya `Elephant-176 Encrypt (v2)` veya `Elephant-200 Encrypt (v2)`)
   - `Output`
3. KAT testi yaparken `Padding` node eklemeyin.
4. Secilen vektor dosyasindan `Key/Nonce/PT/AD` degerlerini girin.
5. `Run Workflow` ile calistirin.
6. Runtime panelde:
   - `algorithm: elephant160v2 | elephant176v2 | elephant200v2`
   - `engine mode: wasm`
   - `ciphertext(hex)` ve `tag(hex)` degerlerini KAT ile birebir karsilastirin.

## Sik Karsilasilan Hatalar

- `padding skipped/applied` satirlari gorunuyorsa, akista hala padding etkisi vardir; KAT testi icin kaldirin.
- `text(padded/effective): 68656c6c6f...` gibi log goruyorsaniz, bos PT yerine metin gonderilmis demektir.
- `engine mode: wasm` yerine farkli bir deger gorunurse, WASM dosyalari veya ortam aktivasyonu kontrol edilmelidir.
- Elephant-200 icin tag uzunlugu digerlerinden farklidir (16 byte); 160/176 varyantlari 8 byte tag kullanir.

## Test Vektörleri

- Elephant-160v2 resmi KAT vektorleri: `docs/elephant160v2-test-vectors.md`
- Elephant-176v2 resmi KAT vektorleri: `docs/elephant176v2-test-vectors.md`
- Elephant-200v2 resmi KAT vektorleri: `docs/elephant200v2-test-vectors.md`
- KAT kaynagi: `../elephant/elephant/Implementations/crypto_aead/elephant160v2/ref/LWC_AEAD_KAT_128_96.txt`
- Elephant-176v2 KAT kaynagi: `../elephant/elephant/Implementations/crypto_aead/elephant176v2/ref/LWC_AEAD_KAT_128_96.txt`
- Elephant-200v2 KAT kaynagi: `../elephant/elephant/Implementations/crypto_aead/elephant200v2/ref/LWC_AEAD_KAT_128_96.txt`


## Notlar

- Test vektorleri hex olarak girilebilir (bosluklar otomatik temizlenir).
- Dogrulama icin `ciphertext(hex)` ve `tag(hex)` degerlerini esas alin.
- Elephant dogrulamasi icin runtime logunda `engine mode: wasm` gorulmelidir; `stub` kabul edilmez.
- Elephant dokumaninin markdown donusumu: `../elephant/elephant/Documents/elephantv2.md`
- Kullanılan ai toollar: Gemini, Claude
