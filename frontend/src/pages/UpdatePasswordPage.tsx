import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDialogStore } from "@/store/dialogStore";
import logoDahana from "@/assets/Logo_Dahana.png";

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { alert } = useDialogStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the user is currently logged in or recovering
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      // If there's no session, they shouldn't be on this page directly
      if (!session) {
        navigate("/login", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Password baru dan konfirmasi password tidak cocok.", {
        severity: "danger",
      });
      return;
    }
    
    if (password.length < 6) {
      alert("Password minimal harus 6 karakter.", {
        severity: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      alert("Password berhasil diperbarui! Silakan masuk kembali dengan password baru Anda.", {
        severity: "success",
      });
      
      // Sign out to force the user to login with the new password
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error("Error updating password:", err);
      alert("Gagal memperbarui password: " + err.message, {
        severity: "danger",
      });
    } finally {
      setLoading(false);
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
              Perbarui Password
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Silakan masukkan password baru Anda.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Password Baru
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
                minLength={6}
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50/50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 transition-all duration-300 rounded-xl p-3.5 outline-none font-medium"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary-600/20 transition-all duration-300 active:scale-[0.98] mt-4 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Simpan Password Baru"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
