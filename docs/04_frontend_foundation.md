# Modul 04 — Frontend Foundation (React + Tailwind)

## 1. Design System

### 1.1 Token Warna (index.css)
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 59 130 246;
    --color-positive: 16 185 129;
    --color-negative: 244 63 94;
  }

  body {
    @apply bg-slate-50 text-slate-900 font-sans antialiased;
  }
}

@layer components {
  .card {
    @apply bg-white rounded-xl shadow-card border border-slate-100 p-5;
  }

  .btn-primary {
    @apply bg-primary-500 text-white px-4 py-2 rounded-lg
           font-medium text-sm hover:bg-primary-600
           transition-colors duration-150 disabled:opacity-50;
  }

  .sidebar-item {
    @apply flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600
           hover:bg-slate-100 hover:text-slate-900 transition-all duration-150
           cursor-pointer text-sm font-medium;
  }

  .sidebar-item.active {
    @apply bg-primary-50 text-primary-700 font-semibold;
  }
}
```

---

## 2. Layout Komponen

### 2.1 AppShell Layout
```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)    │  MAIN CONTENT (flex-1)      │
│  ┌───────────────────┐   │  ┌───────────────────────┐  │
│  │  Logo + App Name  │   │  │  Page Header          │  │
│  │───────────────────│   │  │───────────────────────│  │
│  │  Module Switcher  │   │  │                       │  │
│  │  [PU] ↔ [Porto]  │   │  │  Dashboard Content    │  │
│  │───────────────────│   │  │  (Charts)             │  │
│  │  Navigation Menu  │   │  │                       │  │
│  │  > Komersial      │   │  │                       │  │
│  │    > Berjalan     │   │  │                       │  │
│  │    > Kajian       │   │  └───────────────────────┘  │
│  │  > Pertahanan     │   │                              │
│  │───────────────────│   │                              │
│  │  User Avatar      │   │                              │
│  │  Sign Out         │   │                              │
│  └───────────────────┘   │                              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Sidebar Component
```typescript
// src/components/layout/Sidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { UserPanel } from "./UserPanel";
import { navConfig } from "@/router/navConfig";

export function Sidebar() {
  const { activeModule } = useAppStore();
  const menus = navConfig[activeModule];

  return (
    <aside className="w-60 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0">
      <div className="p-5 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">PT Dahana</p>
        <h1 className="text-base font-bold text-slate-900 mt-0.5">BizPort</h1>
      </div>

      <div className="p-3 border-b border-slate-100">
        <ModuleSwitcher />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menus.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 py-2">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <UserPanel />
      </div>
    </aside>
  );
}
```

### 2.3 Module Switcher
```typescript
// src/components/layout/ModuleSwitcher.tsx
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";

type Module = "pengembangan-usaha" | "portofolio";

const modules: { id: Module; label: string; short: string }[] = [
  { id: "pengembangan-usaha", label: "Pengembangan Usaha", short: "PU" },
  { id: "portofolio", label: "Manajemen Portofolio", short: "Porto" },
];

export function ModuleSwitcher() {
  const { activeModule, setActiveModule } = useAppStore();
  const navigate = useNavigate();

  const handleSwitch = (mod: Module) => {
    setActiveModule(mod);
    navigate(mod === "pengembangan-usaha"
      ? "/pu/komersial/berjalan"
      : "/porto/anak-cucu/dic");
  };

  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
      {modules.map((mod) => (
        <button
          key={mod.id}
          onClick={() => handleSwitch(mod.id)}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all duration-150
            ${activeModule === mod.id
              ? "bg-white text-primary-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          {mod.short}
        </button>
      ))}
    </div>
  );
}
```

---

## 3. Routing

### 3.1 Struktur Route
```typescript
// src/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { lazy, Suspense } from "react";
import LoginPage from "@/pages/LoginPage";
import ModulSelectPage from "@/pages/ModulSelectPage";

const ProjectBerjalanKomersial = lazy(() => import("@/features/pengembangan-usaha/komersial/ProjectBerjalan"));
const ProjectKajianKomersial = lazy(() => import("@/features/pengembangan-usaha/komersial/ProjectKajian"));
const ProjectBerjalanPertahanan = lazy(() => import("@/features/pengembangan-usaha/pertahanan/ProjectBerjalan"));
const ProjectKajianPertahanan = lazy(() => import("@/features/pengembangan-usaha/pertahanan/ProjectKajian"));
const DIC = lazy(() => import("@/features/portofolio/anak-cucu/DIC"));
const KAN = lazy(() => import("@/features/portofolio/anak-cucu/KAN"));
const JODD = lazy(() => import("@/features/portofolio/jo/JODD"));
const JODB = lazy(() => import("@/features/portofolio/jo/JODB"));
const Investasi = lazy(() => import("@/features/portofolio/lainnya/Investasi"));

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <AuthGuard><AppShell /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/select-module" replace /> },
      { path: "select-module", element: <ModulSelectPage /> },
      {
        path: "pu",
        children: [
          { path: "komersial/berjalan", element: <Suspense><ProjectBerjalanKomersial /></Suspense> },
          { path: "komersial/kajian", element: <Suspense><ProjectKajianKomersial /></Suspense> },
          { path: "pertahanan/berjalan", element: <Suspense><ProjectBerjalanPertahanan /></Suspense> },
          { path: "pertahanan/kajian", element: <Suspense><ProjectKajianPertahanan /></Suspense> },
        ],
      },
      {
        path: "porto",
        children: [
          { path: "anak-cucu/dic", element: <Suspense><DIC /></Suspense> },
          { path: "anak-cucu/kan", element: <Suspense><KAN /></Suspense> },
          { path: "jo/jodd", element: <Suspense><JODD /></Suspense> },
          { path: "jo/jodb", element: <Suspense><JODB /></Suspense> },
          { path: "lainnya", element: <Suspense><Investasi /></Suspense> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
```

---

## 4. Global State (Zustand)

```typescript
// src/store/useAppStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Module = "pengembangan-usaha" | "portofolio";

interface AppState {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: "pengembangan-usaha",
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    { name: "dahana-bizport-state" }
  )
);
```

---

## 5. Auth Guard

```typescript
// src/features/auth/AuthGuard.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

---

## 6. API Client

```typescript
// src/lib/api.ts
import axios from "axios";
import { supabase } from "./supabase";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
```

---

## 📌 Prompt AI — Modul 04

```
Bangun foundation frontend Dahana BizPort menggunakan React 18 + Vite +
TypeScript + TailwindCSS v3.

Tugas:
1. Buat src/index.css dengan Google Fonts Inter, Tailwind directives,
   dan custom component classes (card, btn-primary, sidebar-item)
2. Buat src/components/layout/AppShell.tsx dengan Sidebar (fixed 240px)
   dan main content area
3. Buat src/components/layout/Sidebar.tsx dengan navigasi bertingkat
   (divisi → sub-menu) dan active state styling
4. Buat src/components/layout/ModuleSwitcher.tsx (toggle PU ↔ Porto)
5. Buat src/router/index.tsx dengan React Router v6 dan lazy loading
   untuk semua halaman sub-menu
6. Buat src/store/useAppStore.ts dengan Zustand + persist
7. Buat src/features/auth/AuthGuard.tsx
8. Buat src/lib/api.ts sebagai Axios instance dengan auto-inject JWT

Desain: Clean light mode, warna primary #3B82F6.
Kode clean tanpa komentar yang tidak perlu.
```
