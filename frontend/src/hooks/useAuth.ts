import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AuthContext } from "@/providers/AuthProvider";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useSignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { data: whitelist } = await supabase
      .from("user_whitelist")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!whitelist) {
      setError("Email tidak terdaftar dalam sistem. Hubungi administrator.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    navigate("/select-module");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return { signIn, signOut, loading, error };
}
