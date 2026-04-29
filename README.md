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

**Setiap update kode yang berarti:** jalankan rebuild graph di atas **di mesin lokal** agar `graphify-out/` tetap segar untuk Cursor/Graphify. Folder itu **tidak di-commit** (hanya untuk konteks lokal). Hook `graphify hook install` tidak disarankan: rebuild pasca-commit bisa memicu diff graph berulang — pakai rebuild manual + skrip.

Aturan Cursor ada di `.cursor/rules/graphify.mdc` (setelah `cursor install`). Lihat juga `AGENTS.md`.

## Menjalankan lokal

Butuh server HTTP statis (bukan `file://`) agar Service Worker dan fitur yang memanggil API eksternal berfungsi.

### Dua versi preview (Raw vs monetization experiment)

| Versi | Branch Git | Cara jalan | Preview |
|--------|------------|------------|---------|
| **Raw** (stabil, tanpa monetisasi di `main`) | `main` | [`serve.bat`](serve.bat) atau [`server.ps1`](server.ps1) (port default **61036**) | [http://localhost:61036/](http://localhost:61036/) |
| **Monetized (eksperimental)** | `experiment/monetization` | [`serve-experiment.bat`](serve-experiment.bat) — memakai `PORT=61037` + [`server.ps1`](server.ps1) | [http://localhost:61037/](http://localhost:61037/) |

**Jalankan dua preview sekaligus:** clone atau worktree kedua, lalu di folder worktree checkout branch yang sesuai dan jalankan skrip di atas (port berbeda).

```powershell
# Contoh worktree (dari root repo ini):
git fetch origin
git worktree add ..\properti-ku-monetization experiment/monetization
# Lalu di folder ..\properti-ku-monetization jalankan serve-experiment.bat
# Di folder ini (main) jalankan serve.bat — 61036 vs 61037
```

**Windows (ringkas):** `serve.bat` = raw **61036**; setelah checkout `experiment/monetization`, `serve-experiment.bat` = **61037**.

```bash
# Alternatif (Python)
python -m http.server 8080
```

Buka [http://localhost:8080/](http://localhost:8080/) jika memakai contoh di atas.

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
