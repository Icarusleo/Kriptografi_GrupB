#include <stdint.h>
#include <stdlib.h>
#include <string.h>

int crypto_aead_encrypt(
  unsigned char *c,
  unsigned long long *clen,
  const unsigned char *m,
  unsigned long long mlen,
  const unsigned char *ad,
  unsigned long long adlen,
  const unsigned char *nsec,
  const unsigned char *npub,
  const unsigned char *k
);

// Exported wrapper for browser-side calls.
int elephant160_aead_encrypt(
  uint8_t *out_ct,
  uint8_t *out_tag,
  const uint8_t *in_msg,
  uint64_t in_msg_len,
  const uint8_t *in_ad,
  uint64_t in_ad_len,
  const uint8_t *in_nonce,
  const uint8_t *in_key
) {
  const uint64_t tag_len = 8u;
  unsigned long long clen = 0;
  uint8_t *combined = (uint8_t *)malloc((size_t)in_msg_len + (size_t)tag_len);
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

  if (rc == 0 && clen >= tag_len) {
    size_t cipher_len = (size_t)clen - (size_t)tag_len;
    memcpy(out_ct, combined, cipher_len);
    memcpy(out_tag, combined + cipher_len, (size_t)tag_len);
  }

  free(combined);
  return rc;
}
