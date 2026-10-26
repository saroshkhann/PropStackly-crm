from typing import Optional, Literal
from pydantic import BaseModel, Field


class TaxCalculationRequest(BaseModel):
    property_price: float = Field(..., gt=0, description="Property transaction price in PKR")
    fbr_valuation: Optional[float] = Field(None, gt=0, description="Optional FBR table valuation in PKR")
    society: str = Field(default="DHA (Defence Housing Authority)", description="Target society or jurisdiction")
    property_type: str = Field(default="Residential House", description="Property category")
    area_size: str = Field(default="1 Kanal", description="Area size (e.g., 5 Marla, 10 Marla, 1 Kanal)")
    buyer_tax_status: Literal["filer", "late_filer", "non_filer"] = Field(
        default="filer", description="FBR Active Taxpayer status of Buyer"
    )
    seller_tax_status: Literal["filer", "late_filer", "non_filer"] = Field(
        default="filer", description="FBR Active Taxpayer status of Seller"
    )
    is_first_transfer_membership: bool = Field(
        default=True, description="Whether buyer pays 1-time society membership fee"
    )
    is_urgent_transfer: bool = Field(
        default=False, description="Whether urgent transfer processing fee applies"
    )
    province: Literal["punjab", "ict", "sindh", "kpk"] = Field(
        default="punjab", description="Province or Federal Capital Territory"
    )


class BuyerExpenseBreakdown(BaseModel):
    section_236k_rate: float
    section_236k_amount: float
    stamp_duty_rate: float
    stamp_duty_amount: float
    tma_tax_rate: float
    tma_tax_amount: float
    society_transfer_fee: float
    society_membership_fee: float
    urgent_transfer_fee: float
    total_buyer_closing_cost: float
    total_buyer_out_of_pocket: float
    filer_savings_vs_non_filer: float


class SellerDeductionBreakdown(BaseModel):
    section_236c_rate: float
    section_236c_amount: float
    society_ndc_fee: float
    total_seller_deductions: float
    net_seller_proceeds: float
    filer_savings_vs_non_filer: float


class CombinedClosingSummary(BaseModel):
    total_government_taxes: float
    total_society_fees: float
    grand_total_closing_cost: float


class TaxCalculationResponse(BaseModel):
    property_price: float
    taxable_base: float
    society: str
    property_type: str
    area_size: str
    buyer_tax_status: str
    seller_tax_status: str
    buyer: BuyerExpenseBreakdown
    seller: SellerDeductionBreakdown
    combined: CombinedClosingSummary
    whatsapp_breakdown_en: str
    whatsapp_breakdown_ur: str
