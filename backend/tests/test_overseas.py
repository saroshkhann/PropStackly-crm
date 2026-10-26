import pytest
from decimal import Decimal
from fastapi.testclient import TestClient

from app.services.currency_service import (
    convert_pkr,
    format_currency_value,
    convert_pkr_to_all,
    get_supported_currencies,
)
from app.services.timezone_service import (
    convert_appointment_time,
    format_virtual_tour_invitation,
    get_supported_timezones,
)
from app.models.property import Property


def test_currency_conversion_rates():
    # Test 85,000,000 PKR (8.50 Crore)
    pkr_amount = Decimal("85000000.00")
    
    gbp = convert_pkr(pkr_amount, "GBP")
    usd = convert_pkr(pkr_amount, "USD")
    aed = convert_pkr(pkr_amount, "AED")
    sar = convert_pkr(pkr_amount, "SAR")
    
    assert gbp > 0
    assert usd > 0
    assert aed > 0
    assert sar > 0
    
    # Check proper ordering: 1 GBP is worth more PKR than 1 USD, so GBP amount should be less than USD amount
    assert gbp < usd
    
    # Test formatting
    assert "Crore" in format_currency_value(pkr_amount, "PKR")
    assert "£" in format_currency_value(gbp, "GBP")
    assert "$" in format_currency_value(usd, "USD")
    assert "AED" in format_currency_value(aed, "AED")
    assert "SAR" in format_currency_value(sar, "SAR")

    all_conversions = convert_pkr_to_all(pkr_amount)
    assert "PKR" in all_conversions
    assert "USD" in all_conversions
    assert "GBP" in all_conversions
    assert "AED" in all_conversions
    assert "SAR" in all_conversions


def test_timezone_conversion_service():
    # Test 8:00 PM PKT (20:00) on 2026-10-24
    result = convert_appointment_time("2026-10-24", "20:00", source_tz="Asia/Karachi")
    conversions = result["conversions"]
    
    assert "Europe/London" in conversions
    assert "Asia/Dubai" in conversions
    assert "Asia/Riyadh" in conversions
    assert "America/New_York" in conversions

    # London is UTC+1 (BST), PKT is UTC+5 -> 4 hours behind
    london_info = conversions["Europe/London"]
    assert london_info["time_24h"] == "16:00"  # 4:00 PM
    assert london_info["time_12h"] == "04:00 PM"

    # Dubai is UTC+4 -> 1 hour behind PKT
    dubai_info = conversions["Asia/Dubai"]
    assert dubai_info["time_24h"] == "19:00"  # 7:00 PM

    # Invitation formatting
    invitation = format_virtual_tour_invitation(
        buyer_name="Dr. Asad",
        property_title="1 Kanal Luxury Designer Villa",
        property_society="DHA Phase 2 Islamabad",
        property_price_formatted="Rs. 8.50 Crore",
        date_str="Sat, 24 Oct 2026",
        client_time_display="04:00 PM (BST)",
        pkt_time_display="08:00 PM (PKT)",
        platform="whatsapp_video",
        agent_name="Hamza Malik",
        agency_name="Apex Properties Islamabad",
        contact_phone="+92 300 5550192",
    )
    assert "Assalam-o-Alaikum Dr. Asad!" in invitation
    assert "04:00 PM (BST)" in invitation
    assert "08:00 PM (PKT)" in invitation
    assert "WhatsApp HD Video Call" in invitation


def test_overseas_share_link_and_public_dossier_flow(client: TestClient, db_session, owner_auth_headers):
    # 1. Get a property from agency
    prop = db_session.query(Property).first()
    assert prop is not None

    # 2. Authenticated user generates an overseas share link
    share_payload = {
        "property_id": prop.id,
        "target_buyer_name": "Dr. Tariq Mahmood",
        "target_buyer_country": "United Kingdom",
        "target_buyer_city": "London",
        "target_buyer_phone": "+44 7911 123456",
        "custom_pitch": "Selected specifically for your retirement home in DHA Islamabad.",
        "default_currency": "GBP",
    }
    resp = client.post(
        f"/api/v1/overseas/properties/{prop.id}/share-link",
        json=share_payload,
        headers=owner_auth_headers,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "token" in data
    assert data["token"].startswith("osp_")
    token = data["token"]
    assert data["target_buyer_name"] == "Dr. Tariq Mahmood"
    assert data["default_currency"] == "GBP"

    # 3. Retrieve public property dossier (NO AUTH HEADERS)
    public_resp = client.get(f"/api/v1/public/share/{token}")
    assert public_resp.status_code == 200, public_resp.text
    dossier = public_resp.json()
    assert dossier["title"] == prop.title
    assert dossier["target_buyer_name"] == "Dr. Tariq Mahmood"
    assert "currencies" in dossier
    assert "GBP" in dossier["currencies"]
    assert "USD" in dossier["currencies"]
    assert "exchange_rates" in dossier
    assert len(dossier["legal_assurances"]) > 0
    assert "direct_whatsapp_url" in dossier

    # 4. Overseas buyer schedules a virtual walkthrough from public link
    tour_payload = {
        "client_name": "Dr. Tariq Mahmood",
        "client_phone": "+44 7911 123456",
        "client_email": "tariq.mahmood@nhs.net",
        "client_timezone": "Europe/London",
        "visit_date": "2026-10-25",
        "visit_time": "15:30",  # 3:30 PM London time
        "is_time_in_client_tz": True,
        "platform": "whatsapp_video",
        "notes": "Looking to inspect master bedroom finishes and solar net metering.",
    }
    book_resp = client.post(f"/api/v1/public/share/{token}/book-tour", json=tour_payload)
    assert book_resp.status_code == 200, book_resp.text
    booking_data = book_resp.json()
    assert booking_data["success"] is True
    assert "site_visit_id" in booking_data
    assert "invitation_text" in booking_data
    assert "PKT" in booking_data["pkt_time"]
