# Digital Asset Links (Android / TWA / PWA Builder)

**Penting (GitHub Pages `github.io/REPO/`):** Chrome memeriksa `https://USER.github.io/.well-known/assetlinks.json` (akar **host**), sementara PWA Anda mungkin hanya memasang file di `https://USER.github.io/REPO/.well-known/`. Jika **akar** domain mengembalikan 404, bilah URL di APK TWA sering **tetap tampil** — perlu **salinan** `assetlinks.json` di repo user site `USER.github.io` (lihat [extras/github-user-pages-root/](../extras/github-user-pages-root/)).

Uji otomatis: `pwsh -File scripts/verify-digital-asset-links.ps1`

File utama di repo ini: [`.well-known/assetlinks.json`](../.well-known/assetlinks.json).

Setelah deploy GitHub Pages, pastikan bisa dibuka di browser (tanpa login):

`https://akunbodongxx5.github.io/properti-ku/.well-known/assetlinks.json`

Kalau dapat 404: pastikan file sudah di `main`, ada file kosong [`.nojekyll`](../.nojekyll) di root repo, dan tunggu beberapa menit.

## Isi yang wajib diganti

`assetlinks.json` **tidak boleh** dibiarkan berisi teks `REPLACE_*`. Ganti dengan data dari APK Anda.

### 1. `package_name`

Nama paket Java aplikasi Android (TWA) dari PWA Builder, misalnya `com.pwabuilder.xxxxx` atau yang Anda tentukan saat build.

Cara cepat: buka APK di Android Studio → **Build Analyzer** / atau lihat **AndroidManifest.xml** di paket yang diunduh dari PWA Builder.

### 2. `sha256_cert_fingerprints`

Fingerprint **sertifikat penandatanganan** APK (bukan MD5/SHA1).

**Opsi A — dari keystore yang dipakai PWA Builder saat build:**

```text
keytool -list -v -keystore your-release.keystore -alias your-alias
```

Salin baris **SHA256** (format `AA:BB:CC:...`).

**Opsi B — aplikasi sudah di Google Play:**

Play Console → app Anda → **Setup** → **App integrity** → salin **SHA-256 certificate fingerprint** (App signing key certificate). Itu yang dipakai untuk verifikasi di perangkat pengguna.

Setelah app di Play dengan **Play App Signing**, biasanya perlu **dua** fingerprint di array: dari keystore upload Anda **dan** dari Play (lihat [dokumen PWA Builder](https://docs.pwabuilder.com/#/android/asset-links)).

Contoh dengan dua sidik jari:

```json
"sha256_cert_fingerprints": [
  "AA:BB:...",
  "CC:DD:..."
]
```

## Verifikasi

1. Deploy `assetlinks.json` yang sudah diisi.
2. Tunggu ±10 menit, lalu di HP Android buka app TWA lagi (atau clear data Chrome jika perlu).
3. Alat: [Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator) atau perintah `adb` / logcat bila masih gagal.

## Catatan GitHub Pages (project site)

Host PWA Anda: `akunbodongxx5.github.io`, path: `/properti-ku/`. File asset links untuk situs ini berada di **`/properti-ku/.well-known/assetlinks.json`** (sama dengan URL di atas).

Jika Chrome masih meminta file di **akar domain** `https://akunbodongxx5.github.io/.well-known/` (tanpa `/properti-ku/`), solusi umum adalah menambahkan salinan atau redirect di repo **user site** `username.github.io`, atau memakai **custom domain** pada repo ini sehingga origin PWA satu domain penuh. Lihat diskusi [PWA Builder #2695](https://github.com/pwa-builder/PWABuilder/issues/2695).
