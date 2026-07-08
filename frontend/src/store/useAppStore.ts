import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActiveModule = "pengembangan-usaha" | "portofolio";

interface AppState {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
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
