# Aku Mw Magang

Aplikasi Frontend React 19 + TypeScript (`strict: true`) untuk mengelola seluruh proses lamaran magang: eksplorasi lowongan & pencocokan skill, War Room pipeline dengan state machine ketat, latihan interview berwaktu, deteksi ghosting & bentrok jadwal, hingga Offer Comparator berbobot.

## Tech Stack

- **React 19** + **TypeScript** (`strict: true`, tanpa tipe `any`)
- **Vite** (`react-ts`)
- **Pure CSS** (semantic design tokens, Light & Dark mode)
- **lucide-react** (ikon ringan)
- Seluruh state, fetch, form, timer, dan persistensi ditulis memakai React Hooks bawaan & Custom Hooks (`useLocalStorage<T>`, `useDebounce<T>`).

## Fitur Utama

1. **Profil Skill Kapten & Eksplorasi Lowongan**: manajemen skill (persisted di `localStorage`), live fetch Remotive API dengan `AbortController`, fallback lokal (`public/magang-fallback.json`), pencarian debounced 400ms, filter kategori, badge Skill Match % (`>= 70%` hijau, `40–69%` kuning, `< 40%` merah), dan anti-duplikat.
2. **Form Tambah Lamaran Manual**: controlled form dengan field kondisional `cvVersion` & `appliedDate` saat status `APPLIED`, validasi input kosong & duplikat `(company + role)`, serta auto-focus ke input pertama yang error via `useRef`.
3. **War Room Pipeline, Ghosting & Bentrok Jadwal**: filter gabungan (pencarian, status, toggle Rawan Ghosting, sorting), tombol `Simulasi +15 Hari` per lamaran `APPLIED`/`SCREENING`, serta banner bentrok jadwal interview `< 60 menit` yang selalu menghitung seluruh data.
4. **Detail Lamaran (State Machine, Checklist & Activity Log)**: transisi status ketat sesuai state machine (`OFFER` & `REJECTED` final, `GHOSTED -> SCREENING`), checklist persiapan bersarang secara immutable + progress bar, serta riwayat aktivitas otomatis dan catatan manual.
5. **Interview Prep Timer**: 6 pertanyaan latihan interview magang IT dengan countdown `02:00`, Start/Pause, Reset, Lanjut (reset otomatis), dan cleanup `clearInterval` di `useEffect`.
6. **Undo Delete (5 Detik) & Persistensi**: toast Undo 5 detik memakai `useRef` untuk membersihkan timer lama saat penghapusan berturut-turut, serta persistensi `applications` dan `kaptenSkills` lewat `useLocalStorage<T>`.
7. **Dashboard Statistik & Offer Comparator**: 5 kartu statistik berbasis derived state dan perbandingan 2 offer (`Uang Saku 50% + Mode Kerja 25% + Skill Match 25%`) dengan badge Rekomendasi Terbaik.
8. **Bonus**: Mode Gelap (`useLocalStorage`), shortcut keyboard `/` untuk fokus kolom pencarian via `useRef`, dan Export/Import backup JSON tervalidasi.

## Menjalankan Proyek

```bash
npm install
npm run dev
```

## Validasi & Build

```bash
npx tsc --noEmit
npm run lint
npm run build
```
