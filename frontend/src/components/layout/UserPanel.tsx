import { LogOut } from "lucide-react";
import { useAuth, useSignIn } from "@/hooks/useAuth";
import { OnlineIndicator } from "@/components/shared";

export function UserPanel() {
  const { user } = useAuth();
  const { signOut } = useSignIn();

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";
  const email = user?.email ?? "";

  return (
    <div className="flex flex-col gap-3">
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tim Kolaborasi</span>
        <OnlineIndicator />
      </div>
      <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-blue-700">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700 truncate">{email}</p>
          <p className="text-[10px] text-slate-500">Member</p>
        </div>
      </div>
      <button
        onClick={signOut}
        title="Sign out"
        className="p-1.5 rounded-md text-slate-400 hover:text-explosive-500 hover:bg-slate-200/60 transition-colors shrink-0"
      >
        <LogOut size={14} />
      </button>
    </div>
    </div>
  );
}
