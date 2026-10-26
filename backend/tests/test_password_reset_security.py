import time
import jwt
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.services.email_service import get_dispatched_emails, get_last_dispatched_email, clear_dispatched_emails
from app.core.security import create_access_token, create_password_reset_token
from app.models.password_reset import PasswordResetToken
from app.core.rate_limit import password_reset_limiter


def test_forgot_password_generic_response_registered_user(client, test_data):
    """
    Requirement 1 & 3: Never return password-reset tokens in responses.
    Return generic message that does not reveal account presence.
    """
    clear_dispatched_emails()
    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "hamza@apex.pk"},
    )
    assert res.status_code == 200
    data = res.json()

    # Generic message check
    assert data["message"] == "If an account associated with this email address exists, password reset instructions have been sent."

    # Crucial security check: Token must NEVER be in response
    assert "reset_token" not in data
    assert "token" not in data
    assert "email" not in data
    assert "user" not in data
    assert "owner_contact" not in data

    # Verify email was dispatched via secure service
    emails = get_dispatched_emails()
    assert len(emails) == 1
    assert emails[0]["to_email"] == "hamza@apex.pk"
    assert "token" in emails[0]


def test_forgot_password_generic_response_unregistered_user(client):
    """
    Requirement 3: Account enumeration defense.
    Unregistered email returns the identical 200 response with no email sent.
    """
    clear_dispatched_emails()
    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent_stranger@randomdomain.pk"},
    )
    assert res.status_code == 200
    data = res.json()

    # Exact same generic response
    assert data["message"] == "If an account associated with this email address exists, password reset instructions have been sent."
    assert "reset_token" not in data

    # No email should be dispatched
    assert len(get_dispatched_emails()) == 0


def test_forgot_password_generic_response_inactive_user(client, test_data, db_session):
    """
    Requirement 3: Inactive users also receive identical generic response.
    """
    clear_dispatched_emails()
    user = test_data["agent_apex"]
    user.is_active = False
    db_session.commit()

    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": user.email},
    )
    assert res.status_code == 200
    assert res.json()["message"] == "If an account associated with this email address exists, password reset instructions have been sent."
    assert len(get_dispatched_emails()) == 0


def test_valid_password_reset_flow(client, test_data):
    """
    Requirement 2 & 4: Verified email-based password reset workflow.
    """
    clear_dispatched_emails()

    # 1. Request reset
    req_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "hamza@apex.pk"},
    )
    assert req_res.status_code == 200
    assert "reset_token" not in req_res.json()

    # 2. Extract single-use token from verified email delivery
    dispatched = get_last_dispatched_email()
    assert dispatched is not None
    token = dispatched["token"]

    # 3. Submit valid new password meeting strong password policy
    new_password = "SecureNewApexPass2026!"
    reset_res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": new_password},
    )
    assert reset_res.status_code == 200
    assert "successfully" in reset_res.json()["message"]

    # 4. Verify login succeeds with new password
    login_new = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": new_password},
    )
    assert login_new.status_code == 200

    # 5. Verify old password no longer works
    login_old = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "ApexPass123!"},
    )
    assert login_old.status_code == 401


def test_single_use_token_reused_rejected(client, test_data):
    """
    Requirement 4: Enforce single-use behavior (token replay defense).
    """
    clear_dispatched_emails()

    # Request reset
    client.post("/api/v1/auth/forgot-password", json={"email": "hamza@apex.pk"})
    token = get_last_dispatched_email()["token"]

    # First reset: succeeds
    res1 = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "FirstResetPass2026!"},
    )
    assert res1.status_code == 200

    # Second reset with SAME token: MUST BE REJECTED
    res2 = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "SecondResetPass2026!"},
    )
    assert res2.status_code == 400
    assert "already been used" in res2.json()["detail"].lower()


def test_expired_token_rejected(client, test_data, db_session):
    """
    Requirement 4: Enforce token expiration.
    """
    clear_dispatched_emails()
    user = test_data["owner_apex"]

    # Generate token that is already expired
    expired_token, token_hash = create_password_reset_token(
        email=user.email,
        user_id=user.id,
        expires_minutes=-10,  # Expired 10 minutes ago
    )
    now = datetime.now(timezone.utc)
    db_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now - timedelta(minutes=10),
        used_at=None,
    )
    db_session.add(db_token)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": expired_token, "new_password": "ExpiredPassAttempt2026!"},
    )
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower() or "invalid" in res.json()["detail"].lower()


def test_forged_or_tampered_token_rejected(client, test_data):
    """
    Requirement 4: Enforce cryptographic authenticity.
    """
    # 1. Arbitrary random string
    res1 = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "totally_fabricated_token_string", "new_password": "ValidPassword2026!"},
    )
    assert res1.status_code == 400

    # 2. Token signed with wrong secret key
    rogue_token = jwt.encode(
        {"sub": "hamza@apex.pk", "purpose": "password_reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
        "completely_wrong_attacker_secret_key",
        algorithm="HS256",
    )
    res2 = client.post(
        "/api/v1/auth/reset-password",
        json={"token": rogue_token, "new_password": "ValidPassword2026!"},
    )
    assert res2.status_code == 400


def test_wrong_purpose_token_rejected(client, test_data):
    """
    Requirement 4: Enforce correct purpose (access token cannot be used as reset token).
    """
    # Generate a legitimate access token
    access_token = create_access_token(
        subject=test_data["owner_apex"].id,
        agency_id=test_data["agency_1"].id,
    )

    # Attempt to reset password with an access token
    res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": access_token, "new_password": "ValidPassword2026!"},
    )
    assert res.status_code == 400
    assert "invalid" in res.json()["detail"].lower()


def test_strong_password_policy_enforcement(client, test_data):
    """
    Requirement 6: Enforce strong password policy consistently across reset.
    """
    clear_dispatched_emails()
    client.post("/api/v1/auth/forgot-password", json={"email": "hamza@apex.pk"})
    token = get_last_dispatched_email()["token"]

    weak_passwords = [
        ("Short1!", "at least 8 characters"),
        ("lowercaseonly123!", "uppercase letter"),
        ("UPPERCASEONLY123!", "lowercase letter"),
        ("NoSpecialSymbol123", "special character"),
        ("NoNumbersAtAll!@#", "number"),
        ("Admin123!", "common"),
    ]

    for weak_pwd, expected_err in weak_passwords:
        res = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": weak_pwd},
        )
        assert res.status_code == 400
        assert expected_err in res.json()["detail"].lower()


def test_session_invalidation_after_password_reset(client, test_data):
    """
    Requirement 7: Invalidate existing sessions after successful password reset.
    """
    clear_dispatched_emails()

    # 1. Log in to establish an active session
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "hamza@apex.pk", "password": "ApexPass123!"},
    )
    assert login_res.status_code == 200
    old_access_token = login_res.json()["access_token"]

    # 2. Verify active session works
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_access_token}"})
    assert res_me.status_code == 200

    # 3. Request and execute password reset
    client.post("/api/v1/auth/forgot-password", json={"email": "hamza@apex.pk"})
    token = get_last_dispatched_email()["token"]

    reset_res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "NewSessionPass2026!"},
    )
    assert reset_res.status_code == 200

    # 4. Verify old session token is NOW REJECTED (Session Invalidation)
    res_me_after = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_access_token}"})
    assert res_me_after.status_code == 401
    assert "session" in res_me_after.json()["detail"].lower() or "credentials" in res_me_after.json()["detail"].lower()


def test_rate_limiting_forgot_password(client):
    """
    Requirement 5: Rate limiting on forgot-password requests.
    """
    password_reset_limiter.reset_all()

    # 5 attempts within window succeed
    for _ in range(5):
        res = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "rate_limit_test@apex.pk"},
        )
        assert res.status_code == 200

    # 6th attempt triggers 429 Too Many Requests
    blocked_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "rate_limit_test@apex.pk"},
    )
    assert blocked_res.status_code == 429
    assert "too many" in blocked_res.json()["detail"].lower()


def test_rate_limiting_reset_password_verification(client):
    """
    Requirement 5: Rate limiting on token verification attempts.
    """
    password_reset_limiter.reset_all()

    # 5 failed verification attempts
    for _ in range(5):
        res = client.post(
            "/api/v1/auth/reset-password",
            json={"token": "invalid_probe_token", "new_password": "StrongPassword2026!"},
        )
        assert res.status_code == 400

    # 6th verification attempt triggers 429 Too Many Requests
    blocked_res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid_probe_token", "new_password": "StrongPassword2026!"},
    )
    assert blocked_res.status_code == 429
    assert "too many" in blocked_res.json()["detail"].lower()


def test_production_jwt_secret_validation_enforced():
    """
    Requirement 1: Fail startup if SECRET_KEY is missing, too short, or insecure in production.
    Preserve convenient local development through explicit fallback.
    """
    import pytest
    from app.core.config import Settings, DEV_ONLY_FALLBACK_SECRET

    # 1. Production with missing key -> raises ValueError
    with pytest.raises(ValueError, match="SECRET_KEY environment variable is missing"):
        Settings(ENVIRONMENT="production", SECRET_KEY=None)

    # 2. Production with short key (< 32 chars) -> raises ValueError
    with pytest.raises(ValueError, match="at least 32 characters"):
        Settings(ENVIRONMENT="production", SECRET_KEY="short_key_under_32")

    # 3. Production with insecure/dev key -> raises ValueError
    with pytest.raises(ValueError, match="cannot use a known default"):
        Settings(ENVIRONMENT="production", SECRET_KEY="dev_secret_key_veltrivo_pk_7492018")

    # 4. Production with valid 32+ char key -> succeeds
    valid_key = "a8f7e6d5c4b3a20192837465f6e5d4c3b2a10"
    prod_settings = Settings(ENVIRONMENT="production", SECRET_KEY=valid_key)
    assert prod_settings.SECRET_KEY == valid_key

    # 5. Development mode with missing key -> falls back to explicit dev secret
    dev_settings = Settings(ENVIRONMENT="development", SECRET_KEY=None)
    assert dev_settings.SECRET_KEY == DEV_ONLY_FALLBACK_SECRET


def test_email_service_memory_buffer_restricted_to_isolated_tests():
    """
    Requirement 2: Raw password-reset tokens must not be retained in memory
    during normal runtime operation.
    """
    from app.services.email_service import (
        enable_test_token_capture,
        disable_test_token_capture,
        send_password_reset_email,
    )

    # Disable test mode capture
    disable_test_token_capture()

    # Dispatch email
    send_password_reset_email(
        to_email="test_no_leak@apex.pk",
        token="super_secret_raw_token_xyz_123",
        user_name="Hamza",
    )

    # Buffer must be empty in normal runtime
    assert get_dispatched_emails() == []
    assert get_last_dispatched_email() is None

    # Re-enable test mode capture for subsequent tests
    enable_test_token_capture()


def test_logs_never_contain_raw_tokens_or_reset_urls(caplog):
    """
    Requirement 2: Ensure logs never contain raw tokens or reset URLs.
    """
    from app.services.email_service import send_password_reset_email

    raw_token = "unique_traceable_secret_token_abc999"
    with caplog.at_level("DEBUG"):
        send_password_reset_email(
            to_email="audit_user@apex.pk",
            token=raw_token,
            user_name="Audit User",
        )

    # Assert raw token and reset URL are never present in log records
    for record in caplog.records:
        assert raw_token not in record.message
        assert f"token={raw_token}" not in record.message


def test_smtp_delivery_failure_preserves_previous_token(client, test_data):
    """
    Requirement 3: Safe SMTP failure handling.
    If email delivery fails, do NOT silently invalidate a user's previous reset token.
    Avoid exposing account-existence information to the caller.
    """
    from unittest.mock import patch

    clear_dispatched_emails()
    email = "hamza@apex.pk"

    # Step 1: Initial successful reset request produces Token 1
    res1 = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert res1.status_code == 200
    token_1 = get_last_dispatched_email()["token"]

    # Step 2: Second reset request where email dispatch FAILS (e.g. SMTP down)
    with patch("app.api.v1.endpoints.auth.send_password_reset_email", return_value=False):
        res2 = client.post("/api/v1/auth/forgot-password", json={"email": email})
        # Crucial: Generic 200 response returned; does NOT reveal SMTP failure or account existence
        assert res2.status_code == 200
        assert res2.json()["message"] == "If an account associated with this email address exists, password reset instructions have been sent."

    # Step 3: Crucial Check — Token 1 MUST STILL BE VALID and usable!
    reset_res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token_1, "new_password": "SafeRecoveryPass2026!"},
    )
    assert reset_res.status_code == 200
    assert "successfully" in reset_res.json()["message"]


def test_concurrent_token_reuse_prevented(client, test_data, db_session):
    """
    Requirement 4: Ensure concurrent reset requests cannot both successfully consume the same token.
    1. Tests the atomic conditional update mechanics ensuring only one concurrent worker can update used_at.
    2. Tests that subsequent attempts with the same token are strictly rejected.
    """
    import hashlib

    clear_dispatched_emails()
    email = "hamza@apex.pk"

    # 1. Request a reset token
    client.post("/api/v1/auth/forgot-password", json={"email": email})
    token = get_last_dispatched_email()["token"]
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    # 2. Verify atomic conditional update behavior (simulating 2 concurrent database transactions)
    now = datetime.now(timezone.utc)
    db_token = db_session.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()
    assert db_token is not None
    assert db_token.used_at is None

    # Thread A executes atomic consume
    affected_thread_a = db_session.query(PasswordResetToken).filter(
        PasswordResetToken.id == db_token.id,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > now,
    ).update({"used_at": now}, synchronize_session=False)
    db_session.commit()

    # Thread B concurrently attempts atomic consume with the exact same token
    affected_thread_b = db_session.query(PasswordResetToken).filter(
        PasswordResetToken.id == db_token.id,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > now,
    ).update({"used_at": now}, synchronize_session=False)
    db_session.commit()

    # Exactly ONE thread gets affected_rows == 1; Thread B gets 0 and fails with 400
    assert affected_thread_a == 1, "First concurrent transaction must successfully claim the token"
    assert affected_thread_b == 0, "Second concurrent transaction must find 0 available rows and be rejected"

    # 3. Verify API endpoint rejects reuse
    res_reuse = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "ConcurrentPassAttempt2026!"},
    )
    assert res_reuse.status_code == 400
    assert "already been used" in res_reuse.json()["detail"].lower()


def test_token_to_user_consistency_enforced(client, test_data, db_session):
    """
    Requirement 4: Token-to-user consistency.
    Tokens bound to User A cannot be used to reset User B or with mismatched claims.
    """
    user_a = test_data["owner_apex"]
    user_b = test_data["agent_apex"]

    # Generate token legitimately bound to User A
    token_a, hash_a = create_password_reset_token(email=user_a.email, user_id=user_a.id)
    now = datetime.now(timezone.utc)

    # Tamper database record: link Token A's hash to User B's user_id
    db_token = PasswordResetToken(
        user_id=user_b.id,  # Mismatched!
        token_hash=hash_a,
        expires_at=now + timedelta(minutes=15),
        used_at=None,
    )
    db_session.add(db_token)
    db_session.commit()

    # Attempt reset: must be rejected due to token-user mismatch
    res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token_a, "new_password": "TamperCheckPass2026!"},
    )
    assert res.status_code == 400
    assert "mismatch" in res.json()["detail"].lower() or "invalid" in res.json()["detail"].lower()

