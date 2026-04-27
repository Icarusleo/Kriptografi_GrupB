#include <stdio.h>
#include "crypto_aead.h"

int main() {
    unsigned char k[16] = {0};
    unsigned char n[12] = {0};
    unsigned char m[] = "DENEME";
    unsigned char c[100];
    unsigned long long clen;

    crypto_aead_encrypt(c, &clen, m, 6, NULL, 0, NULL, n, k);
    printf("Sifreleme tamamlandi, uzunluk: %llu\n", clen);
    return 0;
}
