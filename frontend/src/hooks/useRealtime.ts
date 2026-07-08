import { useEffect, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

  function handleChange(payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: T;
    old: { id: string };
  }) {
    setRecords((prev) => {
      if (payload.eventType === "INSERT") return [...prev, payload.new];
      if (payload.eventType === "UPDATE")
        return prev.map((r) => (r.id === payload.new.id ? payload.new : r));
      if (payload.eventType === "DELETE")
        return prev.filter((r) => r.id !== payload.old.id);
      return prev;
    });
  }

  const channelKey = `rt-${table}-${JSON.stringify(filter ?? {})}`;

  const init = useCallback(async () => {
    if (initialFetch) {
      try {
        const data = await initialFetch();
        setRecords(data);
      } catch {
        setRecords([]);
      }
    }
    setLoading(false);
  }, [initialFetch]);

  useEffect(() => {
    init();

    const channel: RealtimeChannel = supabase.channel(channelKey);

    if (filter) {
      const filterStr = Object.entries(filter)
        .map(([k, v]) => `${k}=eq.${v}`)
        .join(",");
      channel.on(
        "postgres_changes" as Parameters<typeof channel.on>[0],
        { event: "*", schema: "public", table, filter: filterStr },
        handleChange as Parameters<typeof channel.on>[2]
      );
    } else {
      channel.on(
        "postgres_changes" as Parameters<typeof channel.on>[0],
        { event: "*", schema: "public", table },
        handleChange as Parameters<typeof channel.on>[2]
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelKey, table]);

  return { records, loading };
}
