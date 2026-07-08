import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface UseChartDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChartData<T>(context: string, subContext?: string): UseChartDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = subContext ? { sub_context: subContext } : {};
      const res = await apiClient.get(`/api/v1/charts/${context}`, { params });
      setData((res.data?.data_json as T) ?? null);
    } catch {
      setError("Gagal memuat data grafik. Silakan upload file Excel terlebih dahulu.");
    } finally {
      setLoading(false);
    }
  }, [context, subContext]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
