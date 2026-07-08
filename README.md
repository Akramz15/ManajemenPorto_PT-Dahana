# Dahana BizPort

Sistem Pengembangan Usaha & Manajemen Portofolio PT Dahana.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS v3 |
| Charting | Recharts |
| Backend | Python FastAPI |
| Database | Supabase (PostgreSQL + Realtime + Storage) |
| Auth | Supabase Auth (whitelist-only, 4 users) |

## Project Structure

```
dahana-bizport/
├── frontend/       # React SPA
├── backend/        # Python FastAPI
├── supabase/       # Migrations & config
└── docs/           # Module documentation
```

## Quick Start

### Prerequisites
- Node.js 20 LTS
- pnpm 9+
- Python 3.11+
- uv

### Frontend
```bash
cd frontend
pnpm install
cp .env.example .env    # fill in your Supabase values
pnpm dev
```

### Backend
```bash
cd backend
uv sync
cp .env.example .env    # fill in your Supabase values
uv run uvicorn app.main:app --reload --port 8000
```

### Supabase
```bash
supabase db push
```

## Modules

See `docs/` for detailed implementation guides for each module.
