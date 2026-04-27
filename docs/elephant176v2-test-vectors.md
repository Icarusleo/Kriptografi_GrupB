# Elephant-176v2 Test Vectors (KAT)

Source: `../elephant/elephant/Implementations/crypto_aead/elephant176v2/ref/LWC_AEAD_KAT_128_96.txt`

Notes:
- Parameters: key = 16 bytes, nonce = 12 bytes, tag = 8 bytes.
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
- `tag`: `1407EF22639E4AE1`

### Count 2
- `pt`: ``
- `ad`: `00`
- `ciphertext`: ``
- `tag`: `BA8C57132B2035BE`

### Count 3
- `pt`: ``
- `ad`: `0001`
- `ciphertext`: ``
- `tag`: `40A67041FB2D0432`

### Count 34
- `pt`: `00`
- `ad`: ``
- `ciphertext`: `AE`
- `tag`: `9325793FAC005F2F`

### Count 35
- `pt`: `00`
- `ad`: `00`
- `ciphertext`: `AE`
- `tag`: `EB7FF95AF601700F`

### Count 36
- `pt`: `00`
- `ad`: `0001`
- `ciphertext`: `AE`
- `tag`: `FFF837EC96D999ED`
