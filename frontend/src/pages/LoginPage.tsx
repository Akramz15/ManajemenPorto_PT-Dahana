import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, useSignIn } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { Eye, EyeOff } from "lucide-react";
import logoDahana from "@/assets/Logo_Dahana.png";
import { supabase } from "@/lib/supabase";
import { useDialogStore } from "@/store/dialogStore";

export default function LoginPage() {
  const { session } = useAuth();
  const { signIn, loading, error } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { alert, confirm, prompt } = useDialogStore();

  if (session) return <Navigate to="/select-module" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(email, password);
  };

  const handleForgotPassword = async () => {
    const inputEmail = await prompt("Masukkan email Anda untuk reset password:", {
      confirmText: "Kirim Tautan",
      defaultValue: email,
    });
    
    if (!inputEmail) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(inputEmail, {
        redirectTo: window.location.origin + "/update-password",
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
    <div className="min-h-screen flex items-center justify-center p-4 mesh-bg font-sans">
      <div className="w-full max-w-md card p-8 sm:p-12 relative z-10 border-t-[6px] border-t-primary-500">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center">
            <img
              src={logoDahana}
              alt="PT Dahana BizPort"
              className="h-24 w-auto object-contain drop-shadow-sm"
            />
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-black text-slate-800">
              Masuk ke Akun Anda
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Silakan masukkan email dan kredensial Anda.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 transition-all duration-300 rounded-xl p-3.5 outline-none font-medium"
              placeholder="nama@dahana.id"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 transition-all duration-300 rounded-xl p-3.5 pr-12 outline-none font-medium"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors focus:outline-none bg-white rounded-lg p-1.5 shadow-sm border border-slate-100"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Lupa Password?
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all duration-300 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-6 text-base"
          >
            {loading ? (
              <Spinner
                size="sm"
                className="border-white border-t-transparent"
              />
            ) : null}
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
