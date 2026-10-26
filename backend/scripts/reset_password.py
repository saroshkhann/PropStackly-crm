#!/usr/bin/env python3
"""
Emergency Password Reset Script
===============================
Use this script on the VPS terminal if an Agency Owner or user has forgotten
their password and cannot access the web dashboard.

Usage:
  Interactive:
    python backend/scripts/reset_password.py

  Non-Interactive:
    python backend/scripts/reset_password.py --email admin@propstackly.com --password "NewPass123!"
"""

import sys
import os
import argparse
import getpass

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def reset_user_password(email: str, new_password: str):
    db = SessionLocal()
    try:
        normalized_email = email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()
        if not user:
            print(f"❌ Error: No user account found with email '{normalized_email}'")
            return False

        if len(new_password.strip()) < 6:
            print("❌ Error: Password must be at least 6 characters long")
            return False

        user.hashed_password = get_password_hash(new_password.strip())
        user.token_version = (getattr(user, "token_version", 1) or 1) + 1
        user.is_active = True
        db.commit()

        print("\n" + "=" * 56)
        print("  ✓ PASSWORD RESET SUCCESSFULLY!")
        print("=" * 56)
        print(f"  User Name   : {user.full_name}")
        print(f"  Login Email : {user.email}")
        print(f"  New Password: {new_password}")
        print(f"  Account State: Active")
        print("=" * 56 + "\n")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to reset password: {e}")
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Emergency Password Reset for PropStackly CRM")
    parser.add_argument("--email", help="User Login Email")
    parser.add_argument("--password", help="New Password")

    args = parser.parse_args()

    if not args.email:
        print("\n--- Emergency User Password Reset ---")
        email = input("Enter user's login email address: ").strip()
        if not email:
            print("Email is required.")
            return

        password = getpass.getpass("Enter new password (input hidden): ").strip()
        if not password:
            print("Password cannot be empty.")
            return

        reset_user_password(email, password)
    else:
        password = args.password
        if not password:
            password = getpass.getpass("Enter new password (input hidden): ").strip()
        reset_user_password(args.email, password)


if __name__ == "__main__":
    main()
