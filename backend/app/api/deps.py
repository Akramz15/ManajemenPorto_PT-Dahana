from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import settings

_bearer = HTTPBearer()

supabase_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    try:
        res = supabase_client.auth.get_user(credentials.credentials)
        user = res.user
        if not user:
            raise Exception("No user found")
        return {"user_id": user.id, "email": user.email}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
