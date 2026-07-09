import { NavLink, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

import { UserPanel } from "./UserPanel";
import { navConfig } from "@/router/navConfig";

export function Sidebar() {
  const { activeModule } = useAppStore();
  const sections = navConfig[activeModule] ?? [];
  const location = useLocation();

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] bg-white/70 backdrop-blur-2xl border border-white/60 flex flex-col fixed left-4 top-4 z-40 shadow-floating rounded-3xl overflow-hidden">
      <div className="px-6 py-6 border-b border-white/40 bg-white/40">
        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">PT Dahana</p>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          BizPort <span className="w-2.5 h-2.5 rounded-full bg-explosive-500 shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse"></span>
        </h1>
      </div>


      <nav className="flex-1 px-3 pb-3 overflow-y-auto mt-2">
        {sections.map((section, idx) => (
          <div key={section.label} className="mb-1">
            {idx > 0 && (
              <div className="h-px bg-gradient-to-r from-slate-200/10 via-slate-200/80 to-slate-200/10 my-4 mx-2"></div>
            )}
            <p className="sidebar-section-label">{section.label}</p>
            {section.items.map((item) => {
              const isParentActive = location.pathname.startsWith(item.path);
              return (
                <div key={item.path} className="mb-1">
                  <NavLink
                    to={item.path}
                    end={!item.children}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive || (item.children && isParentActive) ? "active" : ""}`
                    }
                  >
                    {item.icon && <item.icon size={15} />}
                    {item.label}
                  </NavLink>
                  
                  {item.children && isParentActive && (
                    <ul className="mt-2 ml-5.5 space-y-1 border-l border-slate-200 pl-3">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end
                          className={({ isActive }) =>
                            `block py-1.5 px-3 text-[13px] rounded-lg transition-colors ${
                              isActive 
                                ? "font-bold text-primary-600 bg-primary-50/50" 
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium"
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/40 bg-white/50 backdrop-blur-md">
        <UserPanel />
      </div>
    </aside>
  );
}
