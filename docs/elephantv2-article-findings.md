# Elephant v2 Article Findings (PDF)

Source checked: `../elephant/elephant/Documents/elephantv2.pdf`

## Result

The article PDF does **not** include concrete AEAD test vectors in KAT format (no `Count/Key/Nonce/PT/AD/CT/Tag` sections).

## Exact pages verified

- **Page 2**: introduces instances, including Dumbo (`Elephant-Spongent-π[160]`).
- **Page 4**: `Algorithm 1 Elephant encryption algorithm enc` (generic formula, not numeric vectors).
- **Page 11**: explicitly states Elephant members use a **96-bit nonce**.

## Why this matters

- The paper describes the mode and security properties.
- Concrete input/output vectors are distributed separately in implementation KAT files, e.g.:
  - `../elephant/elephant/Implementations/crypto_aead/elephant160v2/ref/LWC_AEAD_KAT_128_96.txt`
