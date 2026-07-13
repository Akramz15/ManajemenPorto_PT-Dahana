from fastapi import HTTPException, status
from jose import JWTError, jwt

_ALGORITHM = "HS256"


def verify_supabase_jwt(token: str, jwt_secret: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=[_ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        with open("jwt_error.log", "a") as f:
            f.write(f"JWT Error: {e} | Token: {token[:20]}... | Secret: {jwt_secret[:5]}...\n")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
