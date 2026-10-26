import os
import re
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional, Tuple, Dict
import jwt
import bcrypt
from fastapi import HTTPException, status

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash or pbkdf2 hash"""
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), hashed_password.encode("utf-8")
            )
        elif "$" in hashed_password:
            salt_hex, key_hex = hashed_password.split("$", 1)
            salt = bytes.fromhex(salt_hex)
            new_key = hashlib.pbkdf2_hmac(
                "sha256", plain_password.encode("utf-8"), salt, 100_000
            )
            return hmac.compare_digest(new_key.hex(), key_hex)
        return False
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash, fallback to PBKDF2-HMAC-SHA256"""
    try:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")
    except Exception:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
        return f"{salt.hex()}${key.hex()}"


COMMON_WEAK_PASSWORDS = {
    "password", "password123", "admin123", "admin123!", "agent123",
    "12345678", "123456789", "qwertyui", "qwerty123", "letmein123",
    "welcome123", "pakistan123", "islamabad123"
}


def validate_password_strength(password: str) -> None:
    """
    Enforce enterprise-grade password security policy:
    1. Minimum 8 characters, maximum 128 characters.
    2. At least one uppercase letter (A-Z).
    3. At least one lowercase letter (a-z).
    4. At least one numeric digit (0-9).
    5. At least one special symbol.
    6. Cannot match common weak passwords.
    """
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot be empty",
        )

    pwd = password.strip()
    if len(pwd) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )
    if len(pwd) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must not exceed 128 characters",
        )

    if not re.search(r"[A-Z]", pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter",
        )
    if not re.search(r"[a-z]", pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter",
        )
    if not re.search(r"[0-9]", pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number",
        )
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?~`]", pwd):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character",
        )

    if pwd.lower() in COMMON_WEAK_PASSWORDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too common and easily guessable. Please choose a more complex password.",
        )


def create_access_token(
    subject: Union[str, Any],
    agency_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
    token_version: int = 1,
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "agency_id": str(agency_id) if agency_id else None,
        "v": int(token_version) if token_version is not None else 1,
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return decoded
    except (jwt.PyJWTError, Exception):
        return None


def create_password_reset_token(
    email: str, user_id: str, expires_minutes: int = 15
) -> Tuple[str, str]:
    """
    Generate a signed JWT token specifically for password reset and return both:
    1. The raw signed JWT token to be emailed to the user.
    2. The SHA-256 hash of the token to be stored in the database for single-use verification.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    jti = secrets.token_hex(16)
    to_encode = {
        "exp": expire,
        "sub": email.lower().strip(),
        "uid": str(user_id),
        "purpose": "password_reset",
        "jti": jti,
    }
    jwt_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hashlib.sha256(jwt_token.encode("utf-8")).hexdigest()
    return jwt_token, token_hash


def verify_password_reset_token_jwt(token: str) -> Optional[dict]:
    """
    Verify JWT signature, expiration, purpose, subject, and uid binding.
    Returns decoded dictionary if valid, or None if invalid/expired/forged.
    """
    try:
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if decoded.get("purpose") != "password_reset":
            return None
        if not decoded.get("sub"):
            return None
        if not decoded.get("uid"):
            return None
        return decoded
    except Exception:
        return None
