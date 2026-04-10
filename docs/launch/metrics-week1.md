# Metrik minggu pertama — PropertiKu

Definisi harus diputuskan sebelum mengukur (satu sumber kebenaran di analytics).

## Aktivasi (disarankan)

**Definisi A (sederhana):** pengguna yang dalam 24 jam pertama menyelesaikan salah satu:

- `onboarding_complete` (tutup onboarding dengan mulai / demo), atau
- minimal **1** pembayaran atau **1** unit + **1** penyewa tercatat.

**Definisi B (ketat):** pengguna yang mencatat **minimal 1 pembayaran** dalam 7 hari pertama.

Simpan definisi yang dipilih di dashboard analytics.

## Retention

- **D1:** % pengguna yang kembali pada hari kalender setelah hari pertama (bukan 24 jam).
- **D7:** % pengguna aktif pada hari ke-7 setelah pertama kali `app_open`.

Gunakan `user_pseudo_id` (GA4) atau ID anonim stabil di `localStorage` jika custom.

## Event yang disarankan (jika analytics aktif)

| Event | Parameter | Catatan |
|-------|-----------|---------|
| `app_open` | `source` (pwa / browser) | Sekali per session atau per load |
| `onboarding_complete` | `used_demo` | Setelah demo atau mulai |
| `payment_recorded` | `type` income/expense | Inti nilai |
| `settings_open` | — | Opsional |
| `client_error` | `fatal` | Mirror Sentry |

## Target contoh (sesuaikan)

| Metrik | Target awal |
|--------|----------------|
| Crash-free sessions | ≥ 99% |
| D1 retention | ≥ 15–25% (organic) |
| Aktivasi (definisi A) | ≥ 30% dari install |

## Peringatan

Tanpa backend login, “unik pengguna” = perangkat/browser; angka bisa overcount jika multi-tab atau clear storage.
