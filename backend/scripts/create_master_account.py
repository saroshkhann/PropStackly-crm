#!/usr/bin/env python3
"""
Master Owner Account & Agency Provisioning Script
=================================================
Use this script when deploying a dedicated private CRM instance for a client
(e.g., on Hostinger VPS, Ubuntu, or local server).

Usage:
  Interactive Mode:
    python backend/scripts/create_master_account.py

  Automated / Non-Interactive Mode:
    python backend/scripts/create_master_account.py \\
      --agency "Skyline Properties Islamabad" \\
      --city "Islamabad" \\
      --name "Chaudhry Daniyal" \\
      --email "ceo@skylineproperties.pk" \\
      --password "SecureClient123!" \\
      --phone "+92 300 8541290" \\
      --clean
"""

import sys
import os
import argparse
import getpass
from decimal import Decimal

# Ensure backend root is in PYTHONPATH
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash, validate_password_strength
from app.models.agency import Agency, AgencyMembership
from app.models.user import User


def provision_master_account(
    agency_name: str,
    city: str,
    owner_name: str,
    owner_email: str,
    password: str,
    phone: str,
    clean_db: bool = False,
    tagline: str = "Premier Real Estate Advisory & Marketing",
    address: str = "Islamabad, Pakistan",
    ntn_number: str = "",
):
    print("=" * 64)
    print("  PropStackly Private CRM Provisioning")
    print("=" * 64)

    if clean_db:
        print("\n⚠️  CLEAN DATABASE REQUESTED: Resetting all tables for fresh deployment...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("✓ Fresh database schema created.")
    else:
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Validate password strength
        validate_password_strength(password)
        normalized_email = owner_email.strip().lower()

        # Check if user already exists
        existing_user = db.query(User).filter(User.email == normalized_email).first()
        if existing_user and not clean_db:
            print(f"\n⚠️  User with email '{normalized_email}' already exists.")
            update_pass = input("Do you want to update this user's password and ensure Master Owner access? (y/N): ").strip().lower()
            if update_pass != "y":
                print("Aborting.")
                return
            existing_user.hashed_password = get_password_hash(password)
            existing_user.is_active = True
            existing_user.is_superuser = True
            user = existing_user
        else:
            user = User(
                email=normalized_email,
                hashed_password=get_password_hash(password),
                full_name=owner_name.strip(),
                phone=phone.strip(),
                role_title="Chief Executive Officer / Principal Broker",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                is_active=True,
                is_superuser=True,
                monthly_target_pkr=Decimal("200000000.00"),
            )
            db.add(user)
            db.flush()

        # Check if agency exists or create new
        existing_agency = db.query(Agency).filter(Agency.name == agency_name.strip()).first()
        if existing_agency and not clean_db:
            agency = existing_agency
        else:
            agency = Agency(
                name=agency_name.strip(),
                tagline=tagline.strip(),
                ntn_number=ntn_number.strip(),
                contact_email=normalized_email,
                contact_phone=phone.strip(),
                whatsapp_business_phone=phone.strip(),
                address=address.strip(),
                city=city.strip(),
                currency_format="Crore_Lakh",
                auto_assignment_rule="round_robin",
                default_followup_reminder_hours="24",
                enable_whatsapp_notifications=True,
                enable_sms_alerts=True,
            )
            db.add(agency)
            db.flush()

        # Ensure Owner Membership
        membership = (
            db.query(AgencyMembership)
            .filter(
                AgencyMembership.agency_id == agency.id,
                AgencyMembership.user_id == user.id,
            )
            .first()
        )
        if not membership:
            membership = AgencyMembership(
                agency_id=agency.id,
                user_id=user.id,
                role="owner",
                is_active=True,
            )
            db.add(membership)
        else:
            membership.role = "owner"
            membership.is_active = True

        db.commit()
        db.refresh(user)
        db.refresh(agency)

        print("\n" + "✨" * 32)
        print("  MASTER OWNER ACCOUNT CREATED SUCCESSFULLY!")
        print("✨" * 32)
        print(f"\n  Agency Name  : {agency.name}")
        print(f"  Operating City: {agency.city}")
        print(f"  Owner Name   : {user.full_name}")
        print(f"  Login Email  : {user.email}")
        print(f"  Login Password: {password}")
        print(f"  Phone Number : {user.phone}")
        print(f"  System Role  : Master Agency Owner (Full Admin & Account Authority)")
        print("\n  👉 Next Steps:")
        print("  1. Login at http://localhost:3000/login or client's domain.")
        print("  2. Go to /team to create accounts for sales consultants.")
        print("  3. Deliver these credentials to the client CEO via WhatsApp.")
        print("=" * 64 + "\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Failed to provision master account: {e}")
        raise e
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Provision Master Owner Account for Private CRM")
    parser.add_argument("--agency", help="Agency / Business Name")
    parser.add_argument("--city", default="Islamabad", help="Operating City (Islamabad, Lahore, Karachi, Rawalpindi)")
    parser.add_argument("--name", help="Owner / CEO Full Name")
    parser.add_argument("--email", help="Owner Login Email")
    parser.add_argument("--password", help="Owner Login Password")
    parser.add_argument("--phone", help="Owner WhatsApp / Phone")
    parser.add_argument("--tagline", default="Premier Real Estate Advisory & Marketing", help="Agency Tagline")
    parser.add_argument("--address", default="Islamabad, Pakistan", help="Agency Address")
    parser.add_argument("--clean", action="store_true", help="Drop existing tables and start with fresh clean DB")

    args = parser.parse_args()

    # If flags are not provided, run in friendly interactive mode
    if not (args.agency and args.name and args.email and args.password):
        print("\n--- Interactive Master Owner Provisioning ---")
        agency = input("Agency / Company Name [e.g. Apex Properties]: ").strip() or "Apex Properties Islamabad"
        city = input("Operating City [Islamabad]: ").strip() or "Islamabad"
        name = input("Owner / CEO Full Name [e.g. Hamza Malik]: ").strip() or "Hamza Malik"
        email = input("Owner Login Email [e.g. admin@propstackly.com]: ").strip() or "admin@propstackly.com"
        phone = input("Owner WhatsApp / Phone [+92 300 5550192]: ").strip() or "+92 300 5550192"

        password = getpass.getpass("Master Password (input hidden) [default: MasterPass2026!]: ").strip()
        if not password:
            password = "MasterPass2026!"

        clean_choice = input("Clean Database? (Wipes existing test data for a brand-new client) [y/N]: ").strip().lower()
        clean_db = clean_choice == "y"

        provision_master_account(
            agency_name=agency,
            city=city,
            owner_name=name,
            owner_email=email,
            password=password,
            phone=phone,
            clean_db=clean_db,
        )
    else:
        phone = args.phone or "+92 300 0000000"
        provision_master_account(
            agency_name=args.agency,
            city=args.city,
            owner_name=args.name,
            owner_email=args.email,
            password=args.password,
            phone=phone,
            clean_db=args.clean,
            tagline=args.tagline,
            address=args.address,
        )


if __name__ == "__main__":
    main()
