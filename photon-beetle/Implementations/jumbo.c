#include "crypto_aead.h"
#include <string.h>

#define N_BYTES 22
#define SBOX_HEX {0xE, 0xD, 0xB, 0x0, 0x2, 0x1, 0x4, 0xF, 0x7, 0xA, 0x8, 0x5, 0x9, 0xC, 0x3, 0x6}

static const unsigned char sbox[] = SBOX_HEX;

static void sbox_layer(unsigned char *state) {
    for (int i = 0; i < N_BYTES; i++) {
        state[i] = (sbox[state[i] & 0x0F]) | (sbox[(state[i] >> 4) & 0x0F] << 4);
    }
}

static void p_layer(unsigned char *state) {
    unsigned char next_state[N_BYTES] = {0};
    for (int j = 0; j < 176; j++) {
        int pos = (j == 175) ? 175 : (44 * j) % 175;
        if ((state[j / 8] >> (j % 8)) & 1) {
            next_state[pos / 8] |= (1 << (pos % 8));
        }
    }
    memcpy(state, next_state, N_BYTES);
}

static void spongent_176(unsigned char *state) {
    for (int i = 1; i <= 90; i++) {
        sbox_layer(state);
        p_layer(state);
    }
}

static void get_mask(unsigned char *mask, const unsigned char *key, int a, int b) {
    unsigned char temp[N_BYTES];
    memcpy(temp, key, 16);
    memset(temp + 16, 0, N_BYTES - 16);
    spongent_176(temp);
    memcpy(mask, temp, N_BYTES);
}

int crypto_aead_encrypt(unsigned char *c, unsigned long long *clen,
                        const unsigned char *m, unsigned long long mlen,
                        const unsigned char *ad, unsigned long long adlen,
                        const unsigned char *nsec, const unsigned char *npub,
                        const unsigned char *k) {
    *clen = mlen + CRYPTO_ABYTES;
    unsigned char mask[N_BYTES];
    
    for (unsigned long long i = 0; i < (mlen + N_BYTES - 1) / N_BYTES; i++) {
        get_mask(mask, k, i, 1);
        for (int j = 0; j < N_BYTES && (i * N_BYTES + j) < mlen; j++) {
            c[i * N_BYTES + j] = m[i * N_BYTES + j] ^ mask[j];
        }
    }
    return 0;
}

int crypto_aead_decrypt(unsigned char *m, unsigned long long *mlen,
                        unsigned char *nsec,
                        const unsigned char *c, unsigned long long clen,
                        const unsigned char *ad, unsigned long long adlen,
                        const unsigned char *npub, const unsigned char *k) {
    *mlen = clen - CRYPTO_ABYTES;
    unsigned char mask[N_BYTES];
    
    for (unsigned long long i = 0; i < (*mlen + N_BYTES - 1) / N_BYTES; i++) {
        get_mask(mask, k, i, 1);
        for (int j = 0; j < N_BYTES && (i * N_BYTES + j) < *mlen; j++) {
            m[i * N_BYTES + j] = c[i * N_BYTES + j] ^ mask[j];
        }
    }
    return 0;
}
