from typing import Generator, Optional
from dataclasses import dataclass
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User
from app.models.agency import Agency, AgencyMembership

security_bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_token_from_request(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> Optional[str]:
    """
    Extract authentication token securely:
    1. Check HttpOnly cookie (preferred for browser sessions).
    2. Fallback to Authorization: Bearer header (for API clients, automated tests).
    """
    cookie_token = request.cookies.get(settings.COOKIE_NAME)
    if cookie_token:
        return cookie_token

    if auth and auth.credentials:
        return auth.credentials

    return None


@dataclass
class TenantContext:
    user: User
    membership: AgencyMembership
    agency: Agency

    @property
    def agency_id(self) -> str:
        return self.membership.agency_id

    @property
    def user_id(self) -> str:
        return self.user.id

    @property
    def role(self) -> str:
        r = (self.membership.role or "agent").lower()
        if r in ("owner", "broker", "admin"):
            return "owner"
        if r in ("manager", "sales_manager"):
            return "manager"
        return "agent"

    @property
    def is_owner(self) -> bool:
        return self.role == "owner" or self.user.is_superuser

    @property
    def is_manager(self) -> bool:
        return self.role in ("owner", "manager") or self.user.is_superuser

    @property
    def is_agent(self) -> bool:
        return not self.is_manager

    @property
    def is_admin(self) -> bool:
        """Alias for is_owner for backward compatibility"""
        return self.is_owner

    @property
    def is_subscription_active(self) -> bool:
        """
        Returns True if the agency is on an active paid plan or within the 3-day free trial window.
        """
        if self.user.is_superuser:
            return True

        sub_status = (self.agency.subscription_status or "trial").lower()
        now_utc = datetime.now(timezone.utc)

        if sub_status in ("active", "lifetime", "enterprise"):
            if self.agency.subscription_expires_at:
                exp = self.agency.subscription_expires_at
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                return now_utc <= exp
            return True

        if sub_status == "trial":
            if self.agency.trial_ends_at:
                trial_end = self.agency.trial_ends_at
                if trial_end.tzinfo is None:
                    trial_end = trial_end.replace(tzinfo=timezone.utc)
                return now_utc <= trial_end
            return True

        return False

    @property
    def trial_hours_remaining(self) -> float:
        if (self.agency.subscription_status or "trial") != "trial" or not self.agency.trial_ends_at:
            return 0.0
        trial_end = self.agency.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        diff = trial_end - datetime.now(timezone.utc)
        return max(0.0, diff.total_seconds() / 3600.0)


def get_current_user(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Invalidate session if token_version in token is older than user's active version
    token_v = payload.get("v")
    user_v = getattr(user, "token_version", 1) or 1
    if token_v is not None and token_v != user_v:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been invalidated due to a password change. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_tenant_context(
    token: Optional[str] = Depends(get_token_from_request),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantContext:
    """
    Enforce multi-tenant isolation.
    NEVER trust an agency_id supplied by the client as proof of authorization.
    Extract and verify membership from the database for the authenticated user.
    """
    token_agency_id = None
    if token:
        payload = decode_token(token)
        if payload:
            token_agency_id = payload.get("agency_id")

    membership_query = db.query(AgencyMembership).filter(
        AgencyMembership.user_id == user.id,
        AgencyMembership.is_active == True,
    )

    if token_agency_id:
        membership = membership_query.filter(AgencyMembership.agency_id == token_agency_id).first()
        if not membership:
            membership = membership_query.first()
    else:
        membership = membership_query.first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to any active agency",
        )

    agency = db.query(Agency).filter(Agency.id == membership.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )

    return TenantContext(user=user, membership=membership, agency=agency)


def require_owner(
    tenant: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    if not tenant.is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Agency Owner permissions required.",
        )
    return tenant


def require_manager(
    tenant: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    if not tenant.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Manager or Owner permissions required.",
        )
    return tenant


def require_admin(
    tenant: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    """Alias for require_owner"""
    return require_owner(tenant)


def require_active_subscription(
    tenant: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    if not tenant.is_subscription_active:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Your 3-day free trial has concluded. Please activate your agency plan via IBFT or WhatsApp support to continue creating records.",
        )
    return tenant
