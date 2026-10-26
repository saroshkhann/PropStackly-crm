from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    leads,
    properties,
    follow_ups,
    site_visits,
    team,
    analytics,
    settings,
    notifications,
    automations,
    overseas,
    deals,
    tax,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(leads.router, prefix="/leads", tags=["Leads"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
api_router.include_router(deals.router, prefix="/deals", tags=["Pakistani Deal Flow & Commissions"])
api_router.include_router(tax.router, prefix="/tax", tags=["Pakistani Property Tax & Transfer Calculator"])
api_router.include_router(overseas.router, prefix="/overseas", tags=["Overseas Buyer Experience"])
api_router.include_router(overseas.public_router, prefix="/public", tags=["Public Share & Overseas Portal"])
api_router.include_router(follow_ups.router, prefix="/follow-ups", tags=["Follow-ups"])
api_router.include_router(site_visits.router, prefix="/site-visits", tags=["Site Visits"])
api_router.include_router(team.router, prefix="/team", tags=["Team & Performance"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Reports"])
api_router.include_router(settings.router, prefix="/settings", tags=["Agency Settings"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(automations.router, prefix="/automations", tags=["Automations & Webhooks"])
