# Modul 09 — Realtime & Kolaborasi

## 1. Strategi Realtime

Supabase Realtime digunakan untuk:
- **Progress tasks** — sinkronisasi status tugas antar user
- **Kajian tasks** — update tahapan kajian
- **Chart data** — notifikasi saat ada upload Excel baru
- **Documents** — notifikasi saat ada dokumen baru diupload

---

## 2. useRealtime Hook

```typescript
// src/hooks/useRealtime.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeFilter = Record<string, string | number>;

interface UseRealtimeOptions<T> {
  table: string;
  filter?: RealtimeFilter;
  initialFetch?: () => Promise<T[]>;
}

export function useRealtime<T extends { id: string }>({
  table,
  filter,
  initialFetch,
}: UseRealtimeOptions<T>) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const applyFilter = useCallback((channel: RealtimeChannel) => {
    if (filter) {
      const filterStr = Object.entries(filter)
        .map(([k, v]) => `${k}=eq.${v}`)
        .join(",");
      return channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: filterStr },
        handleChange
      );
    }
    return channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      handleChange
    );
  }, [table, filter]);

  function handleChange(payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: T;
    old: { id: string };
  }) {
    setRecords((prev) => {
      switch (payload.eventType) {
        case "INSERT":
          return [...prev, payload.new];
        case "UPDATE":
          return prev.map((r) => r.id === payload.new.id ? payload.new : r);
        case "DELETE":
          return prev.filter((r) => r.id !== payload.old.id);
        default:
          return prev;
      }
    });
  }

  useEffect(() => {
    let channel: RealtimeChannel;

    const init = async () => {
      if (initialFetch) {
        try {
          const data = await initialFetch();
          setRecords(data);
        } catch {
          setRecords([]);
        }
      }
      setLoading(false);

      channel = supabase.channel(`rt-${table}-${JSON.stringify(filter ?? {})}`);
      applyFilter(channel).subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(filter)]);

  return { records, loading };
}
```

---

## 3. usePresence Hook (Online Indicators)

```typescript
// src/hooks/usePresence.ts
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
        const users = Object.values(state).flat();
        setOnlineUsers(users);
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

    return () => { supabase.removeChannel(channel); };
  }, [session, roomId]);

  return onlineUsers;
}
```

---

## 4. OnlineIndicator Component

```typescript
// src/components/shared/OnlineIndicator.tsx
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";

export function OnlineIndicator() {
  const onlineUsers = usePresence();
  const { session } = useAuth();

  return (
    <div className="flex items-center gap-1.5">
      {onlineUsers.map((user) => (
        <div
          key={user.user_id}
          title={`${user.display_name} ${user.user_id === session?.user.id ? "(kamu)" : "— online"}`}
          className="relative"
        >
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center
                          text-xs font-bold text-slate-600 border-2 border-white">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-positive-500 rounded-full
                           border border-white" />
        </div>
      ))}
      <span className="text-xs text-slate-400">{onlineUsers.length} online</span>
    </div>
  );
}
```

---

## 5. Upload Notification Toast

```typescript
// src/components/shared/UploadToast.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, X } from "lucide-react";

interface ToastMessage {
  id: string;
  text: string;
}

export function UploadToastListener() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("chart-upload-notifications")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chart_data"
      }, (payload) => {
        const newToast: ToastMessage = {
          id: crypto.randomUUID(),
          text: `Data ${payload.new.context?.toUpperCase() ?? "baru"} telah diperbarui`,
        };
        setToasts((prev) => [...prev, newToast]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 4000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 bg-white border border-slate-200
                     rounded-xl shadow-card-hover px-4 py-3 text-sm
                     animate-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle size={16} className="text-positive-500 shrink-0" />
          <span className="text-slate-700">{toast.text}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Real-time Progress Update Flow

```
User A mengubah status task
         ↓
PATCH /api/v1/progress/{task_id}
         ↓
FastAPI → Supabase UPDATE progress_tasks
         ↓
Supabase Realtime broadcast ke semua subscriber
         ↓
useRealtime hook UPDATE state di User B, C, D
         ↓
ProgressTracker re-render dengan status baru
```

---

## 📌 Prompt AI — Modul 09

```
Implementasikan sistem realtime dan kolaborasi untuk Dahana BizPort
menggunakan Supabase Realtime.

Tugas:
1. Buat src/hooks/useRealtime.ts — generic hook yang subscribe ke
   Supabase Realtime dan menangani INSERT/UPDATE/DELETE secara lokal
2. Buat src/hooks/usePresence.ts — presence tracking untuk menampilkan
   user mana saja yang sedang online
3. Buat src/components/shared/OnlineIndicator.tsx — avatar kecil dengan
   indikator hijau untuk user yang online
4. Buat src/components/shared/UploadToastListener.tsx — toast notification
   saat ada user lain yang upload data baru
5. Integrasikan useRealtime ke ProgressTracker sehingga perubahan status
   langsung terlihat di semua user tanpa refresh

Pastikan cleanup channel saat komponen unmount untuk mencegah memory leak.
Kode clean, production-ready.
```
