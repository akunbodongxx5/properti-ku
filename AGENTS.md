# PropertiKu — petunjuk agen (Cursor / AI)

## Arsitektur singkat

- **Frontend statis + PWA**: `index.html`, `styles.css`, `app.js` (logika utama), `i18n.js` (string), `sw.js` (cache), `manifest.json`.
- **Data**: `localStorage` prefix `propertiKu_*` (lihat `DB` di `app.js`).
- **Lokal**: butuh server HTTP (bukan `file://`); lihat `README.md`.

## Graphify (konteks codebase)

Proyek ini memakai **Graphify** (`graphify-out/`). Aturan Cursor ada di `.cursor/rules/graphify.mdc`. Folder **`graphify-out/` ada di `.gitignore`** — tidak ikut commit, jadi rebuild tidak memicu loop commit.

1. Sebelum menjawab pertanyaan arsitektur / “di mana file X?”, baca **`graphify-out/GRAPH_REPORT.md`** (atau query `python -m graphify query "..."` dari root repo).
2. Baca file mentah hanya jika perlu detail baris atau pengguna meminta eksplisit.
3. **Rebuild sekali jalan** (manual atau CI lokal):

```bash
python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Atau Windows: `powershell -File scripts/rebuild-graph.ps1`

4. **Otomatis (disarankan di mesin dev):**
   - **Git hook** (lokal, di `.git/hooks/`, tidak ter-push): `python -m graphify hook install` — setelah **commit** dan setelah **checkout branch** (termasuk revert/switch), graph di-rebuild dari snapshot kode saat itu.
   - **File watcher** (saat coding tanpa commit): `powershell -File scripts/graphify-watch.ps1` — debounce ~2s, simpan file → graph ikut.
5. **Clone baru / belum pernah rebuild:** jalankan poin (3) sekali dulu (hook `post-checkout` butuh folder `graphify-out/` sudah pernah ada untuk auto branch-switch; atau tetap pakai rebuild manual).
6. **Copot hook:** `python -m graphify hook uninstall`

## Dependensi

- Python 3.10+ dan paket: `pip install graphifyy`
