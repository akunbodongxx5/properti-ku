# Branch `experiment/monetization`

Percobaan **monetisasi** (paket Free/Pro, batas unit, export CSV/PDF, kode promo). **Tidak** ada di `main`.

- **Raw:** `main` → preview [http://localhost:61036/](http://localhost:61036/) (`serve.bat`).
- **Eksperimen:** checkout branch ini → [http://localhost:61037/](http://localhost:61037/) (`serve-experiment.bat`).

```bash
git fetch origin
git checkout experiment/monetization
# atau worktree:
git worktree add ../properti-ku-monetization experiment/monetization
```

Push ke remote: `git push -u origin experiment/monetization`.
