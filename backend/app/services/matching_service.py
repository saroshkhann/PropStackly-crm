import re
from decimal import Decimal
from typing import List, Optional, Tuple
from app.models.lead import Lead
from app.models.property import Property
from app.schemas.lead import MatchedPropertyItem


def format_pkr_crore_lakh(amount: Decimal) -> str:
    """Formats Decimal PKR into readable Pakistani crore / lakh formatting."""
    val = float(amount)
    if val >= 10_000_000:
        crores = val / 10_000_000
        return f"Rs. {crores:.2f} Crore".rstrip("0").rstrip(".") if crores % 1 == 0 else f"Rs. {crores:.2f} Crore"
    elif val >= 100_000:
        lakhs = val / 100_000
        return f"Rs. {lakhs:.2f} Lakh".rstrip("0").rstrip(".") if lakhs % 1 == 0 else f"Rs. {lakhs:.2f} Lakh"
    return f"PKR {val:,.0f}"


class MatchingService:
    @staticmethod
    def calculate_property_match(
        lead: Lead,
        prop: Property,
        agent_name: Optional[str] = None,
        agency_name: Optional[str] = None,
    ) -> MatchedPropertyItem:
        """
        Calculates an intelligent match score (0-100%) between a buyer lead's requirements
        and an inventory property.
        """
        reasons: List[str] = []

        # 1. Location / Society Match (Max 40 points)
        location_score = 0
        prop_society_norm = prop.society.lower().strip()
        prop_loc_norm = prop.location.lower().strip()
        lead_locs_norm = (lead.preferred_locations or "").lower().strip()

        # Split multiple preferred locations by comma or slash
        preferred_list = [loc.strip() for loc in re.split(r"[,/|;]", lead_locs_norm) if loc.strip()]

        exact_loc_match = False
        partial_loc_match = False

        for target in preferred_list:
            if target in prop_society_norm or prop_society_norm in target:
                exact_loc_match = True
                break
            # Check key keywords like "dha", "bahria", "gulberg", "b-17", "f-8", "f-7"
            keywords = [w for w in target.split() if len(w) > 2 and w not in ["phase", "sector", "islamabad", "rawalpindi"]]
            for kw in keywords:
                if kw in prop_society_norm or kw in prop_loc_norm:
                    partial_loc_match = True
                    break

        if exact_loc_match:
            location_score = 40
            reasons.append(f"Target Society Match: {prop.society}")
        elif partial_loc_match:
            location_score = 25
            reasons.append(f"Location Proximity: {prop.society}")
        elif lead.city and prop.city and lead.city.lower() == prop.city.lower():
            location_score = 15
            reasons.append(f"City Match: {prop.city}")

        # 2. Budget Fit (Max 35 points)
        budget_score = 0
        budget_delta = prop.price_pkr - lead.budget_pkr
        budget_fit = "within_budget"

        if lead.budget_pkr > 0:
            ratio = float(prop.price_pkr) / float(lead.budget_pkr)
            if 0.92 <= ratio <= 1.05:
                budget_score = 35
                budget_fit = "exact" if ratio == 1.0 else "within_budget"
                reasons.append("Optimal Budget Fit (within ±8%)")
            elif 0.80 <= ratio <= 1.20:
                budget_score = 28
                budget_fit = "below_budget" if ratio < 1.0 else "above_budget"
                reasons.append(f"Close Budget Fit ({round(ratio * 100)}% of target)")
            elif 0.65 <= ratio <= 1.35:
                budget_score = 18
                budget_fit = "below_budget" if ratio < 1.0 else "above_budget"
                reasons.append("Within Negotiable Range")
            elif 0.50 <= ratio <= 1.50:
                budget_score = 8
                budget_fit = "below_budget" if ratio < 1.0 else "above_budget"
                reasons.append("Broad Price Band")
        else:
            budget_score = 20
            reasons.append("Unrestricted Buyer Budget")

        # 3. Property Type Match (Max 25 points)
        type_score = 0
        lead_type_norm = (lead.property_type_interest or "").lower()
        prop_type_norm = (prop.type or "").lower()

        if lead_type_norm == prop_type_norm:
            type_score = 25
            reasons.append(f"Exact Property Type: {prop.type}")
        elif ("house" in lead_type_norm or "villa" in lead_type_norm) and ("house" in prop_type_norm or "villa" in prop_type_norm):
            type_score = 25
            reasons.append(f"Residential Villa Match: {prop.type}")
        elif "plot" in lead_type_norm and "plot" in prop_type_norm:
            type_score = 25
            reasons.append(f"Plot Category Match: {prop.type}")
        elif ("commercial" in lead_type_norm or "plaza" in lead_type_norm) and ("commercial" in prop_type_norm or "plaza" in prop_type_norm):
            type_score = 25
            reasons.append(f"Commercial Category Match: {prop.type}")
        elif ("residential" in lead_type_norm or "residential" in prop_type_norm):
            type_score = 12
            reasons.append(f"Compatible Category: {prop.type}")

        total_score = min(100, max(10, location_score + budget_score + type_score))

        # Level determination
        if total_score >= 85:
            match_level = "exceptional"
        elif total_score >= 65:
            match_level = "strong"
        else:
            match_level = "moderate"

        # Pre-formatted Pakistani WhatsApp Pitch Text
        eff_agent_name = agent_name or (lead.assigned_agent.full_name if lead.assigned_agent else "Your Property Consultant")
        eff_agency_name = agency_name or "Apex Properties Islamabad"
        lead_budget_fmt = format_pkr_crore_lakh(lead.budget_pkr)
        prop_price_fmt = format_pkr_crore_lakh(prop.price_pkr)

        budget_comp_text = "Within your allocated budget"
        if budget_delta < 0:
            savings = abs(budget_delta)
            budget_comp_text = f"Rs. {format_pkr_crore_lakh(savings).replace('Rs. ', '')} below your budget max"
        elif budget_delta > 0:
            budget_comp_text = f"Only Rs. {format_pkr_crore_lakh(budget_delta).replace('Rs. ', '')} above target"

        beds_str = f"\n🛏 *Specs*: {prop.bedrooms} Bedrooms, {prop.bathrooms} Bathrooms" if prop.bedrooms else ""

        # 1. English Pitch Text
        whatsapp_pitch = (
            f"Assalam-o-Alaikum {lead.full_name}!\n\n"
            f"Based on your inquiry for a {lead.property_type_interest} in {prop.society} "
            f"(Target: {lead_budget_fmt}), I have found an option that matches your criteria (*{total_score}% Match*):\n\n"
            f"🏠 *{prop.title}*\n"
            f"📍 *Location*: {prop.location}, {prop.society}\n"
            f"💰 *Demand*: {prop_price_fmt} ({budget_comp_text})\n"
            f"📐 *Area Size*: {prop.area_size}{beds_str}\n"
            f"✨ *Key Feature*: Verified ownership documents with immediate transfer.\n\n"
            f"Would you be available for a short site visit this week? I can share the video walkthrough and layout plan.\n\n"
            f"Best regards,\n"
            f"*{eff_agent_name}*\n"
            f"{eff_agency_name}"
        )

        # 2. Urdu Pitch Text (Roman Urdu / Cultural Real Estate Tone)
        budget_comp_text_urdu = "Aap ke budget ke bilkul mutabiq"
        if budget_delta < 0:
            savings = abs(budget_delta)
            budget_comp_text_urdu = f"Rs. {format_pkr_crore_lakh(savings).replace('Rs. ', '')} aap ke budget se kam"
        elif budget_delta > 0:
            budget_comp_text_urdu = f"Sirf Rs. {format_pkr_crore_lakh(budget_delta).replace('Rs. ', '')} target budget se ooper"

        beds_str_urdu = f"\n🛏 *Specs*: {prop.bedrooms} Bedrooms, {prop.bathrooms} Bathrooms" if prop.bedrooms else ""

        whatsapp_pitch_urdu = (
            f"السلام علیکم {lead.full_name} صاحب!\n\n"
            f"Aap ki requirement ke mutabiq {prop.society} mein {lead.property_type_interest} "
            f"(Target: {lead_budget_fmt}) ke liye ek behtareen property mili hai (*{total_score}% Match*):\n\n"
            f"🏠 *{prop.title}*\n"
            f"📍 *Location*: {prop.location}, {prop.society}\n"
            f"💰 *Demand*: {prop_price_fmt} ({budget_comp_text_urdu})\n"
            f"📐 *Size*: {prop.area_size}{beds_str_urdu}\n"
            f"✨ *Highlights*: Clear title deed, verified ownership documents, aur fori biometric transfer available.\n\n"
            f"Kya aap is hafte is property ka video walkthrough dekhna chahein ge ya physical site visit schedule karein?\n\n"
            f"Shukriya,\n"
            f"*{eff_agent_name}*\n"
            f"{eff_agency_name}"
        )

        return MatchedPropertyItem(
            id=prop.id,
            title=prop.title,
            type=prop.type,
            location=prop.location,
            society=prop.society,
            city=prop.city,
            price_pkr=prop.price_pkr,
            area_size=prop.area_size,
            bedrooms=prop.bedrooms,
            bathrooms=prop.bathrooms,
            status=prop.status,
            image_url=prop.image_url,
            match_score=total_score,
            match_level=match_level,
            budget_fit=budget_fit,
            budget_difference_pkr=budget_delta,
            reasons=reasons,
            whatsapp_pitch_text=whatsapp_pitch,
            whatsapp_pitch_text_urdu=whatsapp_pitch_urdu,
        )

    @staticmethod
    def get_matches_for_lead(
        lead: Lead,
        properties: List[Property],
        min_score: int = 35,
        agent_name: Optional[str] = None,
        agency_name: Optional[str] = None,
    ) -> List[MatchedPropertyItem]:
        """
        Computes matches for a lead across an inventory list, sorted by match_score descending.
        """
        results: List[MatchedPropertyItem] = []
        for prop in properties:
            # Exclude sold properties
            if prop.status.lower() in ["sold", "inactive"]:
                continue
            item = MatchingService.calculate_property_match(
                lead=lead,
                prop=prop,
                agent_name=agent_name,
                agency_name=agency_name,
            )
            if item.match_score >= min_score:
                results.append(item)

        results.sort(key=lambda x: x.match_score, reverse=True)
        return results
