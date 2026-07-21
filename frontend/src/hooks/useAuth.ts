import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Ensure user profile exists
        await supabase.from("user_profiles").upsert(
          {
            id: session.user.id,
            display_name: session.user.email?.split('@')[0] || 'User',
            role: 'member',
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await supabase.from("user_profiles").upsert(
          {
            id: session.user.id,
            display_name: session.user.email?.split('@')[0] || 'User',
            role: 'member',
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
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
