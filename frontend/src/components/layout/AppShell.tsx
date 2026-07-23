import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UploadToastListener } from "@/components/shared";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden mesh-bg font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 lg:ml-72 overflow-y-auto hide-scrollbar p-4 pl-0">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
      <UploadToastListener />
    </div>
  );
}
