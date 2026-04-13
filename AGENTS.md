# PropertiKu — petunjuk agen (Cursor / AI)

## Arsitektur singkat

- **Frontend statis + PWA**: `index.html`, `styles.css`, `app.js` (logika utama), `i18n.js` (string), `sw.js` (cache), `manifest.json`.
- **Data**: `localStorage` prefix `propertiKu_*` (lihat `DB` di `app.js`).
- **Lokal**: butuh server HTTP (bukan `file://`); lihat `README.md`.

## Graphify (konteks codebase)

Proyek ini memakai **Graphify** (`graphify-out/`). Aturan Cursor ada di `.cursor/rules/graphify.mdc`.

1. Sebelum menjawab pertanyaan arsitektur / “di mana file X?”, baca **`graphify-out/GRAPH_REPORT.md`** (atau query `python -m graphify query "..."` dari root repo).
2. Baca file mentah hanya jika perlu detail baris atau pengguna meminta eksplisit.
3. **Wajib:** setiap kali ada **perubahan berarti pada kode** (`app.js`, dll.), **rebuild graph** lalu **ikutkan** `graphify-out/` dalam commit/push yang sama (jangan push kode tanpa graph yang segar).

```bash
python -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Atau di Windows: `powershell -File scripts/rebuild-graph.ps1`

4. **Hook Git `graphify hook install` tidak disarankan** di repo ini: rebuild pasca-commit bisa menghasilkan **diff nondeterministik** pada `graphify-out/` (loop commit). **Pola aman:** sebelum `git push`, jalankan rebuild di atas, lalu `git add graphify-out` dan commit bersama (atau satu commit `chore: graphify-out` tepat sebelum push).

## Dependensi

- Python 3.10+ dan paket: `pip install graphifyy`
