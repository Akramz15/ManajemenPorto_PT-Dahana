import { useNavigate } from "react-router-dom";
import { TrendingUp, PieChart } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import logoDahana from "@/assets/Logo_Dahana.png";

const modules = [
  {
    id: "pengembangan-usaha" as const,
    label: "Pengembangan Usaha",
    description: "Kelola project berjalan & kajian divisi Komersial dan Pertahanan.",
    icon: TrendingUp,
    path: "/pu/dashboard",
    color: "text-primary-600",
    gradient: "from-primary-100 to-primary-50",
  },
  {
    id: "portofolio" as const,
    label: "Manajemen Portofolio",
    description: "Visualisasi kinerja finansial & operasional anak cucu dan JO.",
    icon: PieChart,
    path: "/porto/anak-cucu/dic",
    color: "text-positive-600",
    gradient: "from-positive-100 to-positive-50",
  },
];

export default function ModulSelectPage() {
  const navigate = useNavigate();
  const { setActiveModule } = useAppStore();
  const { user } = useAuth();

  const handleSelect = (id: "pengembangan-usaha" | "portofolio", path: string) => {
    setActiveModule(id);
    navigate(path);
  };

  return (
    <div className="min-h-screen mesh-bg flex flex-col font-sans">
      
      {/* Floating Navbar Logo */}
      <div className="w-full flex justify-center pt-10">
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-floating px-8 py-5 rounded-4xl flex items-center justify-center">
          <img src={logoDahana} alt="PT Dahana BizPort" className="h-14 w-auto object-contain drop-shadow-sm" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-6 pb-10 md:pb-20">
        <div className="w-full max-w-4xl relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-3 md:mb-4">
              Halo{user?.email ? `, ${user.email.split("@")[0]}` : ""}! 👋
            </h2>
            <p className="text-slate-500 text-base md:text-lg lg:text-xl font-medium max-w-xl mx-auto px-4">
              Pilih modul di bawah ini untuk mulai mengelola portofolio dan memantau performa bisnis secara langsung.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-2 md:px-4">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => handleSelect(mod.id, mod.path)}
                className="card text-left p-6 md:p-8 group cursor-pointer border-t-[6px] border-t-white hover:border-t-primary-500 transition-all duration-300 flex flex-col"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl md:rounded-4xl bg-linear-to-br ${mod.gradient} flex items-center justify-center shrink-0 mb-6 md:mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm`}>
                  <mod.icon className={`w-8 h-8 md:w-9 md:h-9 ${mod.color}`} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2 md:mb-3 group-hover:text-primary-600 transition-colors">{mod.label}</h3>
                <p className="text-sm md:text-base font-medium text-slate-500 leading-relaxed">{mod.description}</p>
                
                <div className="mt-6 md:mt-8 flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 group-hover:text-primary-500 transition-colors">
                  <span>Masuk Workspace</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
