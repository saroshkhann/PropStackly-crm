import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, status, Request


class LoginRateLimiter:
    """
    Sliding window rate limiter for login requests.
    Prevents brute-force credential stuffing.
    Tracks failed attempts per IP address and per email.
    """

    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        # key -> list of failure timestamps
        self._failures: Dict[str, List[float]] = defaultdict(list)

    def _cleanup_old_attempts(self, key: str, now: float) -> List[float]:
        threshold = now - self.window_seconds
        valid_attempts = [t for t in self._failures[key] if t > threshold]
        self._failures[key] = valid_attempts
        return valid_attempts

    def check_rate_limit(self, client_ip: str, email: str) -> None:
        now = time.time()
        ip_attempts = self._cleanup_old_attempts(f"ip:{client_ip}", now)
        email_attempts = self._cleanup_old_attempts(f"email:{email.lower().strip()}", now)

        if len(ip_attempts) >= self.max_attempts or len(email_attempts) >= self.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please wait 60 seconds before trying again.",
                headers={"Retry-After": str(self.window_seconds)},
            )

    def record_failure(self, client_ip: str, email: str) -> None:
        now = time.time()
        self._failures[f"ip:{client_ip}"].append(now)
        self._failures[f"email:{email.lower().strip()}"].append(now)

    def record_success(self, client_ip: str, email: str) -> None:
        # Reset counter on successful authentication
        self._failures.pop(f"ip:{client_ip}", None)
        self._failures.pop(f"email:{email.lower().strip()}", None)

    def reset_all(self) -> None:
        """For testing purposes"""
        self._failures.clear()


login_limiter = LoginRateLimiter(max_attempts=5, window_seconds=60)


class PasswordResetRateLimiter:
    """
    Sliding window rate limiter for password-reset initiation and verification.
    Prevents enumeration, token brute-forcing, and email flooding.
    """

    def __init__(self, max_requests: int = 5, window_seconds: int = 900):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # key -> list of attempt timestamps
        self._attempts: Dict[str, List[float]] = defaultdict(list)

    def _cleanup_old_attempts(self, key: str, now: float) -> List[float]:
        threshold = now - self.window_seconds
        valid_attempts = [t for t in self._attempts[key] if t > threshold]
        self._attempts[key] = valid_attempts
        return valid_attempts

    def check_forgot_password_limit(self, client_ip: str, email: str) -> None:
        now = time.time()
        ip_attempts = self._cleanup_old_attempts(f"forgot:ip:{client_ip}", now)
        email_attempts = self._cleanup_old_attempts(f"forgot:email:{email.lower().strip()}", now)

        if len(ip_attempts) >= self.max_requests or len(email_attempts) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset requests. Please wait 15 minutes before requesting another reset link.",
                headers={"Retry-After": str(self.window_seconds)},
            )

    def record_forgot_password_attempt(self, client_ip: str, email: str) -> None:
        now = time.time()
        self._attempts[f"forgot:ip:{client_ip}"].append(now)
        self._attempts[f"forgot:email:{email.lower().strip()}"].append(now)

    def check_reset_password_limit(self, client_ip: str) -> None:
        now = time.time()
        ip_attempts = self._cleanup_old_attempts(f"verify:ip:{client_ip}", now)

        if len(ip_attempts) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset verification attempts. Please wait 15 minutes before trying again.",
                headers={"Retry-After": str(self.window_seconds)},
            )

    def record_reset_password_failure(self, client_ip: str) -> None:
        now = time.time()
        self._attempts[f"verify:ip:{client_ip}"].append(now)

    def reset_all(self) -> None:
        """For testing purposes"""
        self._attempts.clear()


password_reset_limiter = PasswordResetRateLimiter(max_requests=5, window_seconds=900)
