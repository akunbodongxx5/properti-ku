# Branch `experiment/monetization`

Percobaan **monetisasi** (paket Free/Pro, batas unit, export CSV/PDF Pro-only, kode promo). Bisa di-merge ke `main` untuk rilis stabil setelah keputusan produk & QA; branch ini tetap berguna untuk eksperimen lanjutan paralel dengan [git worktree](https://git-scm.com/docs/git-worktree).

- **Stabil / raw:** `main` — preview [http://localhost:61036/](http://localhost:61036/) dengan `serve.bat`.
- **Eksperimen:** checkout branch ini — preview [http://localhost:61037/](http://localhost:61037/) dengan `serve-experiment.bat` (`PORT=61037`).

```bash
git fetch origin
git checkout experiment/monetization
# atau worktree:
git worktree add ../properti-ku-monetization experiment/monetization
```

Push ke remote: `git push -u origin experiment/monetization`.
