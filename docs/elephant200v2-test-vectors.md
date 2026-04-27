# Elephant-200v2 Test Vectors (KAT)

Source: `../elephant/elephant/Implementations/crypto_aead/elephant200v2/ref/LWC_AEAD_KAT_128_96.txt`

Notes:
- Parameters: key = 16 bytes, nonce = 12 bytes, tag = 16 bytes.
- In KAT file, `CT` is `ciphertext || tag`.
- Below, values are split into `ciphertext` and `tag`.

## Shared Inputs

- `key`: `000102030405060708090A0B0C0D0E0F`
- `nonce`: `000102030405060708090A0B`

## Vectors

### Count 1
- `pt`: ``
- `ad`: ``
- `ciphertext`: ``
- `tag`: `48BF257607D09EBE1C0E108B91058877`

### Count 2
- `pt`: ``
- `ad`: `00`
- `ciphertext`: ``
- `tag`: `6E3705ABDC45250CEEB36E4D991B741D`

### Count 3
- `pt`: ``
- `ad`: `0001`
- `ciphertext`: ``
- `tag`: `9D1951923B861D2DCD0AAE0D3CAFA4F8`

### Count 34
- `pt`: `00`
- `ad`: ``
- `ciphertext`: `1E`
- `tag`: `F9BC909367EAE8FE46CAECCD585C5783`

### Count 35
- `pt`: `00`
- `ad`: `00`
- `ciphertext`: `1E`
- `tag`: `0821FFBA7BE23E72C750F24FA07E73AC`

### Count 36
- `pt`: `00`
- `ad`: `0001`
- `ciphertext`: `1E`
- `tag`: `E55C744C1AF8F1D0F7991E7988E9F234`
