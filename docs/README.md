# Dahana BizPort — Dokumentasi Pengembangan

> **Sistem Pengembangan Usaha & Manajemen Portofolio**
> Stack: React.js · Python FastAPI · Supabase · TailwindCSS

---

## Daftar Modul

| No | Modul | File | Deskripsi |
|----|-------|------|-----------|
| 00 | Gambaran Umum & Arsitektur | [00_overview_arsitektur.md](./00_overview_arsitektur.md) | Visi proyek, stack teknologi, dan arsitektur sistem |
| 01 | Setup Lingkungan & Struktur Proyek | [01_setup_environment.md](./01_setup_environment.md) | Inisialisasi repo, tooling, dan konfigurasi dasar |
| 02 | Supabase: Database & Auth | [02_supabase_database_auth.md](./02_supabase_database_auth.md) | Skema database, RLS, whitelist auth, dan realtime |
| 03 | Backend Python FastAPI | [03_backend_fastapi.md](./03_backend_fastapi.md) | API endpoints, mesin ekstraksi Excel, dan keamanan |
| 04 | Frontend Foundation (React + Tailwind) | [04_frontend_foundation.md](./04_frontend_foundation.md) | Setup React, Tailwind, routing, layout, dan auth flow |
| 05 | Modul Pengembangan Usaha | [05_modul_pengembangan_usaha.md](./05_modul_pengembangan_usaha.md) | Kurva S, dokumen upload, visual tracking kolaboratif |
| 06 | Modul Manajemen Portofolio | [06_modul_manajemen_portofolio.md](./06_modul_manajemen_portofolio.md) | Dashboard finansial, produksi, inventori, dan afiliasi |
| 07 | Mesin Ekstraksi Data Python | [07_mesin_ekstraksi_excel.md](./07_mesin_ekstraksi_excel.md) | Parser Excel Indonesia, normalisasi, dan validasi |
| 08 | Sistem Visualisasi & Charting | [08_sistem_visualisasi.md](./08_sistem_visualisasi.md) | Recharts/Chart.js, tooltip, area chart, donut chart |
| 09 | Realtime & Kolaborasi | [09_realtime_kolaborasi.md](./09_realtime_kolaborasi.md) | Supabase Realtime, live updates, dan presence |
| 10 | Testing & Quality Assurance | [10_testing_qa.md](./10_testing_qa.md) | Unit test, integration test, dan E2E testing |
| 11 | Deployment & CI/CD | [11_deployment_cicd.md](./11_deployment_cicd.md) | Docker, Vercel/Railway, environment, dan pipeline |

---

## Cara Menggunakan Dokumentasi Ini

1. Mulai dari modul `00` untuk memahami arsitektur keseluruhan
2. Ikuti urutan modul secara sequential — setiap modul bergantung pada modul sebelumnya
3. Setiap modul diakhiri dengan **Prompt AI** yang dapat langsung digunakan untuk memulai coding
4. Gunakan prompt tersebut sebagai instruksi ke AI coding assistant

---

## Konvensi Kode

- **Bahasa**: English untuk kode, Bahasa Indonesia untuk komentar bisnis penting
- **Komentar**: Minimal — hanya untuk logika bisnis non-obvious
- **Formatting**: ESLint + Prettier (JS/TS), Black + Ruff (Python)
- **Naming**: camelCase (JS), snake_case (Python), PascalCase (React components)

---

*Dokumen ini dikelola oleh tim Pengembangan Usaha PT Dahana.*
