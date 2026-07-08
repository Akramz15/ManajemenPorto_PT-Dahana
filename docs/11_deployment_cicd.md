# Modul 11 — Deployment & CI/CD

## 1. Arsitektur Deployment

```
GitHub Repository
      │
      ├── push to main
      │
      ├── GitHub Actions
      │         ├── Frontend → Vercel (auto deploy)
      │         └── Backend  → Railway (via railway CLI)
      │
      ├── Vercel (Frontend)
      │         URL: https://dahana-bizport.vercel.app
      │
      └── Railway (Backend)
                URL: https://dahana-bizport-api.railway.app
```

---

## 2. Docker — Backend

### 2.1 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 docker-compose.yml (Development)
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/app:/app/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    image: node:20-alpine
    working_dir: /app
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    command: sh -c "npm install -g pnpm && pnpm install && pnpm dev --host"
    env_file:
      - ./frontend/.env
```

---

## 3. Vercel Configuration (Frontend)

### 3.1 vercel.json
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_API_BASE_URL": "@api_base_url"
  }
}
```

### 3.2 Deploy ke Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy dari direktori frontend
cd frontend
vercel --prod
```

---

## 4. Railway Configuration (Backend)

### 4.1 railway.toml
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

### 4.2 Environment Variables di Railway Dashboard
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-secret
ALLOWED_ORIGINS=https://dahana-bizport.vercel.app
```

---

## 5. GitHub Actions Pipelines

### 5.1 Frontend Pipeline
```yaml
# .github/workflows/frontend-deploy.yml
name: Frontend Deploy

on:
  push:
    branches: [main]
    paths: [frontend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: frontend/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm test --run
      - run: pnpm build

      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: "--prod"
```

### 5.2 Backend Pipeline
```yaml
# .github/workflows/backend-deploy.yml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths: [backend/**]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - run: pip install uv
      - run: uv pip install --system -e ".[dev]"
      - run: python -m pytest tests/ -v --tb=short

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: berviantoleo/railway-deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: dahana-bizport-backend
```

---

## 6. Supabase Migrations di CI

```yaml
# Bagian dari pipeline — run Supabase migrations saat deploy
- name: Run Supabase Migrations
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  run: |
    npx supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

---

## 7. Environment Checklist Pre-Deploy

| Item | Frontend (Vercel) | Backend (Railway) | Status |
|------|------------------|-------------------|--------|
| `VITE_SUPABASE_URL` | ✅ | - | Required |
| `VITE_SUPABASE_ANON_KEY` | ✅ | - | Required |
| `VITE_API_BASE_URL` | ✅ | - | Required |
| `SUPABASE_URL` | - | ✅ | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | - | ✅ | Required |
| `SUPABASE_JWT_SECRET` | - | ✅ | Required |
| `ALLOWED_ORIGINS` | - | ✅ | Required |

---

## 8. Post-Deploy Verification

```bash
# Cek health backend
curl https://dahana-bizport-api.railway.app/health

# Cek CORS
curl -H "Origin: https://dahana-bizport.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://dahana-bizport-api.railway.app/api/v1/extract/kurva-s

# Cek frontend load
curl -I https://dahana-bizport.vercel.app
```

---

## 9. Monitoring (Opsional)

| Tool | Fungsi | Setup |
|------|--------|-------|
| Sentry | Error tracking FE + BE | `VITE_SENTRY_DSN` + `SENTRY_DSN` |
| Supabase Dashboard | Query monitoring, auth logs | Built-in |
| Railway Metrics | CPU/Memory usage BE | Built-in |
| Vercel Analytics | Page load performance | Built-in |

---

## 📌 Prompt AI — Modul 11

```
Siapkan konfigurasi deployment lengkap untuk Dahana BizPort.

Tugas:
1. Buat backend/Dockerfile yang menggunakan python:3.11-slim + uv
2. Buat docker-compose.yml di root repo untuk development local
   (backend + frontend berjalan bersamaan)
3. Buat vercel.json di folder frontend dengan SPA rewrite rule
4. Buat railway.toml di root dengan konfigurasi Dockerfile backend
5. Buat .github/workflows/frontend-deploy.yml:
   - Trigger: push ke main, path frontend/**
   - Steps: install pnpm → type-check → test → build → deploy ke Vercel
6. Buat .github/workflows/backend-deploy.yml:
   - Trigger: push ke main, path backend/**
   - Steps: install python → run pytest → deploy ke Railway
7. Buat .env.example untuk frontend dan backend
8. Buat README.md di root repo dengan instruksi setup development local

Semua secrets menggunakan GitHub Secrets, bukan hardcode.
Kode dan konfigurasi clean, production-ready.
```
