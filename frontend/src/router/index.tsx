import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import LoginPage from "@/pages/LoginPage";
import ModulSelectPage from "@/pages/ModulSelectPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { Spinner } from "@/components/ui/Spinner";

const PengembanganUsahaDashboard = lazy(() => import("@/features/pengembangan-usaha/PengembanganUsahaDashboard"));
const ProjectBerjalanKomersial = lazy(() => import("@/features/pengembangan-usaha/komersial/ProjectBerjalan"));
const ProjectKajianKomersial = lazy(() => import("@/features/pengembangan-usaha/komersial/ProjectKajian"));
const ProjectBerjalanPertahanan = lazy(() => import("@/features/pengembangan-usaha/pertahanan/ProjectBerjalan"));
const ProjectKajianPertahanan = lazy(() => import("@/features/pengembangan-usaha/pertahanan/ProjectKajian"));
const ManajemenPortoDashboard = lazy(() => import("@/features/portofolio/ManajemenPortoDashboard"));
const DIC = lazy(() => import("@/features/portofolio/anak-cucu/DIC"));
const KAN = lazy(() => import("@/features/portofolio/anak-cucu/KAN"));
const JODD = lazy(() => import("@/features/portofolio/jo/JODD"));
const JODB = lazy(() => import("@/features/portofolio/jo/JODB"));
const Investasi = lazy(() => import("@/features/portofolio/lainnya/Investasi"));

function PageLoader() {
  return (
    <div className="flex h-full min-h-80 items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/select-module",
    element: (
      <AuthGuard>
        <ModulSelectPage />
      </AuthGuard>
    ),
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/select-module" replace /> },
      {
        path: "pu",
        children: [
          {
            path: "dashboard",
            element: <Suspense fallback={<PageLoader />}><PengembanganUsahaDashboard /></Suspense>,
          },
          {
            path: "komersial/berjalan",
            element: <Suspense fallback={<PageLoader />}><ProjectBerjalanKomersial /></Suspense>,
          },
          {
            path: "komersial/kajian",
            element: <Suspense fallback={<PageLoader />}><ProjectKajianKomersial /></Suspense>,
          },
          {
            path: "pertahanan/berjalan",
            element: <Suspense fallback={<PageLoader />}><ProjectBerjalanPertahanan /></Suspense>,
          },
          {
            path: "pertahanan/kajian",
            element: <Suspense fallback={<PageLoader />}><ProjectKajianPertahanan /></Suspense>,
          },
        ],
      },
      {
        path: "porto",
        children: [
          {
            path: "dashboard",
            element: <Suspense fallback={<PageLoader />}><ManajemenPortoDashboard /></Suspense>,
          },
          {
            path: "anak-cucu/dic",
            element: <Suspense fallback={<PageLoader />}><DIC /></Suspense>,
          },
          {
            path: "anak-cucu/kan",
            element: <Suspense fallback={<PageLoader />}><KAN /></Suspense>,
          },
          {
            path: "jo/jodd",
            element: <Suspense fallback={<PageLoader />}><JODD /></Suspense>,
          },
          {
            path: "jo/jodb",
            element: <Suspense fallback={<PageLoader />}><JODB /></Suspense>,
          },
          {
            path: "lainnya",
            element: <Suspense fallback={<PageLoader />}><Investasi /></Suspense>,
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
