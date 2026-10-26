import pytest
from app.services.tax_service import TaxService
from app.schemas.tax import TaxCalculationRequest


def test_tax_service_filer_calculation_under_50m():
    req = TaxCalculationRequest(
        property_price=35_000_000,  # 3.5 Crore
        society="DHA Phase 6 Lahore",
        property_type="Residential House",
        area_size="1 Kanal",
        buyer_tax_status="filer",
        seller_tax_status="filer",
        is_first_transfer_membership=True,
        province="punjab",
    )
    res = TaxService.calculate(req)

    # 35M <= 50M -> Filer rate is 3%
    assert res.buyer.section_236k_rate == 0.03
    assert res.buyer.section_236k_amount == 1_050_000
    assert res.seller.section_236c_rate == 0.03
    assert res.seller.section_236c_amount == 1_050_000

    # Stamp duty: 1% for Punjab
    assert res.buyer.stamp_duty_amount == 350_000
    # DHA has 0% TMA
    assert res.buyer.tma_tax_amount == 0

    # DHA 1 Kanal transfer fees
    assert res.buyer.society_transfer_fee == 135_000
    assert res.buyer.society_membership_fee == 65_000

    # Non-filer rate would be 12% (Rs. 4,200,000) -> savings = 4.2M - 1.05M = 3.15M
    assert res.buyer.filer_savings_vs_non_filer == 3_150_000

    # WhatsApp templates exist and have expected content
    assert "FBR Tax & Property Transfer Cost Breakdown" in res.whatsapp_breakdown_en
    assert "السلام علیکم" in res.whatsapp_breakdown_ur
    assert "Rs. 1,050,000" in res.whatsapp_breakdown_en


def test_tax_service_non_filer_calculation_over_50m():
    req = TaxCalculationRequest(
        property_price=75_000_000,  # 7.5 Crore
        society="Bahria Town Islamabad",
        property_type="Residential House",
        area_size="2 Kanal",
        buyer_tax_status="non_filer",
        seller_tax_status="non_filer",
        province="punjab",
    )
    res = TaxService.calculate(req)

    # 50M < 75M <= 100M -> Non-filer buyer rate is 16%
    assert res.buyer.section_236k_rate == 0.16
    assert res.buyer.section_236k_amount == 12_000_000

    # Seller non-filer rate > 50M is 15%
    assert res.seller.section_236c_rate == 0.15
    assert res.seller.section_236c_amount == 11_250_000

    # Bahria has TMA 1%
    assert res.buyer.tma_tax_amount == 750_000

    # Total closing cost includes heavy taxes
    assert res.buyer.total_buyer_out_of_pocket > 75_000_000


def test_tax_api_endpoint(client, agent_auth_headers):
    # 1. Test Options endpoint
    opt_resp = client.get("/api/v1/tax/options", headers=agent_auth_headers)
    assert opt_resp.status_code == 200
    opt_data = opt_resp.json()
    assert "societies" in opt_data
    assert "area_sizes" in opt_data
    assert "fbr_tax_slabs_summary" in opt_data

    # 2. Test Calculation endpoint
    calc_payload = {
        "property_price": 50_000_000,
        "society": "DHA Islamabad",
        "property_type": "Residential House",
        "area_size": "1 Kanal",
        "buyer_tax_status": "filer",
        "seller_tax_status": "filer",
        "is_first_transfer_membership": True,
        "is_urgent_transfer": False,
        "province": "punjab",
    }
    calc_resp = client.post("/api/v1/tax/calculate", json=calc_payload, headers=agent_auth_headers)
    assert calc_resp.status_code == 200
    data = calc_resp.json()
    assert data["property_price"] == 50_000_000
    assert data["buyer"]["section_236k_amount"] == 1_500_000  # 3% of 50M
    assert data["seller"]["section_236c_amount"] == 1_500_000
    assert "whatsapp_breakdown_en" in data
    assert "whatsapp_breakdown_ur" in data
