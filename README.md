# PropertiKu

Aplikasi web (PWA) untuk mengelola properti sewaan: unit, penyewa, pembayaran, dan laporan.

## Tablet & iPad

Layout memakai lebar kolom adaptif (hingga ~960px di layar lebar), target sentuh ~48px, dan dashboard memasang **cashflow** dan **tagihan mendatang** berdampingan mulai lebar ≥768px. Modal form di layar ≥900px tampil sebagai kartu di tengah (bukan hanya sheet dari bawah).

## Graphify (Cursor / AI — konteks codebase)

Proyek ini bisa memakai [Graphify](https://github.com/safishamsi/graphify) agar asisten kode membaca `graphify-out/GRAPH_REPORT.md` dulu, bukan seluruh file mentah.

```bash
pip install graphifyy
python -m graphify cursor install
python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
# Windows: powershell -File scripts/rebuild-graph.ps1
```

**Setiap update kode yang berarti:** rebuild graph di atas, lalu commit **`graphify-out/`** bersama perubahan lain (jangan push kode dengan graph basi). Opsional sekali per clone: `python -m graphify hook install` — setelah `git commit`, graph dibuild ulang; jika masih ada diff di `graphify-out/`, commit lagi.

Aturan Cursor ada di `.cursor/rules/graphify.mdc` (setelah `cursor install`). Lihat juga `AGENTS.md`.

## Menjalankan lokal

Butuh server HTTP statis (bukan `file://`) agar Service Worker dan fitur yang memanggil API eksternal berfungsi.

```bash
# Contoh Python
python -m http.server 8080
```

Buka `http://localhost:8080`.

## Deploy

1. Unggah isi repo ke hosting statis (GitHub Pages, Netlify, VPS + nginx, dll.).
2. **Setelah mengubah** `app.js`, `i18n.js`, atau `styles.css`, naikkan versi cache:
   - Di [`index.html`](index.html): query string `?v=` pada skrip dan stylesheet (mis. `?v=28`).
   - Di [`sw.js`](sw.js): `CACHE_NAME` (mis. `propertiKu-v28`) dan string `?v=` di array `ASSETS`.
3. Pengguna yang sudah pernah membuka app mungkin perlu **hard refresh** atau menutup tab agar bundle baru terpakai.

## Kebijakan privasi

Halaman statis: [`privacy.html`](privacy.html). Tautan dari **Pengaturan** di dalam app.

## Analytics & error monitoring (opsional)

Di [`index.html`](index.html), objek `window.PROPERTIKU_CONFIG` dapat diisi:

```html
<script>
window.PROPERTIKU_CONFIG = {
  ga4MeasurementId: '',  // mis. G-XXXXXXXX
  sentryDsn: '',         // dari Sentry SDK
  environment: 'production'
};
</script>
```

[`analytics.js`](analytics.js) dimuat setelah konfigurasi; jika kedua ID kosong, tidak ada request ke penyedia pihak ketiga.

## Dokumentasi rilis

- [Salinan store & landing](docs/launch/store-copy.md)
- [QA matrix](docs/launch/qa-matrix.md)
- [Metrik minggu 1](docs/launch/metrics-week1.md)

## Lisensi

Sesuai repositori pemilik proyek.
