from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Dict, Any, List

OVERSEAS_TIMEZONES = [
    {
        "id": "Europe/London",
        "code": "BST / GMT",
        "city": "London",
        "country": "United Kingdom",
        "flag": "🇬🇧",
        "utc_offset": "+01:00",
    },
    {
        "id": "Asia/Dubai",
        "code": "GST",
        "city": "Dubai / Abu Dhabi",
        "country": "United Arab Emirates",
        "flag": "🇦🇪",
        "utc_offset": "+04:00",
    },
    {
        "id": "Asia/Riyadh",
        "code": "AST",
        "city": "Riyadh / Jeddah",
        "country": "Saudi Arabia",
        "flag": "🇸🇦",
        "utc_offset": "+03:00",
    },
    {
        "id": "America/New_York",
        "code": "EDT / EST",
        "city": "New York / Toronto",
        "country": "USA / Canada",
        "flag": "🇺🇸",
        "utc_offset": "-04:00",
    },
    {
        "id": "America/Chicago",
        "code": "CDT / CST",
        "city": "Chicago / Dallas / Houston",
        "country": "USA",
        "flag": "🇺🇸",
        "utc_offset": "-05:00",
    },
    {
        "id": "America/Los_Angeles",
        "code": "PDT / PST",
        "city": "Los Angeles / San Francisco",
        "country": "USA",
        "flag": "🇺🇸",
        "utc_offset": "-07:00",
    },
    {
        "id": "Australia/Sydney",
        "code": "AEST",
        "city": "Sydney / Melbourne",
        "country": "Australia",
        "flag": "🇦🇺",
        "utc_offset": "+10:00",
    },
    {
        "id": "Asia/Karachi",
        "code": "PKT",
        "city": "Islamabad / Lahore / Karachi",
        "country": "Pakistan",
        "flag": "🇵🇰",
        "utc_offset": "+05:00",
    },
]


def get_supported_timezones() -> List[Dict[str, Any]]:
    return OVERSEAS_TIMEZONES


def convert_appointment_time(
    scheduled_date: str,  # YYYY-MM-DD
    scheduled_time: str,  # HH:MM (24h)
    source_tz: str = "Asia/Karachi",
) -> Dict[str, Any]:
    """
    Given a date and time in source_tz (default Asia/Karachi PKT),
    calculates the corresponding date/time in all major overseas client hubs.
    """
    try:
        hour, minute = map(int, scheduled_time.split(":"))
        year, month, day = map(int, scheduled_date.split("-"))
        src_zone = ZoneInfo(source_tz)
        local_dt = datetime(year, month, day, hour, minute, tzinfo=src_zone)
    except Exception:
        # Fallback to now if parse fails
        local_dt = datetime.now(ZoneInfo("Asia/Karachi"))

    converted_times = {}
    for tz_meta in OVERSEAS_TIMEZONES:
        tz_id = tz_meta["id"]
        target_zone = ZoneInfo(tz_id)
        target_dt = local_dt.astimezone(target_zone)

        time_12h = target_dt.strftime("%I:%M %p")
        date_str = target_dt.strftime("%a, %d %b %Y")
        code = target_dt.strftime("%Z") or tz_meta["code"]

        converted_times[tz_id] = {
            "tz_id": tz_id,
            "tz_code": code,
            "city": tz_meta["city"],
            "country": tz_meta["country"],
            "flag": tz_meta["flag"],
            "date": target_dt.strftime("%Y-%m-%d"),
            "date_formatted": date_str,
            "time_24h": target_dt.strftime("%H:%M"),
            "time_12h": time_12h,
            "iso": target_dt.isoformat(),
            "display": f"{time_12h} ({code})",
        }

    pkt_info = converted_times.get("Asia/Karachi", {})
    return {
        "scheduled_iso": local_dt.isoformat(),
        "source_tz": source_tz,
        "pkt_date": pkt_info.get("date_formatted", scheduled_date),
        "pkt_time": pkt_info.get("time_12h", scheduled_time),
        "conversions": converted_times,
    }


def format_virtual_tour_invitation(
    buyer_name: str,
    property_title: str,
    property_society: str,
    property_price_formatted: str,
    date_str: str,
    client_time_display: str,
    pkt_time_display: str,
    platform: str,
    agent_name: str,
    agency_name: str,
    contact_phone: str,
    walkthrough_link: str = "",
) -> str:
    """Formats a professional, polite WhatsApp virtual walkthrough invitation."""
    platform_name = (
        "WhatsApp HD Video Call"
        if platform == "whatsapp_video"
        else "Google Meet / Zoom"
        if platform in ["zoom", "google_meet"]
        else "Virtual Video Walkthrough"
    )

    invitation = (
        f"Assalam-o-Alaikum {buyer_name}!\n\n"
        f"Your private virtual walkthrough for *{property_title}* has been confirmed:\n\n"
        f"🏠 *Property*: {property_title}\n"
        f"📍 *Location*: {property_society}\n"
        f"💰 *Demand*: {property_price_formatted}\n\n"
        f"📅 *Date*: {date_str}\n"
        f"⏰ *Your Local Time*: {client_time_display}\n"
        f"🇵🇰 *Pakistan Time*: {pkt_time_display} (PKT)\n"
        f"📱 *Platform*: {platform_name} ({contact_phone})\n\n"
        f"During this session, we will show you live interior finishes, structural specifications, "
        f"neighborhood amenities, and review approved society NOC / transfer papers.\n\n"
    )

    if walkthrough_link:
        invitation += f"🔗 *Digital Dossier & Walkthrough Link*: {walkthrough_link}\n\n"

    invitation += (
        f"Best regards,\n"
        f"*{agent_name}*\n"
        f"{agency_name}"
    )

    return invitation
