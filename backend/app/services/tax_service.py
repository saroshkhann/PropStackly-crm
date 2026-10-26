import math
from typing import Dict, Any, Tuple
from app.schemas.tax import (
    TaxCalculationRequest,
    TaxCalculationResponse,
    BuyerExpenseBreakdown,
    SellerDeductionBreakdown,
    CombinedClosingSummary,
)


class TaxService:
    @staticmethod
    def get_section_236k_rate(tax_status: str, price: float) -> float:
        """
        FBR Section 236K (Advance tax on purchase of property - Buyer).
        Tiered slabs under Finance Act 2024-2025:
        - Filer: 3% (<=50M), 3.5% (50M-100M), 4% (>100M)
        - Late Filer: 6% (<=50M), 7% (50M-100M), 8% (>100M)
        - Non-Filer: 12% (<=50M), 16% (50M-100M), 20% (>100M)
        """
        if tax_status == "filer":
            if price <= 50_000_000:
                return 0.03
            elif price <= 100_000_000:
                return 0.035
            else:
                return 0.04
        elif tax_status == "late_filer":
            if price <= 50_000_000:
                return 0.06
            elif price <= 100_000_000:
                return 0.07
            else:
                return 0.08
        else:  # non_filer
            if price <= 50_000_000:
                return 0.12
            elif price <= 100_000_000:
                return 0.16
            else:
                return 0.20

    @staticmethod
    def get_section_236c_rate(tax_status: str, price: float) -> float:
        """
        FBR Section 236C (Advance tax on sale/transfer of property - Seller).
        Tiered slabs:
        - Filer: 3% (<=50M), 4% (50M-100M), 5% (>100M)
        - Late Filer: 6% (<=50M), 7% (50M-100M), 8% (>100M)
        - Non-Filer: 10% (<=50M), 15% (>50M)
        """
        if tax_status == "filer":
            if price <= 50_000_000:
                return 0.03
            elif price <= 100_000_000:
                return 0.04
            else:
                return 0.05
        elif tax_status == "late_filer":
            if price <= 50_000_000:
                return 0.06
            elif price <= 100_000_000:
                return 0.07
            else:
                return 0.08
        else:  # non_filer
            if price <= 50_000_000:
                return 0.10
            else:
                return 0.15

    @staticmethod
    def get_society_fee_structure(
        society: str, area_size: str, is_commercial: bool
    ) -> Dict[str, float]:
        """
        Standard transfer, membership, and NDC fees for major Pakistani societies.
        """
        soc_norm = society.lower()
        size_norm = area_size.lower()

        # Defaults for 1 Kanal
        transfer_fee = 100_000.0
        membership_fee = 50_000.0
        ndc_fee = 20_000.0
        urgent_fee = 35_000.0

        if "dha" in soc_norm:
            membership_fee = 65_000.0
            ndc_fee = 25_000.0
            urgent_fee = 45_000.0
            if is_commercial or "commercial" in size_norm:
                transfer_fee = 350_000.0
                membership_fee = 100_000.0
            elif "2 kanal" in size_norm:
                transfer_fee = 240_000.0
            elif "1 kanal" in size_norm:
                transfer_fee = 135_000.0
            elif "10 marla" in size_norm:
                transfer_fee = 75_000.0
            else:  # 5 Marla / small
                transfer_fee = 45_000.0
        elif "bahria" in soc_norm:
            membership_fee = 35_000.0
            ndc_fee = 15_000.0
            urgent_fee = 35_000.0
            if is_commercial or "commercial" in size_norm:
                transfer_fee = 280_000.0
            elif "2 kanal" in size_norm:
                transfer_fee = 190_000.0
            elif "1 kanal" in size_norm:
                transfer_fee = 110_000.0
            elif "10 marla" in size_norm:
                transfer_fee = 60_000.0
            else:
                transfer_fee = 35_000.0
        elif "cda" in soc_norm or "lda" in soc_norm or "rda" in soc_norm:
            membership_fee = 0.0
            ndc_fee = 20_000.0
            urgent_fee = 30_000.0
            if is_commercial:
                transfer_fee = 250_000.0
            elif "2 kanal" in size_norm:
                transfer_fee = 180_000.0
            elif "1 kanal" in size_norm:
                transfer_fee = 100_000.0
            elif "10 marla" in size_norm:
                transfer_fee = 60_000.0
            else:
                transfer_fee = 40_000.0
        else:  # Private society / Other
            membership_fee = 25_000.0
            ndc_fee = 15_000.0
            urgent_fee = 25_000.0
            if is_commercial:
                transfer_fee = 180_000.0
            elif "2 kanal" in size_norm:
                transfer_fee = 150_000.0
            elif "1 kanal" in size_norm:
                transfer_fee = 90_000.0
            elif "10 marla" in size_norm:
                transfer_fee = 50_000.0
            else:
                transfer_fee = 30_000.0

        return {
            "transfer_fee": transfer_fee,
            "membership_fee": membership_fee,
            "ndc_fee": ndc_fee,
            "urgent_fee": urgent_fee,
        }

    @classmethod
    def format_pkr(cls, amount: float) -> str:
        """Helper to format PKR in Crores or Lakhs with comma separators."""
        if amount >= 10_000_000:
            crore_val = amount / 10_000_000
            return f"PKR {crore_val:.2f} Crore (Rs. {amount:,.0f})"
        elif amount >= 100_000:
            lakh_val = amount / 100_000
            return f"PKR {lakh_val:.2f} Lakh (Rs. {amount:,.0f})"
        else:
            return f"Rs. {amount:,.0f}"

    @classmethod
    def calculate(cls, req: TaxCalculationRequest) -> TaxCalculationResponse:
        price = req.property_price
        # If FBR valuation is provided and higher, FBR taxes apply on max(price, fbr_valuation)
        taxable_base = max(price, req.fbr_valuation or 0.0)

        is_commercial = "commercial" in req.property_type.lower() or "plaza" in req.property_type.lower()

        # 1. Section 236K (Buyer)
        buyer_rate = cls.get_section_236k_rate(req.buyer_tax_status, taxable_base)
        buyer_236k_tax = round(taxable_base * buyer_rate)

        # Baseline Non-Filer 236K to calculate savings
        non_filer_buyer_rate = cls.get_section_236k_rate("non_filer", taxable_base)
        buyer_non_filer_tax = round(taxable_base * non_filer_buyer_rate)
        buyer_savings = max(0.0, buyer_non_filer_tax - buyer_236k_tax)

        # 2. Stamp Duty (1% for Punjab & ICT, 2% for Sindh & KPK)
        stamp_rate = 0.02 if req.province in ["sindh", "kpk"] else 0.01
        stamp_duty = round(taxable_base * stamp_rate)

        # 3. TMA / Local Council Tax (1% in municipal areas, 0% in DHA Cantonment)
        is_dha = "dha" in req.society.lower()
        tma_rate = 0.0 if is_dha else 0.01
        tma_tax = round(taxable_base * tma_rate)

        # 4. Society Fees
        soc_fees = cls.get_society_fee_structure(req.society, req.area_size, is_commercial)
        society_transfer_fee = soc_fees["transfer_fee"]
        society_membership_fee = (
            soc_fees["membership_fee"] if req.is_first_transfer_membership else 0.0
        )
        urgent_transfer_fee = soc_fees["urgent_fee"] if req.is_urgent_transfer else 0.0
        society_ndc_fee = soc_fees["ndc_fee"]

        # Buyer totals
        total_buyer_closing_cost = (
            buyer_236k_tax
            + stamp_duty
            + tma_tax
            + society_transfer_fee
            + society_membership_fee
            + urgent_transfer_fee
        )
        total_buyer_out_of_pocket = price + total_buyer_closing_cost

        # 5. Section 236C (Seller)
        seller_rate = cls.get_section_236c_rate(req.seller_tax_status, taxable_base)
        seller_236c_tax = round(taxable_base * seller_rate)

        non_filer_seller_rate = cls.get_section_236c_rate("non_filer", taxable_base)
        seller_non_filer_tax = round(taxable_base * non_filer_seller_rate)
        seller_savings = max(0.0, seller_non_filer_tax - seller_236c_tax)

        total_seller_deductions = seller_236c_tax + society_ndc_fee
        net_seller_proceeds = price - total_seller_deductions

        # Combined government & society totals
        total_gov = buyer_236k_tax + seller_236c_tax + stamp_duty + tma_tax
        total_society = (
            society_transfer_fee
            + society_membership_fee
            + urgent_transfer_fee
            + society_ndc_fee
        )
        grand_total_closing = total_buyer_closing_cost + total_seller_deductions

        # Generate Dual-Language WhatsApp Summaries
        buyer_label = req.buyer_tax_status.replace("_", " ").title()
        seller_label = req.seller_tax_status.replace("_", " ").title()

        whatsapp_en = (
            f"🏛 *FBR Tax & Property Transfer Cost Breakdown*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📍 *Property:* {req.area_size} {req.property_type} in {req.society}\n"
            f"💰 *Deal Value:* Rs. {price:,.0f}\n\n"
            f"👤 *BUYER EXPENSES ({buyer_label}):*\n"
            f"• FBR Sec 236K Advance Tax ({buyer_rate*100:.1f}%): Rs. {buyer_236k_tax:,.0f}\n"
            f"• Stamp Duty ({stamp_rate*100:.1f}%): Rs. {stamp_duty:,.0f}\n"
            + (f"• TMA / Municipal Tax ({tma_rate*100:.1f}%): Rs. {tma_tax:,.0f}\n" if tma_tax > 0 else "")
            + f"• Society Transfer Fee: Rs. {society_transfer_fee:,.0f}\n"
            + (f"• Membership Fee (1-time): Rs. {society_membership_fee:,.0f}\n" if society_membership_fee > 0 else "")
            + (f"• Urgent Processing Fee: Rs. {urgent_transfer_fee:,.0f}\n" if urgent_transfer_fee > 0 else "")
            + f"👉 *Total Buyer Extra Cost:* Rs. {total_buyer_closing_cost:,.0f}\n"
            f"🏷 *Total Out-of-Pocket:* Rs. {total_buyer_out_of_pocket:,.0f}\n\n"
            + (f"✨ *Filer Advantage:* You save Rs. {buyer_savings:,.0f} vs Non-Filer rate!\n\n" if buyer_savings > 0 else "")
            + f"👤 *SELLER DEDUCTIONS ({seller_label}):*\n"
            f"• FBR Sec 236C Advance Tax ({seller_rate*100:.1f}%): Rs. {seller_236c_tax:,.0f}\n"
            f"• Society NDC Clearance: Rs. {society_ndc_fee:,.0f}\n"
            f"👉 *Net Cash Received:* Rs. {net_seller_proceeds:,.0f}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Calculated in accordance with FBR Finance Act 2024-2025."
        )

        whatsapp_ur = (
            f"السلام علیکم!\n"
            f"🏛 *پراپرٹی ٹیکس اور ٹرانسفر خرچہ تفصیل (FBR Tax Breakdown)*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📍 *پراپرٹی:* {req.area_size} {req.property_type} ({req.society})\n"
            f"💰 *سودا قیمت (Deal Price):* Rs. {price:,.0f}\n\n"
            f"🟢 *خریدار (Buyer) کے کل اخراجات ({buyer_label}):*\n"
            f"1. FBR سیکشن 236K ٹیکس ({buyer_rate*100:.1f}%): Rs. {buyer_236k_tax:,.0f}\n"
            f"2. اسٹامپ ڈیوٹی (Stamp Duty): Rs. {stamp_duty:,.0f}\n"
            + (f"3. ٹی ایم اے ٹیکس (TMA Tax): Rs. {tma_tax:,.0f}\n" if tma_tax > 0 else "")
            + f"4. سوسائٹی ٹرانسفر فیس: Rs. {society_transfer_fee:,.0f}\n"
            + (f"5. ممبرشپ فیس: Rs. {society_membership_fee:,.0f}\n" if society_membership_fee > 0 else "")
            + f"👉 *کل اضافی ٹرانسفر خرچہ:* Rs. {total_buyer_closing_cost:,.0f}\n"
            f"💵 *خریدار کی کل ادائیگی (Total Out-of-Pocket):* Rs. {total_buyer_out_of_pocket:,.0f}\n\n"
            + (f"⭐ *فائلر بچت (Filer Savings):* فائلر ہونے کی وجہ سے آپ کی سیدھی Rs. {buyer_savings:,.0f} کی بچت ہے!\n\n" if buyer_savings > 0 else "")
            + f"🔴 *بیچنے والے (Seller) کی کٹوتیاں ({seller_label}):*\n"
            f"• FBR سیکشن 236C ٹیکس ({seller_rate*100:.1f}%): Rs. {seller_236c_tax:,.0f}\n"
            f"• سوسائٹی این ڈی سی فیس (NDC): Rs. {society_ndc_fee:,.0f}\n"
            f"👉 *بیچنے والے کو خالص رقم (Net In Hand):* Rs. {net_seller_proceeds:,.0f}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"یہ تخمینہ موجودہ FBR فنانس ایکٹ کے مطابق تیار کیا گیا ہے۔ مزید معلومات کے لیے ہم سے رابطہ فرمائیں۔"
        )

        return TaxCalculationResponse(
            property_price=price,
            taxable_base=taxable_base,
            society=req.society,
            property_type=req.property_type,
            area_size=req.area_size,
            buyer_tax_status=req.buyer_tax_status,
            seller_tax_status=req.seller_tax_status,
            buyer=BuyerExpenseBreakdown(
                section_236k_rate=buyer_rate,
                section_236k_amount=buyer_236k_tax,
                stamp_duty_rate=stamp_rate,
                stamp_duty_amount=stamp_duty,
                tma_tax_rate=tma_rate,
                tma_tax_amount=tma_tax,
                society_transfer_fee=society_transfer_fee,
                society_membership_fee=society_membership_fee,
                urgent_transfer_fee=urgent_transfer_fee,
                total_buyer_closing_cost=total_buyer_closing_cost,
                total_buyer_out_of_pocket=total_buyer_out_of_pocket,
                filer_savings_vs_non_filer=buyer_savings,
            ),
            seller=SellerDeductionBreakdown(
                section_236c_rate=seller_rate,
                section_236c_amount=seller_236c_tax,
                society_ndc_fee=society_ndc_fee,
                total_seller_deductions=total_seller_deductions,
                net_seller_proceeds=net_seller_proceeds,
                filer_savings_vs_non_filer=seller_savings,
            ),
            combined=CombinedClosingSummary(
                total_government_taxes=total_gov,
                total_society_fees=total_society,
                grand_total_closing_cost=grand_total_closing,
            ),
            whatsapp_breakdown_en=whatsapp_en,
            whatsapp_breakdown_ur=whatsapp_ur,
        )
