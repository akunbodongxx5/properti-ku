# PropertiKu — petunjuk agen (Cursor / AI)

## Arsitektur singkat

- **Frontend statis + PWA**: `index.html`, `styles.css`, `app.js` (logika utama), `i18n.js` (string), `sw.js` (cache), `manifest.json`.
- **Data**: `localStorage` prefix `propertiKu_*` (lihat `DB` di `app.js`).
- **Lokal**: butuh server HTTP (bukan `file://`); lihat `README.md`.

## Graphify (konteks codebase)

Proyek ini memakai **Graphify** (`graphify-out/`). Aturan Cursor ada di `.cursor/rules/graphify.mdc`.

1. Sebelum menjawab pertanyaan arsitektur / “di mana file X?”, baca **`graphify-out/GRAPH_REPORT.md`** (atau query `python -m graphify query "..."` dari root repo).
2. Baca file mentah hanya jika perlu detail baris atau pengguna meminta eksplisit.
3. Setelah mengubah banyak file kode, **rebuild graph** (AST, tanpa API):

```bash
python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

(Pakai `python3` jika di lingkungan Anda perintahnya itu.)

## Dependensi

- Python 3.10+ dan paket: `pip install graphifyy`
