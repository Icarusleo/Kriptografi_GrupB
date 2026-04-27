#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "../../../photon-beetle/Implementations/crypto_aead.h"

// Exported wrapper for browser-side calls.
int photon_beetle_aead_encrypt(
  uint8_t *out_ct,
  uint8_t *out_tag,
  const uint8_t *in_msg,
  uint64_t in_msg_len,
  const uint8_t *in_ad,
  uint64_t in_ad_len,
  const uint8_t *in_nonce,
  const uint8_t *in_key
) {
  unsigned long long clen = 0;
  uint8_t *combined = (uint8_t *)malloc((size_t)in_msg_len + 16u);
  if (combined == NULL) {
    return -99;
  }

  int rc = crypto_aead_encrypt(
    combined,
    &clen,
    in_msg,
    in_msg_len,
    in_ad,
    in_ad_len,
    NULL,
    in_nonce,
    in_key
  );

  if (rc == 0 && clen >= 16u) {
    size_t cipher_len = (size_t)clen - 16u;
    memcpy(out_ct, combined, cipher_len);
    memcpy(out_tag, combined + cipher_len, 16u);
  }

  free(combined);
  return rc;
}
