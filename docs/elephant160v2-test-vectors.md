# Elephant-160v2 Test Vectors (KAT)

Source: `../elephant/elephant/Implementations/crypto_aead/elephant160v2/ref/LWC_AEAD_KAT_128_96.txt`

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
- `tag`: `6655B717736ADFF3`

### Count 2
- `pt`: ``
- `ad`: `00`
- `ciphertext`: ``
- `tag`: `B6925C1C8CA1058E`

### Count 3
- `pt`: ``
- `ad`: `0001`
- `ciphertext`: ``
- `tag`: `40543F7E63F35EE0`

### Count 34
- `pt`: `00`
- `ad`: ``
- `ciphertext`: `08`
- `tag`: `0A9B28CC44C8691C`

### Count 35
- `pt`: `00`
- `ad`: `00`
- `ciphertext`: `08`
- `tag`: `378E239BEADDC5A9`

### Count 36
- `pt`: `00`
- `ad`: `0001`
- `ciphertext`: `08`
- `tag`: `CB5BEA51DDB9E0C5`
