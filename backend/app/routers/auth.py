"""Authentication endpoints."""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import create_access_token, verify_password

router = APIRouter()


class LoginRequest(BaseModel):
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    """Validate the single configured password and issue a JWT."""
    if not verify_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from ..config import JWT_EXPIRY_HOURS
    return LoginResponse(
        access_token=create_access_token(),
        expires_in=JWT_EXPIRY_HOURS * 60 * 60,
    )
