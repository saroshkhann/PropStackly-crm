from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    agency_id: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    agency_name: str
    full_name: str
    email: str
    phone: str
    city: str = "Islamabad"
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ResetAgentPasswordRequest(BaseModel):
    new_password: str

