import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}
