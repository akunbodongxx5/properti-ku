# Mirror `assetlinks.json` di akar `username.github.io`

Untuk **GitHub Pages project site** (`https://USERNAME.github.io/REPO/`), Chrome memverifikasi Digital Asset Links di **`https://USERNAME.github.io/.well-known/assetlinks.json`** — **bukan** di subfolder `/REPO/.well-known/`.

Repo ini sudah menyajikan file di:

`https://akunbodongxx5.github.io/properti-ku/.well-known/assetlinks.json`

Tapi pemeriksaan cepat menunjukkan **`https://akunbodongxx5.github.io/.well-known/assetlinks.json`** mengembalikan **404** sampai Anda menambahkan mirror.

## Langkah singkat

1. Buat repo baru GitHub bernama persis **`akunbodongxx5.github.io`** (user site).
2. Di repo itu, tambahkan:
   - file kosong **`.nojekyll`** di root (supaya Jekyll tidak menghapus dot-folder),
   - salinan **`/.well-known/assetlinks.json`** yang **sama persis** dengan yang sudah Anda isi fingerprint + `package_name` yang benar di repo **properti-ku**.
3. Aktifkan **GitHub Pages** untuk repo tersebut (branch `main`, folder `/ root`).
4. Tunggu beberapa menit. Uji URL:

   `https://akunbodongxx5.github.io/.well-known/assetlinks.json`

   harus mengembalikan JSON yang sama dengan salinan Anda.

5. Kosongkan cache Chrome di HP atau reinstall APK TWA; buka lagi aplikasi.

Isi **`package_name`** dan **`sha256_cert_fingerprints`** harus dari APK Anda (lihat [`docs/PWA-asset-links.md`](../../docs/PWA-asset-links.md) dan skrip `scripts/extract-signing-from-apk.ps1`).
