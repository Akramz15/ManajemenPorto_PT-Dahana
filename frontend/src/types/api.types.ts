export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface ExtractResponse {
  context: string;
  data: Record<string, unknown>;
  uploaded_by: string;
}

export type TaskStatus = "not_started" | "in_progress" | "done" | "blocked";

export interface ProgressTask {
  id: string;
  project_id: string;
  assigned_to: string;
  title: string;
  status: TaskStatus;
  notes: string | null;
  updated_at: string;
  user_profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Project {
  id: string;
  divisi: "komersial" | "pertahanan";
  kategori: "berjalan" | "kajian";
  nama_proyek: string;
  mitra: string | null;
  nilai_kontrak: number | null;
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
}

export interface KajianTask {
  id: string;
  project_id: string;
  divisi: "komersial" | "pertahanan";
  nama_kajian: string;
  assigned_to: string;
  status: TaskStatus;
  tahapan: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_by: string;
  uploaded_at: string;
}
