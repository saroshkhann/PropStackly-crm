import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger("app.email_service")

# Test mailbox buffer: ONLY captured when explicitly enabled in isolated automated tests
_test_mode_capture: bool = False
_test_mailbox: List[Dict[str, Any]] = []


def enable_test_token_capture() -> None:
    """Explicitly enable capturing reset tokens in-memory for automated testing only."""
    global _test_mode_capture
    _test_mode_capture = True


def disable_test_token_capture() -> None:
    """Disable capturing reset tokens and flush the in-memory test mailbox."""
    global _test_mode_capture
    _test_mode_capture = False
    _test_mailbox.clear()


def clear_dispatched_emails() -> None:
    """Clear test email buffer (used in tests)."""
    _test_mailbox.clear()


def get_dispatched_emails() -> List[Dict[str, Any]]:
    """
    Get all dispatched emails in the test mailbox.
    Returns empty list if test capture is not explicitly enabled.
    """
    if not _test_mode_capture:
        return []
    return list(_test_mailbox)


def get_last_dispatched_email() -> Optional[Dict[str, Any]]:
    """
    Get the most recently dispatched email in the test mailbox.
    Returns None if test capture is not explicitly enabled or mailbox is empty.
    """
    if not _test_mode_capture or not _test_mailbox:
        return None
    return _test_mailbox[-1]


def send_password_reset_email(to_email: str, token: str, user_name: Optional[str] = None) -> bool:
    """
    Send a verified password-reset email to the user with a single-use token link.
    If SMTP credentials are configured in settings, delivers via SMTP.
    In isolated test runs, captures the message in the isolated test mailbox.
    In normal runtime, raw tokens are NEVER retained in memory or logged.
    """
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?token={token}"
    greeting_name = user_name or "Valued Partner"

    subject = f"Password Reset Request - {settings.PROJECT_NAME}"

    text_content = f"""Hello {greeting_name},

We received a request to reset the password for your {settings.PROJECT_NAME} account ({to_email}).

To set a new password, click the link below or copy and paste it into your browser:
{reset_url}

This password reset link is valid for {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes and can only be used once.

If you did not request a password reset, please ignore this email or notify your agency administrator immediately. Your current password remains secure.

Best regards,
{settings.EMAILS_FROM_NAME}
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1E293B;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <tr>
      <td>
        <h2 style="color: #0F172A; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello <strong>{greeting_name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">We received a request to reset the password for your account associated with <strong>{to_email}</strong>.</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="{reset_url}" style="display: inline-block; background-color: #EE6427; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(238, 100, 39, 0.3);">Reset My Password</a>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #64748B;">This link is valid for <strong>{settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes</strong> and can only be used once.</p>
        <p style="font-size: 12px; line-height: 1.5; color: #94A3B8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #F1F5F9;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    # Record in test buffer ONLY when test mode capture is explicitly enabled
    if _test_mode_capture:
        _test_mailbox.append({
            "to_email": to_email,
            "subject": subject,
            "token": token,
            "reset_url": reset_url,
            "user_name": greeting_name,
        })

    # If real SMTP is configured in environment, dispatch live email
    if settings.SMTP_HOST:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())

            logger.info("Password reset email delivered via SMTP to %s", to_email)
            return True
        except Exception as e:
            logger.error("Failed to deliver password reset email via SMTP to %s: %s", to_email, type(e).__name__)
            return False
    else:
        # If running in production without SMTP, fail delivery safely
        env = (settings.ENVIRONMENT or "development").strip().lower()
        if env in ("production", "prod", "staging") and not _test_mode_capture:
            logger.error("SMTP_HOST not configured in %s mode. Cannot deliver password reset email to %s", env, to_email)
            return False

        logger.info("SMTP_HOST not configured in settings. Email notification processed for %s.", to_email)
        return True
