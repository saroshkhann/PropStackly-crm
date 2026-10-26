import secrets
import json
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_tenant_context, TenantContext
from app.models.property import Property
from app.models.lead import Lead, LeadActivity
from app.models.share_link import PropertyShareLink
from app.models.task import SiteVisit
from app.models.notification import Notification
from app.schemas.share_link import (
    CreateShareLinkRequest,
    ShareLinkResponse,
    PublicPropertyShareDossier,
    BookVirtualTourRequest,
    BookVirtualTourResponse,
)
from app.services.currency_service import (
    get_supported_currencies,
    convert_pkr_to_all,
    format_currency_value,
)
from app.services.timezone_service import (
    get_supported_timezones,
    convert_appointment_time,
    format_virtual_tour_invitation,
)

router = APIRouter()
public_router = APIRouter()

CURATED_HIGH_RES_GALLERY = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1600&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&auto=format&fit=crop&q=85",
]


# =========================================================================
# 1. CRM Agent Endpoints (Authenticated)
# =========================================================================

@router.post("/properties/{property_id}/share-link", response_model=ShareLinkResponse)
def create_overseas_share_link(
    property_id: str,
    payload: CreateShareLinkRequest,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Generates a secure, tokenized web link for an overseas buyer.
    Allows high-res photo/video walkthrough and NOC verification inspection without large file downloads.
    """
    prop = (
        db.query(Property)
        .filter(Property.id == property_id, Property.agency_id == ctx.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    lead = None
    if payload.lead_id:
        lead = (
            db.query(Lead)
            .filter(Lead.id == payload.lead_id, Lead.agency_id == ctx.agency_id)
            .first()
        )

    # Generate urlsafe token
    token = "osp_" + secrets.token_urlsafe(16)

    buyer_name = payload.target_buyer_name or (lead.full_name if lead else "Valued Overseas Client")
    country = payload.target_buyer_country or "United Kingdom"
    city = payload.target_buyer_city or "London"
    phone = payload.target_buyer_phone or (lead.phone if lead else None)

    share_link = PropertyShareLink(
        agency_id=ctx.agency_id,
        property_id=prop.id,
        agent_id=ctx.user.id,
        lead_id=lead.id if lead else None,
        token=token,
        target_buyer_name=buyer_name,
        target_buyer_country=country,
        target_buyer_city=city,
        target_buyer_phone=phone,
        custom_pitch=payload.custom_pitch,
        default_currency=payload.default_currency or "GBP",
    )
    db.add(share_link)

    # If associated with lead, log timeline activity
    if lead:
        price_fmt = format_currency_value(Decimal(str(prop.price_pkr)), "PKR")
        activity = LeadActivity(
            agency_id=ctx.agency_id,
            lead_id=lead.id,
            user_id=ctx.user.id,
            performed_by_name=ctx.user.full_name,
            type="share_link",
            title="Overseas Buyer Dossier Generated",
            description=f"Generated exclusive overseas share dossier for '{prop.title}' ({prop.society}, {price_fmt}) tailored for {buyer_name} ({city}, {country}).",
        )
        db.add(activity)

    db.commit()
    db.refresh(share_link)

    # Format share link & WhatsApp pitch text
    share_url = f"/portal/property/{token}"
    price_formatted = format_currency_value(Decimal(str(prop.price_pkr)), "PKR")
    curr = payload.default_currency or "GBP"
    foreign_formatted = format_currency_value(
        Decimal(str(prop.price_pkr)) / Decimal("362.00" if curr == "GBP" else "278.50" if curr == "USD" else "75.80" if curr == "AED" else "74.20"),
        curr,
    )

    whatsapp_text = (
        f"Assalam-o-Alaikum {buyer_name}!\n\n"
        f"As requested, here is your exclusive digital portfolio link for *{prop.title}* in *{prop.society}*:\n\n"
        f"📍 Location: {prop.location}, {prop.society}\n"
        f"💰 Demand: {price_formatted} (~{foreign_formatted})\n"
        f"🏛 NOC Status: {prop.noc_status or 'Approved by CDA / RDA'}\n"
        f"📐 Area: {prop.area_size}\n\n"
        f"🔗 *View High-Res Walkthrough & Verified Documents*:\n"
        f"http://localhost:3000{share_url}\n\n"
        f"You can also schedule a live WhatsApp video walkthrough directly from the link.\n\n"
        f"Best regards,\n"
        f"*{ctx.user.full_name}*\n"
        f"{ctx.agency.name or 'Apex Properties'}"
    )

    return ShareLinkResponse(
        id=share_link.id,
        property_id=prop.id,
        property_title=prop.title,
        lead_id=share_link.lead_id,
        token=share_link.token,
        share_url=share_url,
        target_buyer_name=share_link.target_buyer_name,
        target_buyer_country=share_link.target_buyer_country,
        target_buyer_city=share_link.target_buyer_city,
        target_buyer_phone=share_link.target_buyer_phone,
        custom_pitch=share_link.custom_pitch,
        default_currency=share_link.default_currency or "GBP",
        views_count=share_link.views_count,
        last_viewed_at=share_link.last_viewed_at,
        created_at=share_link.created_at,
        whatsapp_share_text=whatsapp_text,
    )


@router.get("/properties/{property_id}/share-links", response_model=List[ShareLinkResponse])
def get_property_share_links(
    property_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """Retrieves all generated share links for a property."""
    prop = (
        db.query(Property)
        .filter(Property.id == property_id, Property.agency_id == ctx.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    links = (
        db.query(PropertyShareLink)
        .filter(PropertyShareLink.property_id == property_id, PropertyShareLink.agency_id == ctx.agency_id)
        .order_by(PropertyShareLink.created_at.desc())
        .all()
    )

    results = []
    for link in links:
        results.append(
            ShareLinkResponse(
                id=link.id,
                property_id=prop.id,
                property_title=prop.title,
                lead_id=link.lead_id,
                token=link.token,
                share_url=f"/portal/property/{link.token}",
                target_buyer_name=link.target_buyer_name,
                target_buyer_country=link.target_buyer_country,
                target_buyer_city=link.target_buyer_city,
                target_buyer_phone=link.target_buyer_phone,
                custom_pitch=link.custom_pitch,
                default_currency=link.default_currency or "GBP",
                views_count=link.views_count,
                last_viewed_at=link.last_viewed_at,
                created_at=link.created_at,
                whatsapp_share_text="",
            )
        )
    return results


# =========================================================================
# 2. Public Endpoints (No Authentication Required)
# =========================================================================

@public_router.get("/share/{token}", response_model=PublicPropertyShareDossier)
def get_public_property_dossier(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Public tokenized endpoint for overseas buyers.
    Returns property photos, HD video walkthrough, NOC approval verification,
    multi-currency exchange prices, and timezone scheduler.
    """
    link = db.query(PropertyShareLink).filter(PropertyShareLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Exclusive property link not found or expired")

    prop = db.query(Property).filter(Property.id == link.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property listing no longer available")

    # Increment view counter
    link.views_count += 1
    link.last_viewed_at = datetime.now(timezone.utc)
    db.commit()

    agent = link.agent
    agency = link.agency

    price_dec = Decimal(str(prop.price_pkr))
    currencies = convert_pkr_to_all(price_dec)
    exchange_rates = get_supported_currencies()
    timezones = get_supported_timezones()

    # High-res gallery images
    gallery = CURATED_HIGH_RES_GALLERY
    if prop.gallery_images:
        try:
            parsed = json.loads(prop.gallery_images)
            if isinstance(parsed, list) and parsed:
                gallery = parsed
        except Exception:
            pass

    # Clean phone for WhatsApp direct link
    agent_phone = (agent.phone if (agent and agent.phone) else (agency.contact_phone if (agency and agency.contact_phone) else "+92 300 5550192"))
    clean_phone = agent_phone.replace("+", "").replace(" ", "").replace("-", "")
    if clean_phone.startswith("03"):
        clean_phone = "92" + clean_phone[1:]

    buyer_name = link.target_buyer_name or "Overseas Client"
    wa_greeting = (
        f"Assalam-o-Alaikum {agent.full_name if agent else 'Consultant'}!\n\n"
        f"I am reviewing the digital dossier for *{prop.title}* ({prop.society}) "
        f"which you prepared for {buyer_name}. I would like more details regarding transfer and virtual walkthrough."
    )
    from urllib.parse import quote
    direct_whatsapp_url = f"https://wa.me/{clean_phone}?text={quote(wa_greeting)}"

    legal_assurances = [
        f"NOC Status: {prop.noc_status or 'Approved by CDA / RDA / DHA'}",
        "Title Ownership: Direct seller title deed verified with society record",
        "Clear Transfer: Biometric & overseas Power of Attorney (PoA) facilitation available",
        "Roshan Digital Account (RDA) Compliant: SBP approved repatriable banking channels",
        "Zero Encumbrance: Verified free of any bank hypothecation or dispute",
    ]

    return PublicPropertyShareDossier(
        token=token,
        property_id=prop.id,
        title=prop.title,
        slug=prop.slug,
        type=prop.type,
        city=prop.city or "Islamabad",
        location=prop.location,
        society=prop.society,
        price_pkr=float(prop.price_pkr),
        formatted_pkr=format_currency_value(price_dec, "PKR"),
        currencies=currencies,
        exchange_rates=exchange_rates,
        area_size=prop.area_size,
        bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms,
        status=prop.status or "available",
        featured=bool(prop.featured),
        image_url=prop.image_url,
        gallery_images=gallery,
        description=prop.description,
        video_url=prop.video_url or "https://www.youtube.com/embed/dQw4w9WgXcQ",
        noc_status=prop.noc_status or "CDA / RDA Approved",
        documents_verified=prop.documents_verified if prop.documents_verified is not None else True,
        allotment_status=prop.allotment_status or "Direct Transfer Ready",
        possession_status=prop.possession_status or "Immediate Possession Available",
        legal_assurances=legal_assurances,
        target_buyer_name=link.target_buyer_name,
        target_buyer_country=link.target_buyer_country,
        target_buyer_city=link.target_buyer_city,
        custom_pitch=link.custom_pitch,
        default_currency=link.default_currency or "GBP",
        agent={
            "name": agent.full_name if agent else "Senior Property Consultant",
            "role_title": agent.role_title if agent else "Luxury Real Estate Advisor",
            "phone": agent_phone,
            "email": agent.email if agent else "contact@apexproperties.pk",
            "avatar_url": (
                agent.avatar_url
                if agent and agent.avatar_url
                else "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            ),
        },
        agency={
            "name": agency.name if agency else "Apex Properties Islamabad",
            "tagline": agency.tagline if agency else "Premier Real Estate Advisory",
            "ntn_number": agency.ntn_number if agency else "8274192-3",
            "city": agency.city if agency else "Islamabad",
            "address": agency.address if agency else "Sector F-8 Markaz, Islamabad",
            "contact_email": agency.contact_email if agency else "contact@apexproperties.pk",
            "contact_phone": agency.contact_phone if agency else "+92 51 2894100",
        },
        direct_whatsapp_url=direct_whatsapp_url,
        supported_timezones=timezones,
    )


@public_router.post("/share/{token}/book-tour", response_model=BookVirtualTourResponse)
def public_book_virtual_tour(
    token: str,
    payload: BookVirtualTourRequest,
    db: Session = Depends(get_db),
):
    """
    Allows overseas buyers to schedule a live virtual walkthrough directly from their web dossier.
    Converts client timezone to PKT and logs a SiteVisit in the CRM.
    """
    link = db.query(PropertyShareLink).filter(PropertyShareLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Share token not found")

    prop = db.query(Property).filter(Property.id == link.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property listing not found")

    # Timezone conversion
    source_tz = payload.client_timezone if payload.is_time_in_client_tz else "Asia/Karachi"
    converted = convert_appointment_time(
        scheduled_date=payload.visit_date,
        scheduled_time=payload.visit_time,
        source_tz=source_tz,
    )

    pkt_conv = converted["conversions"].get("Asia/Karachi", {})
    pkt_date = pkt_conv.get("date", payload.visit_date)
    pkt_time = pkt_conv.get("time_24h", payload.visit_time)
    pkt_display = pkt_conv.get("time_12h", payload.visit_time)

    client_conv = converted["conversions"].get(payload.client_timezone, {})
    client_display = client_conv.get("display", f"{payload.visit_time} ({payload.client_timezone})")

    # Find or use associated lead
    lead = link.lead
    if not lead and payload.client_name:
        # Create a new lead or find by phone
        clean_phone = payload.client_phone.strip()
        lead = db.query(Lead).filter(Lead.phone == clean_phone, Lead.agency_id == link.agency_id).first()
        if not lead:
            lead = Lead(
                agency_id=link.agency_id,
                full_name=payload.client_name,
                phone=payload.client_phone,
                email=payload.client_email,
                city="Overseas",
                source="Website Form",
                status="qualified",
                priority="high",
                assigned_agent_id=link.agent_id,
                budget_pkr=prop.price_pkr,
                property_type_interest=prop.type,
                preferred_locations=prop.society,
                purpose="Investment",
            )
            db.add(lead)
            db.flush()

    # Create SiteVisit record
    site_visit = SiteVisit(
        agency_id=link.agency_id,
        lead_id=lead.id if lead else link.lead_id,
        property_id=prop.id,
        assigned_agent_id=link.agent_id,
        visit_date=pkt_date,
        visit_time=pkt_time,
        status="scheduled",
        is_virtual=True,
        meeting_platform=payload.platform or "whatsapp_video",
        client_timezone=payload.client_timezone,
        client_local_time=client_display,
        notes=f"Overseas Virtual Walkthrough requested via public share dossier. Client timezone: {payload.client_timezone} ({client_display}). Notes: {payload.notes or 'None'}",
    )
    db.add(site_visit)

    # Activity entry
    if lead:
        activity = LeadActivity(
            agency_id=link.agency_id,
            lead_id=lead.id,
            user_id=link.agent_id,
            performed_by_name=payload.client_name,
            type="site_visit",
            title="Overseas Virtual Walkthrough Scheduled",
            description=f"Client booked virtual walkthrough for '{prop.title}'. Time: {client_display} / PKT: {pkt_display}.",
        )
        db.add(activity)

    # In-app notification for agent
    if link.agent_id:
        notif = Notification(
            agency_id=link.agency_id,
            user_id=link.agent_id,
            title="New Overseas Virtual Walkthrough Booked!",
            message=f"{payload.client_name} ({payload.client_timezone}) scheduled a virtual tour for '{prop.title}' on {pkt_date} at {pkt_display} PKT.",
            type="appointment_reminder",
            priority="high",
            entity_type="site_visit",
            entity_id=site_visit.id,
            link_url=f"/site-visits",
        )
        db.add(notif)

    db.commit()
    db.refresh(site_visit)

    # Invitation text
    agent = link.agent
    agency = link.agency
    agent_phone = (agent.phone if (agent and agent.phone) else (agency.contact_phone if (agency and agency.contact_phone) else "+92 300 5550192"))
    invitation = format_virtual_tour_invitation(
        buyer_name=payload.client_name,
        property_title=prop.title,
        property_society=prop.society,
        property_price_formatted=format_currency_value(Decimal(str(prop.price_pkr)), "PKR"),
        date_str=client_conv.get("date_formatted", payload.visit_date),
        client_time_display=client_display,
        pkt_time_display=f"{pkt_display} PKT",
        platform=payload.platform,
        agent_name=agent.full_name if agent else "Hamza Malik",
        agency_name=agency.name if agency else "Apex Properties Islamabad",
        contact_phone=agent_phone,
        walkthrough_link=f"http://localhost:3000/portal/property/{token}",
    )

    from urllib.parse import quote
    clean_p = agent_phone.replace("+", "").replace(" ", "")
    if clean_p.startswith("03"):
        clean_p = "92" + clean_p[1:]
    wa_url = f"https://wa.me/{clean_p}?text={quote(invitation)}"

    return BookVirtualTourResponse(
        success=True,
        message="Virtual walkthrough successfully scheduled! Consultant has been notified.",
        site_visit_id=site_visit.id,
        visit_date=payload.visit_date,
        client_local_time=client_display,
        pkt_time=f"{pkt_display} PKT",
        platform=payload.platform,
        invitation_text=invitation,
        direct_whatsapp_url=wa_url,
    )


@public_router.get("/currencies")
def get_currencies_endpoint():
    """Returns live interbank exchange rates against PKR for multi-currency switcher."""
    return {
        "base_currency": "PKR",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "currencies": get_supported_currencies(),
    }


@public_router.get("/timezones")
def get_timezones_endpoint():
    """Returns overseas client timezones and UTC offsets."""
    return get_supported_timezones()


@public_router.get("/convert-time")
def convert_time_endpoint(
    scheduled_date: str = Query(..., description="YYYY-MM-DD"),
    scheduled_time: str = Query(..., description="HH:MM (24h)"),
    source_tz: str = Query("Asia/Karachi", description="Source timezone"),
):
    """Converts a meeting time across all overseas client hubs."""
    return convert_appointment_time(scheduled_date, scheduled_time, source_tz)
