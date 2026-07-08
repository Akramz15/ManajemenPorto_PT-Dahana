# Modul 10 — Testing & Quality Assurance

## 1. Strategi Testing

```
Testing Pyramid — Dahana BizPort
┌──────────────────────────────┐
│    E2E Tests (Playwright)    │  ← Login, upload, view chart
│      ~5 critical flows       │
├──────────────────────────────┤
│   Integration Tests (React   │  ← Component + API mocking
│   Testing Library + MSW)     │
│        ~20 scenarios         │
├──────────────────────────────┤
│    Unit Tests (Vitest +      │  ← Normalizer, formatters, hooks
│      pytest)                 │
│       ~50+ tests             │
└──────────────────────────────┘
```

---

## 2. Backend Unit Tests

### 2.1 Test Normalizer
```python
# tests/test_parsers/test_normalizer.py
import pytest
from app.parsers.normalizer import normalize_indonesian_number

@pytest.mark.parametrize("raw,expected", [
    ("1.234.567,89", 1234567.89),
    ("1,234,567.89", 1234567.89),
    ("45,2", 45.2),
    ("45.2", 45.2),
    ("1.000", 1000.0),
    ("10.000.000", 10000000.0),
    ("Rp 5.000.000", 5000000.0),
    ("(1.000.000)", -1000000.0),
    (1000, 1000.0),
    (45.5, 45.5),
    (None, None),
    ("N/A", None),
    ("-", None),
    ("", None),
])
def test_normalize_indonesian_number(raw, expected):
    result = normalize_indonesian_number(raw)
    if expected is None:
        assert result is None
    else:
        assert abs(result - expected) < 0.001
```

### 2.2 Test KurvaSParser
```python
# tests/test_parsers/test_kurva_s_parser.py
import io
import pytest
import openpyxl
from app.parsers.kurva_s_parser import KurvaSParser

def make_kurva_s_excel(data: list[dict]) -> io.BytesIO:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Kurva S"
    ws.append(["Periode", "Rencana (%)", "Realisasi (%)"])
    for row in data:
        ws.append([row["periode"], row["rencana"], row["realisasi"]])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf

def test_parse_valid_kurva_s():
    test_data = [
        {"periode": "Jan 2024", "rencana": "10,5", "realisasi": "8,2"},
        {"periode": "Feb 2024", "rencana": "25,0", "realisasi": "22,1"},
        {"periode": "Mar 2024", "rencana": "45,2", "realisasi": "38,7"},
    ]
    buf = make_kurva_s_excel(test_data)
    parser = KurvaSParser(file_bytes=buf, context="kurva-s")
    result = parser.parse()

    assert result["chart_type"] == "kurva_s"
    assert len(result["data_points"]) == 3
    assert result["data_points"][0]["rencana"] == 10.5
    assert result["data_points"][0]["realisasi"] == 8.2

def test_parse_missing_sheet():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Data"
    ws.append(["No", "Nama"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    parser = KurvaSParser(file_bytes=buf, context="kurva-s")
    with pytest.raises(ValueError, match="Sheet dengan kata kunci"):
        parser.parse()
```

### 2.3 Test API Endpoints
```python
# tests/test_api/test_extract.py
import io
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
def mock_auth_token():
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"

@pytest.mark.asyncio
async def test_extract_wrong_format():
    async with AsyncClient(app=app, base_url="http://test") as client:
        files = {"file": ("test.txt", io.BytesIO(b"not excel"), "text/plain")}
        response = await client.post(
            "/api/v1/extract/kurva-s",
            files=files,
            headers={"Authorization": "Bearer valid_token"}
        )
    assert response.status_code in (401, 422)

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

---

## 3. Frontend Unit Tests

### 3.1 Test Formatters
```typescript
// src/lib/__tests__/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatRupiah, formatPersen, formatTon } from "@/lib/formatters";

describe("formatRupiah", () => {
  it("formats positive value correctly", () => {
    expect(formatRupiah(5000000)).toBe("Rp 5.000.000");
  });

  it("formats abbreviated value", () => {
    expect(formatRupiah(5000000000, true)).toMatch(/5,0M|5\.0M/);
  });

  it("returns N/A for null", () => {
    expect(formatRupiah(null)).toBe("N/A");
  });
});

describe("formatPersen", () => {
  it("formats percentage with 1 decimal", () => {
    expect(formatPersen(45.2)).toBe("45.2%");
  });

  it("formats with custom decimals", () => {
    expect(formatPersen(45.2356, 2)).toBe("45.24%");
  });
});

describe("formatTon", () => {
  it("formats ton value with locale", () => {
    expect(formatTon(1234)).toBe("1.234 Ton");
  });
});
```

### 3.2 Test Components (React Testing Library)
```typescript
// src/components/charts/__tests__/ChartShell.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartShell } from "@/components/charts/ChartShell";

describe("ChartShell", () => {
  it("shows spinner when loading", () => {
    render(<ChartShell loading={true} error={null} hasData={false}>content</ChartShell>);
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows upload prompt when no data", () => {
    render(<ChartShell loading={false} error={null} hasData={false}>content</ChartShell>);
    expect(screen.getByText(/belum ada data/i)).toBeTruthy();
  });

  it("renders children when data available", () => {
    render(<ChartShell loading={false} error={null} hasData={true}>
      <div>Chart Content</div>
    </ChartShell>);
    expect(screen.getByText("Chart Content")).toBeTruthy();
  });

  it("shows error message", () => {
    render(<ChartShell loading={false} error="Terjadi kesalahan" hasData={false}>content</ChartShell>);
    expect(screen.getByText("Terjadi kesalahan")).toBeTruthy();
  });
});
```

---

## 4. E2E Tests (Playwright)

### 4.1 Setup
```bash
cd frontend
pnpm add -D @playwright/test
pnpm exec playwright install
```

### 4.2 Login Flow Test
```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows login page for unauthenticated user", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole("heading", { name: /dahana bizport/i })).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[id="email"]', "invalid@example.com");
    await page.fill('[id="password"]', "wrongpassword");
    await page.click('[id="login-btn"]');
    await expect(page.getByText(/email tidak terdaftar|invalid/i)).toBeVisible();
  });
});
```

### 4.3 Excel Upload Flow Test
```typescript
// e2e/upload.spec.ts
import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Excel Upload", () => {
  test.beforeEach(async ({ page }) => {
    // Assume auth state is pre-set via storageState
    await page.goto("/pu/komersial/berjalan");
  });

  test("shows Kurva S chart after valid Excel upload", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(__dirname, "fixtures", "kurva_s_sample.xlsx")
    );
    await expect(page.getByText(/memproses/i)).toBeVisible();
    await expect(page.getByText(/kurva s/i)).toBeVisible({ timeout: 10000 });
  });
});
```

---

## 5. Test Scripts (package.json & pyproject.toml)

```json
// frontend/package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

```toml
# backend/pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

```bash
# Run all backend tests
cd backend && uv run pytest tests/ -v

# Run frontend tests
cd frontend && pnpm test

# Run E2E tests
cd frontend && pnpm test:e2e
```

---

## 📌 Prompt AI — Modul 10

```
Tulis test suite lengkap untuk Dahana BizPort.

Backend (pytest):
1. test_normalizer.py — parametrized tests untuk semua format angka Indonesia
2. test_kurva_s_parser.py — test parse valid, missing sheet, missing column
3. test_extract_endpoint.py — test HTTP 401, 422, 200 menggunakan httpx AsyncClient

Frontend (Vitest + React Testing Library):
1. formatters.test.ts — unit test formatRupiah, formatPersen, formatTon
2. ChartShell.test.tsx — render states: loading, error, empty, dengan data
3. ExcelUploader.test.tsx — mock upload, drag state, error state

E2E (Playwright):
1. auth.spec.ts — unauthenticated redirect, invalid credentials
2. upload.spec.ts — file upload → chart render flow

Gunakan fixture file Excel minimal untuk testing.
Kode test harus clean, deskriptif, tanpa komentar berlebihan.
```
