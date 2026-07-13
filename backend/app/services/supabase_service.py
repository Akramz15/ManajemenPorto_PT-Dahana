from supabase import create_client, Client
from app.core.config import settings


class SupabaseService:
    def __init__(self) -> None:
        self._client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    def get_chart_data(self, context: str, sub_context: str | None) -> dict | None:
        query = self._client.table("chart_data").select("*").eq("context", context)
        if sub_context:
            query = query.eq("sub_context", sub_context)
        result = query.order("created_at", desc=True).limit(1).execute()
        return result.data[0] if result.data else None

    def save_chart_data(
        self,
        context: str,
        sub_context: str | None,
        data_json: dict,
        source_file: str,
        uploaded_by: str,
    ) -> None:
        self._client.table("chart_data").insert(
            {
                "context": context,
                "sub_context": sub_context,
                "data_json": data_json,
                "source_file": source_file,
                "uploaded_by": uploaded_by,
            }
        ).execute()

    def get_progress_tasks(self, project_id: str) -> list[dict]:
        result = (
            self._client.table("progress_tasks")
            .select("*, user_profiles(display_name, avatar_url)")
            .eq("project_id", project_id)
            .execute()
        )
        return result.data

    def update_task(self, task_id: str, payload: dict, user_id: str) -> list[dict]:
        result = (
            self._client.table("progress_tasks")
            .update({**payload, "updated_at": "now()"})
            .eq("id", task_id)
            .eq("assigned_to", user_id)
            .execute()
        )
        return result.data

    def get_project_documents(self, project_id: str) -> list[dict]:
        result = (
            self._client.table("documents")
            .select("*")
            .eq("project_id", project_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return result.data

    def save_document(self, document: dict) -> dict:
        result = self._client.table("documents").insert(document).execute()
        return result.data[0] if result.data else {}

    def get_kajian_tasks(self, divisi: str) -> list[dict]:
        result = (
            self._client.table("kajian_tasks")
            .select("*, user_profiles(display_name, avatar_url)")
            .eq("divisi", divisi)
            .execute()
        )
        return result.data

    def get_projects(self, divisi: str) -> list[dict]:
        result = (
            self._client.table("project_berjalan")
            .select("*")
            .eq("divisi", divisi)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
