import { LogOut, KeyRound } from "lucide-react";
import { useAuth, useSignIn } from "@/hooks/useAuth";
import { OnlineIndicator } from "@/components/shared";
import { supabase } from "@/lib/supabase";
import { useDialogStore } from "@/store/dialogStore";

export function UserPanel() {
  const { user } = useAuth();
  const { signOut } = useSignIn();
  const { alert, confirm } = useDialogStore();

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";
  const email = user?.email ?? "";

  const handleResetPassword = async () => {
    if (!email) return;

    if (
      !(await confirm(
        "Apakah Anda yakin ingin mengirim tautan reset password ke email ini?",
        { severity: "info" }
      ))
    )
      return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/login",
      });
      if (error) throw error;
      alert("Tautan reset password telah dikirim ke email Anda.", {
        severity: "success",
      });
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengirim tautan reset password: " + err.message, {
        severity: "danger",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
        <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tim Kolaborasi
          </span>
          <OnlineIndicator />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-700">{initials}</span>
            </div>
            <div className="min-w-0 pr-1">
              <p
                className="text-xs font-medium text-slate-700 truncate"
                title={email}
              >
                {email}
              </p>
              <p className="text-[10px] text-slate-500">Member</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleResetPassword}
              title="Reset Password"
              className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-slate-200/60 transition-colors"
            >
              <KeyRound size={14} />
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-md text-slate-400 hover:text-negative-600 hover:bg-slate-200/60 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
  );
}
