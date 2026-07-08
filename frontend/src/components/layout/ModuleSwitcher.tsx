import { useNavigate } from "react-router-dom";
import { useAppStore, type ActiveModule } from "@/store/useAppStore";

const modules: { id: ActiveModule; label: string }[] = [
  { id: "pengembangan-usaha", label: "PU" },
  { id: "portofolio", label: "Porto" },
];

const defaultPaths: Record<ActiveModule, string> = {
  "pengembangan-usaha": "/pu/komersial/berjalan",
  portofolio: "/porto/anak-cucu/dic",
};

export function ModuleSwitcher() {
  const { activeModule, setActiveModule } = useAppStore();
  const navigate = useNavigate();

  const handleSwitch = (mod: ActiveModule) => {
    setActiveModule(mod);
    navigate(defaultPaths[mod]);
  };

  return (
    <div className="flex gap-1.5 bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm">
      {modules.map((mod) => (
        <button
          key={mod.id}
          onClick={() => handleSwitch(mod.id)}
          className={`flex-1 text-xs font-bold py-2 rounded-xl transition-all duration-300 cursor-pointer border
            ${activeModule === mod.id
              ? "bg-white text-primary-600 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.05)] border-white"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/40 border-transparent"
            }`}
        >
          {mod.label}
        </button>
      ))}
    </div>
  );
}
