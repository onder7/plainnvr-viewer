"""Single-password JWT authentication for the read-only viewer."""
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, Query, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import VIEWER_PASSWORD, JWT_ALGORITHM, JWT_EXPIRY_HOURS, JWT_SECRET

security = HTTPBearer(auto_error=False)


def verify_password(password: str) -> bool:
    """Check the submitted password against the configured environment value."""
    return password == VIEWER_PASSWORD


def create_access_token() -> str:
    """Create a short, stateless JWT for the single viewer identity."""
    now = datetime.now(timezone.utc)
    payload = {
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": now,
        "sub": "viewer",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("sub") != "viewer":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> None:
    """FastAPI dependency that requires a valid Bearer token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _decode_token(credentials.credentials)


def verify_video_token(token: str = Query(..., description="JWT for HTML5 video playback")) -> None:
    """Validate a token passed in the video URL to preserve native Range requests."""
    _decode_token(token)
