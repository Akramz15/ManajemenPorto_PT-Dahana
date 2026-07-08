# Modul 01 — Setup Lingkungan & Struktur Proyek

## 1. Prasyarat Sistem

| Tool | Versi Minimum | Perintah Cek |
|------|--------------|--------------|
| Node.js | 20 LTS | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Python | 3.11+ | `python3 --version` |
| uv (Python pkg manager) | Latest | `uv --version` |
| Git | 2.40+ | `git --version` |
| Supabase CLI | Latest | `supabase --version` |

---

## 2. Struktur Monorepo

```
dahana-bizport/
├── frontend/                        # React SPA
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                  # Komponen atom (Button, Badge, Card)
│   │   │   ├── charts/              # Wrapper Recharts (AreaChart, DonutChart)
│   │   │   ├── layout/              # Sidebar, Header, PageWrapper
│   │   │   └── shared/              # Uploader, FileGallery, ProgressTracker
│   │   ├── features/
│   │   │   ├── auth/                # Login, AuthGuard
│   │   │   ├── pengembangan-usaha/
│   │   │   │   ├── komersial/
│   │   │   │   │   ├── ProjectBerjalan.tsx
│   │   │   │   │   └── ProjectKajian.tsx
│   │   │   │   └── pertahanan/
│   │   │   │       ├── ProjectBerjalan.tsx
│   │   │   │       └── ProjectKajian.tsx
│   │   │   └── portofolio/
│   │   │       ├── anak-cucu/
│   │   │       │   ├── DIC.tsx
│   │   │       │   └── KAN.tsx
│   │   │       ├── jo/
│   │   │       │   ├── JODD.tsx
│   │   │       │   └── JODB.tsx
│   │   │       └── lainnya/
│   │   │           └── Investasi.tsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useRealtime.ts
│   │   │   └── useChartData.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts          # Supabase client singleton
│   │   │   ├── api.ts               # Axios instance ke FastAPI
│   │   │   └── formatters.ts        # Currency, percent formatters
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ModulSelectPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── router/
│   │   │   └── index.tsx            # React Router v6 config
│   │   ├── store/
│   │   │   └── useAppStore.ts       # Zustand global state
│   │   ├── types/
│   │   │   ├── chart.types.ts
│   │   │   ├── auth.types.ts
│   │   │   └── api.types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                         # Python FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── extract.py   # Endpoint ekstraksi Excel
│   │   │   │   │   ├── upload.py    # Endpoint upload file
│   │   │   │   │   ├── progress.py  # Endpoint progress tracking
│   │   │   │   │   └── charts.py    # Endpoint chart data
│   │   │   │   └── __init__.py
│   │   │   └── deps.py              # Dependency injection (auth verify)
│   │   ├── core/
│   │   │   ├── config.py            # Settings (pydantic-settings)
│   │   │   └── security.py          # JWT validation
│   │   ├── parsers/
│   │   │   ├── base_parser.py       # Abstract base parser
│   │   │   ├── kurva_s_parser.py    # Parser Kurva S
│   │   │   ├── portofolio_parser.py # Parser Portofolio
│   │   │   ├── normalizer.py        # Normalisasi format Indonesia
│   │   │   └── validators.py        # Validasi struktur Excel
│   │   ├── models/
│   │   │   ├── chart.py             # Pydantic models response
│   │   │   └── upload.py
│   │   ├── services/
│   │   │   ├── supabase_service.py  # Supabase client service
│   │   │   └── storage_service.py   # File storage operations
│   │   └── main.py                  # FastAPI app entry point
│   ├── tests/
│   │   ├── test_parsers/
│   │   └── test_api/
│   ├── .env.example
│   ├── pyproject.toml
│   └── Dockerfile
│
├── supabase/
│   ├── migrations/                  # SQL migration files
│   └── config.toml
│
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
│
├── .gitignore
└── README.md
```

---

## 3. Inisialisasi Frontend

### 3.1 Buat Proyek Vite + React + TypeScript
```bash
pnpm create vite@latest frontend -- --template react-ts
cd frontend
pnpm install
```

### 3.2 Install Dependencies Frontend
```bash
# Styling & UI
pnpm add -D tailwindcss @tailwindcss/vite

# Routing
pnpm add react-router-dom

# State Management
pnpm add zustand

# HTTP Client
pnpm add axios

# Supabase
pnpm add @supabase/supabase-js

# Charting
pnpm add recharts

# Form & File Handling
pnpm add react-dropzone

# Date utilities
pnpm add date-fns

# Icons
pnpm add lucide-react

# Type definitions
pnpm add -D @types/node
```

### 3.3 Konfigurasi Tailwind (tailwind.config.ts)
```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6",
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        positive: {
          DEFAULT: "#10B981",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
        },
        negative: {
          DEFAULT: "#F43F5E",
          100: "#FFE4E6",
          500: "#F43F5E",
          600: "#E11D48",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 3.4 Konfigurasi Vite (vite.config.ts)
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
```

---

## 4. Inisialisasi Backend

### 4.1 Setup Python Environment dengan uv
```bash
cd backend
uv init
uv add fastapi uvicorn[standard] pydantic-settings
uv add pandas openpyxl python-multipart
uv add supabase httpx python-jose[cryptography]
uv add -d pytest pytest-asyncio httpx
```

### 4.2 pyproject.toml (Konfigurasi Backend)
```toml
[project]
name = "dahana-bizport-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.110.0",
  "uvicorn[standard]>=0.29.0",
  "pydantic-settings>=2.2.0",
  "pandas>=2.2.0",
  "openpyxl>=3.1.2",
  "python-multipart>=0.0.9",
  "supabase>=2.4.0",
  "python-jose[cryptography]>=3.3.0",
  "httpx>=0.27.0",
]

[tool.ruff]
line-length = 100
select = ["E", "F", "I"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

---

## 5. Setup Supabase CLI

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Init project (dari root repo)
supabase init

# Link ke project Supabase cloud
supabase link --project-ref <YOUR_PROJECT_REF>
```

---

## 6. Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_API_BASE_URL=http://localhost:8000
```

### Backend (.env)
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.vercel.app
```

---

## 7. Git Setup & Gitignore

```bash
git init
git add .
git commit -m "chore: initial project setup"
```

`.gitignore` mencakup: `node_modules/`, `dist/`, `.env`, `__pycache__/`, `.venv/`, `*.pyc`, `*.xlsx` (data sensitif)

---

## 📌 Prompt AI — Modul 01

```
Berdasarkan struktur monorepo Dahana BizPort berikut, laksanakan setup lengkap:

Struktur proyek:
- /frontend: React 18 + Vite + TypeScript + TailwindCSS v3 + Recharts
- /backend: Python FastAPI + uv package manager
- /supabase: Supabase CLI migrations

Tugas:
1. Buatkan file vite.config.ts dengan alias path "@" dan proxy ke backend
2. Buatkan tailwind.config.ts dengan custom color tokens
   (primary: #3B82F6, positive: #10B981, negative: #F43F5E)
3. Buatkan src/index.css dengan @import Inter font dari Google Fonts
   dan Tailwind directives
4. Buatkan backend/app/core/config.py menggunakan pydantic-settings
   untuk membaca semua env variables
5. Buatkan backend/app/main.py sebagai FastAPI entry point
   dengan CORS middleware

Pastikan kode bersih tanpa komentar yang tidak perlu.
```
