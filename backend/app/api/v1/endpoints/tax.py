from fastapi import APIRouter, Depends, status
from typing import Dict, Any, List
from app.schemas.tax import TaxCalculationRequest, TaxCalculationResponse
from app.services.tax_service import TaxService
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.post(
    "/calculate",
    response_model=TaxCalculationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate FBR Section 236C, 236K, and Pakistani Society Transfer Fees",
)
def calculate_property_tax(
    request: TaxCalculationRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Computes exact Pakistani real estate transaction taxes:
    - Buyer Section 236K Advance Tax (Filer vs Late Filer vs Non-Filer)
    - Seller Section 236C Advance Tax
    - Provincial Stamp Duty & TMA Tax
    - Society Transfer & Membership Fees (DHA, Bahria Town, CDA, etc.)
    - Formats dual-language WhatsApp pitches for instant client dispatch.
    """
    return TaxService.calculate(request)


@router.get(
    "/options",
    summary="Get pre-configured Pakistani societies, area sizes, and tax bands",
)
def get_tax_options(
    current_user: User = Depends(deps.get_current_user),
) -> Dict[str, Any]:
    """Returns preset options for dropdowns, presets, and quick calculators."""
    return {
        "societies": [
            {"id": "dha", "name": "DHA (Defence Housing Authority)", "has_tma": False},
            {"id": "bahria", "name": "Bahria Town", "has_tma": True},
            {"id": "cda", "name": "CDA (Capital Development Authority - Islamabad)", "has_tma": True},
            {"id": "lda", "name": "LDA (Lahore Development Authority)", "has_tma": True},
            {"id": "park_view", "name": "Park View City", "has_tma": True},
            {"id": "eighteen", "name": "Eighteen Islamabad", "has_tma": True},
            {"id": "capital_smart", "name": "Capital Smart City", "has_tma": True},
            {"id": "general_registry", "name": "General Registry / Intiqal (Fard)", "has_tma": True},
        ],
        "area_sizes": [
            "5 Marla",
            "7 Marla",
            "10 Marla",
            "1 Kanal",
            "2 Kanal",
            "4 Marla Commercial",
            "8 Marla Commercial",
        ],
        "property_types": [
            "Residential Plot",
            "Residential House / Villa",
            "Commercial Plot",
            "Commercial Plaza / Shop",
            "Apartment / Penthouse",
            "Farmhouse",
        ],
        "provinces": [
            {"id": "punjab", "name": "Punjab", "stamp_duty_rate": 0.01},
            {"id": "ict", "name": "Islamabad Capital Territory (ICT)", "stamp_duty_rate": 0.01},
            {"id": "sindh", "name": "Sindh", "stamp_duty_rate": 0.02},
            {"id": "kpk", "name": "Khyber Pakhtunkhwa (KPK)", "stamp_duty_rate": 0.02},
        ],
        "fbr_tax_slabs_summary": {
            "section_236k_buyer": {
                "filer": "3% (<=50M), 3.5% (50M-100M), 4% (>100M)",
                "late_filer": "6% (<=50M), 7% (50M-100M), 8% (>100M)",
                "non_filer": "12% (<=50M), 16% (50M-100M), 20% (>100M)",
            },
            "section_236c_seller": {
                "filer": "3% (<=50M), 4% (50M-100M), 5% (>100M)",
                "late_filer": "6% (<=50M), 7% (50M-100M), 8% (>100M)",
                "non_filer": "10% (<=50M), 15% (>50M)",
            },
        },
    }
