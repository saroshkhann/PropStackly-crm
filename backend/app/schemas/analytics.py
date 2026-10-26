from typing import List, Dict, Any, Optional
from decimal import Decimal
from pydantic import BaseModel


class MetricCard(BaseModel):
    title: str
    value: str
    change: Optional[str] = None
    trend: Optional[str] = "up"  # up, down, neutral


class SourceCount(BaseModel):
    source: str
    count: int
    percentage: float


class StatusCount(BaseModel):
    status: str
    count: int


class MonthlyTrend(BaseModel):
    month: str
    leads: int
    deals: int
    revenue_pkr: Decimal


class DashboardMetrics(BaseModel):
    total_leads: int
    new_leads_this_month: int
    followups_due_today: int
    site_visits_this_week: int
    pipeline_value_pkr: Decimal
    closed_revenue_pkr: Decimal
    conversion_rate: float
    sources: List[SourceCount]
    statuses: List[StatusCount]
    monthly_trends: List[MonthlyTrend]


class ChannelROI(BaseModel):
    channel: str
    leads: int
    deals: int
    spend_pkr: Decimal
    revenue_pkr: Decimal
    cpl_pkr: Decimal
    roi_percentage: float


class FunnelStage(BaseModel):
    stage: str
    count: int
    conversion_rate: float


class ReportsOverview(BaseModel):
    funnel: List[FunnelStage]
    channel_roi: List[ChannelROI]
    top_societies: List[Dict[str, Any]]
