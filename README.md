# Aku Mw Magang

Aplikasi Frontend React 19 + TypeScript (`strict: true`) dengan desain Swiss-editorial arsitektural untuk mengelola seluruh perjalanan magang: Landing Page interaktif, eksplorasi lowongan & skill match live, War Room pipeline ber-state machine ketat, Multi-CV Vault, latihan interview berwaktu, hingga Offer Comparator berbobot.

## Tech Stack

- **React 19** + **TypeScript** (`strict: true`, tanpa tipe `any`)
- **Vite** (`react-ts`)
- **Pure CSS** + self-hosted `Manrope` variable font (Light & Dark mode, offline-ready)
- **lucide-react** (ikon ringan)
- Seluruh state, fetch, form, timer, dan penyimpanan lokal ditulis menggunakan React Hooks bawaan & Custom Hooks (`useLocalStorage<T>`, `useDebounce<T>`).

## Fitur Utama & Tambahan

1. **Landing Page Arsitektural**: Hero Swiss-grid dengan aset fotografi khusus, tombol `Coba Demo` 1-klik, indeks 3 pilar interaktif, dan ringkasan live database lokal.
2. **Profil Skill Kapten & Eksplorasi Lowongan**: manajemen skill (`localStorage`), fetch Remotive API dengan `AbortController`, fallback lokal 15 lowongan tech (`public/magang-fallback.json`), search debounced 400ms, filter kategori horizontal, indikator typographic Match Score % (hijau `>= 70%`, kuning `40–69%`, merah `< 40%`), serta tombol toggle langsung **Simpan ke Wishlist / Batalkan Lamaran** (terlindung Undo 5 detik).
3. **Form Tambah Lamaran Manual**: controlled form dengan field kondisional `cvVersion` & `appliedDate` saat `APPLIED`, pemilih CV dari CV Vault + upload CV inline, validasi input kosong & duplikat `(company + role)`, serta auto-focus `useRef` ke input error pertama.
4. **Multi-CV Vault**: unggah banyak dokumen CV sekaligus (drag-and-drop / multi-file), ubah label fokus posisi, tandai CV Utama, unduh ulang CV, pantau jumlah pemakaian per lamaran, dan pilih versi CV spesifik saat melamar atau pindah ke `APPLIED`.
5. **War Room Pipeline, Agenda Interview, Ghosting & Bentrok**: agenda interview terjadwal (derived state), filter status & pencarian, toggle `Hanya Rawan Ghosting`, sorting, tombol `Simulasi +15 Hari` per lamaran `APPLIED`/`SCREENING`, dan banner bentrok `< 60 menit` yang selalu menghitung seluruh data.
6. **Detail Lamaran & Interview Prep Timer**: state machine ketat (`OFFER`/`REJECTED` final, `GHOSTED -> SCREENING`), nested checklist immutable + tombol `Isi Template Persiapan`, riwayat aktivitas otomatis + catatan manual, dan timer latihan `02:00` dengan cleanup `clearInterval` di `useEffect`.
7. **Undo Delete (5 Detik), Reset Local DB & Bonus**: toast Undo 5 detik berbasis `useRef`, dialog **Reset Local DB** ke state awal bersih, tombol **Muat Data Demo**, Export/Import backup JSON (termasuk CV Vault), Dark Mode (`useLocalStorage`), dan shortcut keyboard `/` untuk fokus kolom pencarian via `useRef`.

## Menjalankan & Verifikasi

```bash
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm run build
```
