from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any

# Current interbank benchmark rates against PKR (1 Foreign Unit = X PKR)
EXCHANGE_RATES_TO_PKR: Dict[str, Decimal] = {
    "PKR": Decimal("1.0"),
    "USD": Decimal("278.50"),
    "GBP": Decimal("362.00"),
    "AED": Decimal("75.80"),
    "SAR": Decimal("74.20"),
    "EUR": Decimal("302.40"),
    "CAD": Decimal("204.10"),
}

CURRENCY_METADATA = {
    "PKR": {
        "name": "Pakistani Rupee",
        "symbol": "Rs.",
        "flag": "🇵🇰",
        "format": "lakh_crore",
    },
    "USD": {
        "name": "US Dollar",
        "symbol": "$",
        "flag": "🇺🇸",
        "format": "standard",
    },
    "GBP": {
        "name": "British Pound",
        "symbol": "£",
        "flag": "🇬🇧",
        "format": "standard",
    },
    "AED": {
        "name": "UAE Dirham",
        "symbol": "AED",
        "flag": "🇦🇪",
        "format": "standard",
    },
    "SAR": {
        "name": "Saudi Riyal",
        "symbol": "SAR",
        "flag": "🇸🇦",
        "format": "standard",
    },
}


def get_supported_currencies() -> Dict[str, Any]:
    """Returns currency metadata and live interbank rates against PKR."""
    result = {}
    for code, meta in CURRENCY_METADATA.items():
        rate = EXCHANGE_RATES_TO_PKR.get(code, Decimal("1.0"))
        result[code] = {
            **meta,
            "rate_to_pkr": float(rate),
            "pkr_per_unit": float(rate),
            "unit_per_pkr": float((Decimal("1.0") / rate).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)),
        }
    return result


def convert_pkr(amount_pkr: Decimal, target_currency: str) -> Decimal:
    """Converts a PKR amount into the target currency."""
    if target_currency not in EXCHANGE_RATES_TO_PKR:
        return amount_pkr
    rate = EXCHANGE_RATES_TO_PKR[target_currency]
    if target_currency == "PKR":
        return amount_pkr
    return (amount_pkr / rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def format_currency_value(amount: Decimal, currency: str) -> str:
    """Formats an amount according to currency standards."""
    currency = currency.upper()
    if currency == "PKR":
        val = float(amount)
        if val >= 10_000_000:
            crore = val / 10_000_000
            return f"Rs. {crore:.2f} Crore".rstrip("0").rstrip(".") + (" Crore" if "." not in f"{crore:.2f}" else "")
        elif val >= 100_000:
            lakh = val / 100_000
            return f"Rs. {lakh:.1f} Lakh"
        return f"Rs. {val:,.0f}"

    meta = CURRENCY_METADATA.get(currency, {"symbol": currency})
    sym = meta["symbol"]
    val_int = int(round(float(amount)))
    return f"{sym} {val_int:,}" if len(sym) > 1 else f"{sym}{val_int:,}"


def convert_pkr_to_all(amount_pkr: Decimal) -> Dict[str, Any]:
    """Returns formatted and raw amounts in all 5 primary currencies."""
    results = {}
    for cur in ["PKR", "USD", "GBP", "AED", "SAR"]:
        converted = convert_pkr(amount_pkr, cur)
        results[cur] = {
            "amount": float(converted),
            "formatted": format_currency_value(converted, cur),
            "currency": cur,
            "symbol": CURRENCY_METADATA.get(cur, {}).get("symbol", cur),
            "flag": CURRENCY_METADATA.get(cur, {}).get("flag", "🌐"),
        }
    return results
