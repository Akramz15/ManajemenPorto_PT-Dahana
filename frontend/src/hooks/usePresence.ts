import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface OnlineUser {
  user_id: string;
  display_name: string;
  online_at: string;
}

export function usePresence(roomId = "global") {
  const { session } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase.channel(`presence-${roomId}`, {
      config: { presence: { key: session.user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<OnlineUser>();
        const allPresences = Object.values(state).flat();
        
        // Deduplicate by user_id so multiple tabs count as 1 user
        const uniqueUsers = Array.from(
          new Map(allPresences.map((u) => [u.user_id, u])).values()
        );
        
        setOnlineUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: session.user.id,
            display_name: session.user.email ?? "User",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, roomId]);

  return onlineUsers;
}
