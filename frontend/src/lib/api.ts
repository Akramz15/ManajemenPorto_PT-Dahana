import axios from "axios";
import { supabase } from "./supabase";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://manajemen-porto-pt-dahana.vercel.app",
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);
