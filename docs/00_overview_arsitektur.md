# Modul 00 — Gambaran Umum & Arsitektur Sistem

## 1. Visi Proyek

**Dahana BizPort** adalah platform internal eksklusif PT Dahana yang berfungsi sebagai ruang kendali operasional dan visualisasi kinerja bisnis. Sistem ini menggantikan laporan Excel statis dengan dashboard interaktif berbasis grafik yang dapat diakses secara kolaboratif oleh 4 user yang telah di-whitelist.

---

## 2. Stack Teknologi

| Layer | Teknologi | Versi | Alasan Pemilihan |
|-------|-----------|-------|-----------------|
| Frontend | React.js (Vite) | ^18 | SPA modern, ekosistem kaya |
| Styling | TailwindCSS | ^3 | Utility-first, rapid development |
| Charting | Recharts | ^2 | Deklaratif, cocok dengan React |
| Backend | Python FastAPI | ^0.110 | Async, performa tinggi, OpenAPI auto-docs |
| Database | Supabase (PostgreSQL) | Latest | Realtime, built-in Auth, RLS |
| Auth | Supabase Auth | Latest | Whitelist-ready, JWT |
| File Storage | Supabase Storage | Latest | Terintegrasi dengan database |
| Deployment | Vercel (FE) + Railway (BE) | - | Gratis tier memadai untuk internal tool |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Auth Gate  │  │  Sidebar Nav │  │  Chart Canvas │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WebSocket
          ┌──────────────┴──────────────┐
          │                             │
   ┌──────▼──────┐              ┌───────▼───────┐
   │  FastAPI BE  │              │   Supabase    │
   │  (Railway)   │              │  (Managed)    │
   │              │              │               │
   │ /api/extract │              │  PostgreSQL   │
   │ /api/upload  │◄────────────►│  Realtime     │
   │ /api/charts  │              │  Storage      │
   └──────┬───────┘              │  Auth (JWT)   │
          │                      └───────────────┘
   ┌──────▼───────┐
   │  Excel Parser│
   │  (pandas/    │
   │   openpyxl)  │
   └──────────────┘
```

---

## 4. Struktur Modul Aplikasi

```
Dahana BizPort
├── Modul A: Pengembangan Usaha
│   ├── Divisi Komersial
│   │   ├── Project Berjalan  → Kurva S + Dokumen + Progress Tracking
│   │   └── Project Kajian   → Collaborative Progress Tracking
│   └── Divisi Pertahanan
│       ├── Project Berjalan  → (sama dengan Komersial)
│       └── Project Kajian   → (sama dengan Komersial)
│
└── Modul B: Manajemen Portofolio
    ├── Anak Cucu
    │   ├── DIC (Anak Perusahaan) → Dashboard Finansial Lengkap
    │   └── KAN (Cucu Perusahaan) → Dashboard Produksi + Finansial
    ├── JO (Joint Operation)
    │   ├── JODD → Inventori Dayaprime + Finansial Placeholder
    │   └── JODB → Inventori ANSOL & Granular
    └── Lainnya → Bubble Chart / Kanban Investasi
```

---

## 5. Prinsip Desain Utama

### 5.1 Zero-Table UI
Tidak ada `<table>` atau data grid di UI. Seluruh data divisualisasikan dalam bentuk grafik interaktif dengan tooltip detail.

### 5.2 Data Flow (Upload → Parse → Visualize)
```
User Upload Excel
      ↓
FastAPI menerima file
      ↓
Python Parser (pandas/openpyxl) membaca sheet
      ↓
Normalisasi format angka Indonesia (. → ribuan, , → desimal)
      ↓
JSON koordinat grafik dikirim ke React
      ↓
Recharts merender visualisasi
```

### 5.3 Collaborative Real-time
Semua 4 user melihat pembaruan data secara sinkron melalui Supabase Realtime channels.

### 5.4 Skema Warna
| Token | Warna | Hex | Penggunaan |
|-------|-------|-----|-----------|
| `primary` | Electric Blue | `#3B82F6` | Aksi utama, highlight |
| `positive` | Emerald Green | `#10B981` | Pertumbuhan positif |
| `negative` | Coral Red | `#F43F5E` | Penurunan, peringatan |
| `neutral` | Slate Gray | `#64748B` | Label, border |
| `surface` | White | `#FFFFFF` | Background card |
| `base` | Gray-50 | `#F8FAFC` | Background halaman |

---

## 6. Milestone Pengembangan

| Fase | Modul | Estimasi |
|------|-------|----------|
| Phase 1 | Setup + Auth + Layout Dasar | Minggu 1 |
| Phase 2 | Backend + Excel Parser | Minggu 2-3 |
| Phase 3 | Modul Pengembangan Usaha | Minggu 4-5 |
| Phase 4 | Modul Manajemen Portofolio | Minggu 6-7 |
| Phase 5 | Realtime + Polish + Testing | Minggu 8 |
| Phase 6 | Deployment & Go-Live | Minggu 9 |

---

## 7. Keputusan Arsitektur Kritis

1. **Monorepo**: Frontend dan Backend dalam satu repository dengan folder terpisah (`/frontend`, `/backend`)
2. **Stateless Backend**: FastAPI tidak menyimpan state — semua state di Supabase
3. **JWT Verification**: Setiap request ke FastAPI divalidasi dengan JWT dari Supabase Auth
4. **File Storage**: Excel yang diunggah disimpan di Supabase Storage, tidak di server FastAPI
5. **Lazy Loading**: Setiap sub-menu hanya fetch data saat pertama kali diakses (React.lazy + Suspense)

---

## 📌 Prompt AI — Modul 00

```
Kamu adalah Senior Full-Stack Developer yang akan membangun Dahana BizPort,
sebuah sistem internal PT Dahana.

Konteks arsitektur:
- Monorepo dengan folder /frontend (React 18 + Vite + TailwindCSS v3 + Recharts)
  dan /backend (Python FastAPI 0.110+)
- Database & Auth: Supabase (PostgreSQL + Realtime + Storage)
- Deployment: Vercel untuk frontend, Railway untuk backend
- Zero-table UI: semua data divisualisasikan sebagai chart
- 4 user whitelist-only dengan Supabase Auth
- Skema warna: Electric Blue (#3B82F6), Emerald Green (#10B981), Coral Red (#F43F5E)

Tugas pertama: Buatkan struktur folder lengkap monorepo ini mengikuti
konvensi industri, termasuk file konfigurasi dasar (vite.config.ts,
tailwind.config.ts, pyproject.toml) tanpa komentar yang tidak perlu.
Tampilkan sebagai tree struktur folder.
```
