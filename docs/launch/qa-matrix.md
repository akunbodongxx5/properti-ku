# QA matrix — PropertiKu (P0 / smoke)

Lingkungan: Chrome Android + Safari iOS, HTTPS atau `http://localhost`, bukan `file://` untuk SW/Telegram.

## P0 — Smoke (setiap rilis)

| ID | Skenario | Given | When | Then |
|----|----------|-------|------|------|
| P0-1 | Fresh install | Storage kosong / clear site data | Buka app | Onboarding atau dashboard tampil tanpa error konsol |
| P0-2 | Demo data | Onboarding | Tap data contoh | Data terisi; dashboard punya angka |
| P0-3 | Navigasi | App load | Tap semua tab bawah | Tidak ada error; judul halaman sesuai |
| P0-4 | Bahasa | App load | Ganti ID ↔ EN | String utama tidak putus |
| P0-5 | Tema | Settings | Toggle gelap | Tema persist setelah reload |
| P0-6 | Reset | Settings | Reset semua data + konfirmasi | Data kosong; tidak crash |

## P1 — Pembayaran & grup

| ID | Skenario | Then |
|----|----------|------|
| P1-1 | Pembayaran → Semua → Per penyewa | Grup default tertutup; expand manual |
| P1-2 | Filter Belum Bayar / Lunas | Grup terbuka; isi sesuai filter |
| P1-3 | Edit / hapus satu pembayaran | Daftar konsisten |

## P1 — Laporan (mode Pro)

| ID | Skenario | Then |
|----|----------|------|
| P1-4 | Buka Laporan; klik sub-tab utama | Tidak layar putih permanen |
| P1-5 | Mode Simple | Hanya ringkasan; tidak ada dead link ke fitur tersembunyi |

## P1 — Offline / SW

| ID | Skenario | Then |
|----|----------|------|
| P1-6 | Offline setelah kunjungan pertama | Shell tidak blank total; pesan jelas jika perlu jaringan |
| P1-7 | Deploy baru | Hard refresh atau bump `?v=` — JS terbaru terpakai |

## P1 — Storage penuh (simulasi)

| ID | Skenario | Then |
|----|----------|------|
| P1-8 | Quota exceeded (devtools) | Toast/peringatan penyimpanan; tidak corrupt silent |

## P1 — Privasi & legal

| ID | Skenario | Then |
|----|----------|------|
| P1-9 | Settings → Kebijakan privasi | `privacy.html` terbuka |
| P1-10 | Baca privacy | Selaras dengan perilaku (data lokal, Telegram opsional, analytics opsional) |
