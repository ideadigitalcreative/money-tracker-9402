# Dompet — Design

## Cloud + AI v2
Seluruh fitur web menggunakan akun Google/email-password dan dokumen finansial privat berversi di Turso. Tampilan lavender Android dipertahankan, sidebar desktop; lima tab utama di ponsel (Beranda, Transaksi, Dompet, AI, Rencana), Akun melalui avatar. Kategori dibuka dari input transaksi; Analitik dari ringkasan. Tambah manual, catatan AI, suara WAV, scan struk lewat satu bottom sheet dengan konfirmasi. UI lengkap dalam id/en/ms/ja/zh. Multi-dompet satu mata uang per dompet; transfer atomik dan kurs referensi bertanggal untuk ringkasan. Anggaran, target tabungan, rutinitas, impor/ekspor, konflik sinkronisasi yang terlihat, bukan overwrite diam-diam. AI hanya server-side, per user rate limit; file asli transient, tidak disimpan. File baru cloud-app.tsx, komponen finance/, cloud.css, shared/finance.ts, routes/finance/exchange/intelligence dan Better Auth.

## Pembaruan mobile Android
Pada lebar <=650px, web memiliki app bar lavender, navigasi bawah tetap (Beranda, Transaksi, Kategori, Analitik, Akun), tombol tambah mengambang, kartu ringkasan besar dan transaksi bergaya daftar. Pemilih kategori empat kolom dengan ikon warna pada kotak putih mengikuti lampiran; tambah pengeluaran berupa bottom sheet. Desktop tidak berubah. Tetap aplikasi web, bukan paket APK.

Pelacak pengeluaran web responsif berbahasa Indonesia, tanpa login, penyimpanan lokal. Referensi lampiran diterjemahkan menjadi sidebar putih, kartu lavender lembut dan pemilih kategori berwarna.
Font Poppins untuk judul, Plus Jakarta Sans untuk body. Tinta #262336, muted #9693a4, aksen #8b5cf6, lavender #eee6ff, kanvas #f8f9fc, hijau #40ad87. Kartu radius 20px, border tipis, ruang lega. Sidebar 230px, dashboard dua kolom, navigasi horizontal pada ponsel. Fokus keyboard dan reduced-motion didukung.
Layar: Ringkasan, Transaksi, Kategori, Analitik, Pengaturan. Modal tambah/edit transaksi dan anggaran, filter bulan, pencarian dan ekspor CSV. Data contoh dilabeli. Tidak ada API atau tabel database karena localStorage disetujui. File UI dashboard.tsx, lib/spending.ts, styles.css; index.tsx re-export saja.

One-line description of the app, the platforms it ships on, the visual direction (style, feel), and the core job it does for the user.

## Brand & Colors

One token set, consumed per platform:

- **Web & desktop**: CSS variables in `packages/web/src/web/styles.css` (desktop loads the web UI).
- **Mobile**: `Colors.light` / `Colors.dark` in `packages/mobile/constants/theme.ts`, read via `useColors()`; `userInterfaceStyle: "automatic"` follows the system light/dark setting.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| primary | #1F1F1F | #E5E5E5 | Buttons, active tab, accents |
| background | #FFFFFF | #0A0A0A | Page/screen background |
| card | #FFFFFF | #1A1A1A | Cards, surfaces |
| foreground | #171717 | #FAFAFA | Primary text |
| mutedForeground | #737373 | #A3A3A3 | Secondary text |
| border | #E5E5E5 | #262626 | Hairlines |
| destructive | #DC2626 | #EF4444 | Delete / errors |

## Typography

Name the display + body pairing here. Web: set font families in `styles.css` (self-hosted files go in `packages/web/public/fonts/`). Mobile: system font by default; load custom fonts with `useFonts` from `expo-font` and reference them via `Fonts` in `constants/theme.ts`.

## Pages & Screens

List each page/screen, its route file, and what it shows. Example:

- **Web — Home** (`packages/web/src/web/pages/index.tsx`) — what the user sees first.
- **Mobile — Home** (`packages/mobile/app/(tabs)/index.tsx`) — main tab.
- Add web pages under `src/web/pages/` (+ route in `app.tsx`); mobile tabs under `app/(tabs)/`, stack/modal screens under `app/`.

## Key User Flows

1. Describe the primary flow end to end (open → action → result).
2. ...

## Architecture

- **API**: typed oRPC client (`lib/api.ts` in each package) → the backend in `@template/web`. Query/mutation hooks live in `queries/` (one file per feature); pages/screens call them with `@tanstack/react-query`.
- **State/sync**: TanStack Query with optimistic updates for instant-feel interactions.
- **Auth / payments / uploads**: see `skills/app/references/` when those features are needed.
