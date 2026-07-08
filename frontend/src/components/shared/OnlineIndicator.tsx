import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";

export function OnlineIndicator() {
  const onlineUsers = usePresence();
  const { session } = useAuth();

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2 mr-2">
        {onlineUsers.map((user) => (
          <div
            key={user.user_id}
            title={`${user.display_name} ${user.user_id === session?.user?.id ? "(kamu)" : "— online"}`}
            className="relative z-10 hover:z-20 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center
                            text-xs font-bold text-slate-600 border-2 border-white shadow-sm">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-positive-500 rounded-full
                             border-2 border-white" />
          </div>
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-500">{onlineUsers.length} online</span>
    </div>
  );
}
