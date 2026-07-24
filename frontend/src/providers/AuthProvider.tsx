/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface Profile {
  display_name?: string;
  role?: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const upsertProfile = async (user: User) => {
      await supabase.from("user_profiles").upsert(
        {
          id: user.id,
          display_name: user.email?.split('@')[0] || 'User',
          role: 'member',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (mounted && data) {
        setProfile(data);
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (currentSession?.user) {
            await upsertProfile(currentSession.user);
          }
          setSession(currentSession);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'INITIAL_SESSION') return;
      if (mounted) {
        if (currentSession?.user) {
          await upsertProfile(currentSession.user);
        } else {
          setProfile(null);
        }
        setSession(currentSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
