import time
import logging
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

logger = logging.getLogger("app.auth")

from app.api.deps import get_db, get_tenant_context, TenantContext
from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    validate_password_strength,
    create_password_reset_token,
    verify_password_reset_token_jwt,
)
from app.core.rate_limit import login_limiter, password_reset_limiter
from app.models.user import User
from app.models.agency import AgencyMembership, Agency
from app.models.password_reset import PasswordResetToken
from app.services.email_service import send_password_reset_email
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    Token,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.common import MessageResponse

router = APIRouter()

GENERIC_FORGOT_PASSWORD_RESPONSE = MessageResponse(
    message="If an account associated with this email address exists, password reset instructions have been sent."
)


def _get_client_ip(req: Request) -> str:
    """Extract real client IP behind reverse proxy / Next.js SSR bridge."""
    forwarded_for = req.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return req.client.host if req.client else "127.0.0.1"


@router.post("/login", response_model=Token)
def login(
    req: Request,
    response: Response,
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    client_ip = _get_client_ip(req)
    email = body.email.lower().strip()

    # Rate limiting check
    login_limiter.check_rate_limit(client_ip, email)

    user = db.query(User).filter(User.email == email).first()

    # Safe error: Don't reveal whether user exists
    if not user or not verify_password(body.password, user.hashed_password):
        login_limiter.record_failure(client_ip, email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        login_limiter.record_failure(client_ip, email)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact your agency administrator.",
        )

    # Success: reset rate limit counters
    login_limiter.record_success(client_ip, email)

    membership = (
        db.query(AgencyMembership)
        .filter(AgencyMembership.user_id == user.id, AgencyMembership.is_active == True)
        .first()
    )

    agency_id = membership.agency_id if membership else None
    raw_role = (membership.role if membership else "agent").lower()

    # Normalize role into owner, manager, agent
    if raw_role in ("owner", "admin", "broker"):
        normalized_role = "owner"
    elif raw_role in ("manager", "sales_manager"):
        normalized_role = "manager"
    else:
        normalized_role = "agent"

    agency_name = None
    if agency_id:
        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if agency:
            agency_name = agency.name

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        agency_id=agency_id,
        expires_delta=access_token_expires,
        token_version=getattr(user, "token_version", 1) or 1,
    )

    # Set secure HttpOnly cookie on response
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        path="/",
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role_title": user.role_title,
            "role": normalized_role,
            "avatar_url": user.avatar_url,
            "agency_id": agency_id,
            "agency_name": agency_name,
        },
    }


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Registers a new real estate agency and creates the principal broker owner account.
    Automatically initializes the 3-day free trial (72h) and returns an authenticated session.
    """
    email = body.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required.",
        )

    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )

    now_utc = datetime.now(timezone.utc)
    trial_end = now_utc + timedelta(days=3)

    # 1. Create Agency with 3-Day Free Trial
    agency = Agency(
        name=body.agency_name.strip() or "My Real Estate Agency",
        contact_email=email,
        contact_phone=body.phone.strip(),
        city=body.city.strip() or "Islamabad",
        subscription_status="trial",
        subscription_plan="starter",
        trial_ends_at=trial_end,
    )
    db.add(agency)
    db.flush()

    # 2. Create User
    user = User(
        email=email,
        full_name=body.full_name.strip() or "Principal Broker",
        phone=body.phone.strip(),
        hashed_password=get_password_hash(body.password),
        role_title="Principal Broker / Agency Owner",
        is_active=True,
    )
    db.add(user)
    db.flush()

    # 3. Create AgencyMembership
    membership = AgencyMembership(
        agency_id=agency.id,
        user_id=user.id,
        role="owner",
        is_active=True,
    )
    db.add(membership)
    db.commit()
    db.refresh(user)
    db.refresh(agency)

    # 4. Generate Access Token & Set HttpOnly Cookie
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        agency_id=agency.id,
        expires_delta=access_token_expires,
        token_version=getattr(user, "token_version", 1) or 1,
    )

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role_title": user.role_title,
            "role": "owner",
            "avatar_url": user.avatar_url,
            "agency_id": agency.id,
            "agency_name": agency.name,
            "subscription_status": agency.subscription_status,
            "trial_ends_at": agency.trial_ends_at.isoformat() if agency.trial_ends_at else None,
        },
    }


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response):
    """
    Clears the HttpOnly session cookie to sign out securely.
    """
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
    )
    return MessageResponse(message="Signed out successfully")


@router.get("/me")
def get_me(tenant: TenantContext = Depends(get_tenant_context)):
    return {
        "user": {
            "id": tenant.user.id,
            "email": tenant.user.email,
            "full_name": tenant.user.full_name,
            "phone": tenant.user.phone,
            "role_title": tenant.user.role_title,
            "role": tenant.role,  # normalized: owner, manager, agent
            "avatar_url": tenant.user.avatar_url,
        },
        "agency": {
            "id": tenant.agency.id,
            "name": tenant.agency.name,
            "tagline": tenant.agency.tagline,
            "city": tenant.agency.city,
            "currency_format": tenant.agency.currency_format,
            "subscription_status": tenant.agency.subscription_status or "trial",
            "subscription_plan": tenant.agency.subscription_plan or "starter",
            "trial_ends_at": tenant.agency.trial_ends_at.isoformat() if tenant.agency.trial_ends_at else None,
            "subscription_expires_at": tenant.agency.subscription_expires_at.isoformat() if tenant.agency.subscription_expires_at else None,
            "is_subscription_active": tenant.is_subscription_active,
            "trial_hours_remaining": round(tenant.trial_hours_remaining, 1),
        },
    }


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Allow any authenticated user (Owner, Manager, Agent) to change their own password.
    Enforces strong password policy and invalidates other sessions.
    """
    # 1. Verify current password
    if not verify_password(body.current_password, tenant.user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # 2. Enforce strong password policy
    validate_password_strength(body.new_password)

    # 3. Hash and store
    tenant.user.hashed_password = get_password_hash(body.new_password.strip())
    # 4. Invalidate all other active sessions across browsers
    tenant.user.token_version = (getattr(tenant.user, "token_version", 1) or 1) + 1
    db.commit()

    return MessageResponse(
        message="Your password has been changed successfully. Other active sessions have been signed out."
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    req: Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Initiate secure password recovery.
    Security protections:
    1. Generic response: Does NOT leak whether email exists (prevents account enumeration).
    2. Rate limiting: Enforces limits per IP and per email.
    3. Token privacy: NEVER returns reset token in the HTTP response.
    4. Safe delivery handling: If email delivery fails, existing reset tokens are NOT
       invalidated, preserving working recovery options without leaking account presence.
    """
    client_ip = _get_client_ip(req)
    email = body.email.lower().strip()

    # Rate limiting
    password_reset_limiter.check_forgot_password_limit(client_ip, email)
    password_reset_limiter.record_forgot_password_attempt(client_ip, email)

    user = db.query(User).filter(User.email == email).first()

    # Generic response for unregistered or deactivated users
    if not user or not user.is_active:
        time.sleep(0.05)  # Equalize response timing
        return GENERIC_FORGOT_PASSWORD_RESPONSE

    now = datetime.now(timezone.utc)

    # Generate cryptographically signed reset token and hash
    raw_token, token_hash = create_password_reset_token(
        email=user.email,
        user_id=user.id,
        expires_minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
    )

    # Attempt email dispatch FIRST before altering or invalidating existing tokens
    try:
        delivered = send_password_reset_email(
            to_email=user.email,
            token=raw_token,
            user_name=user.full_name,
        )
    except Exception as email_exc:
        logger.error("Failed to send password reset email for user %s: %s", user.id, type(email_exc).__name__)
        delivered = False

    if delivered:
        # Invalidate any previous unused reset tokens for this user ONLY upon verified delivery
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        ).update({"used_at": now})

        expires_at = now + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        db_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            used_at=None,
        )
        db.add(db_token)
        db.commit()
    else:
        # Safe failure mode:
        # Do not invalidate user's previous reset token if delivery failed.
        # Do not persist the unusable un-emailed token.
        # Preserve generic response to prevent account enumeration.
        logger.warning("Password reset delivery failed for user_id=%s. Existing tokens preserved.", user.id)

    time.sleep(0.05)  # Equalize timing
    return GENERIC_FORGOT_PASSWORD_RESPONSE


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    req: Request,
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Verify reset token, enforce atomic single-use, validate token-to-user consistency,
    validate password strength, and update password. Invalidates all prior active sessions.
    """
    client_ip = _get_client_ip(req)

    # Rate limiting on token verification
    password_reset_limiter.check_reset_password_limit(client_ip)

    # 1. Verify JWT signature, expiration, and purpose
    payload = verify_password_reset_token_jwt(body.token)
    if not payload:
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link. Please request a new one.",
        )

    jwt_sub = (payload.get("sub") or "").lower().strip()
    jwt_uid = str(payload.get("uid") or "").strip()
    if not jwt_sub or not jwt_uid:
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token format.",
        )

    # 2. Pre-validate enterprise password policy BEFORE consuming token
    validate_password_strength(body.new_password)

    # 3. Locate and verify user
    user = db.query(User).filter(User.id == jwt_uid).first()
    if not user or not user.is_active or user.email.lower().strip() != jwt_sub:
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account associated with this reset link is invalid or inactive.",
        )

    # 4. Verify single-use database record
    token_hash = hashlib.sha256(body.token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()

    if not db_token or db_token.used_at is not None:
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used or is invalid. Please request a new one.",
        )

    # 5. Token-to-user consistency check
    if str(db_token.user_id) != str(user.id):
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token user binding mismatch. Please request a new reset link.",
        )

    # 6. Database expiration check
    token_expires = db_token.expires_at
    if token_expires.tzinfo is None:
        token_expires = token_expires.replace(tzinfo=timezone.utc)
    if now > token_expires:
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new one.",
        )

    # 7. Atomic single-use consumption against concurrent token reuse
    affected_rows = db.query(PasswordResetToken).filter(
        PasswordResetToken.id == db_token.id,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > now,
    ).update({"used_at": now}, synchronize_session=False)

    if affected_rows != 1:
        db.rollback()
        password_reset_limiter.record_reset_password_failure(client_ip)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used or has expired. Please request a new one.",
        )

    # 8. Update user credentials & session invalidation
    user.hashed_password = get_password_hash(body.new_password.strip())
    # Invalidate all prior sessions across all browsers
    user.token_version = (getattr(user, "token_version", 1) or 1) + 1

    # Invalidate any other pending tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now}, synchronize_session=False)

    db.commit()

    return MessageResponse(
        message="Your password has been reset successfully. You can now log in with your new password."
    )

