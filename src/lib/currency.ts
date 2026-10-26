import { formatPKR } from "./formatters";

export type CurrencyCode = "PKR" | "USD" | "GBP" | "AED" | "SAR";

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rateToPKR: number; // 1 Foreign Currency = X PKR
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  PKR: {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "Rs.",
    flag: "🇵🇰",
    rateToPKR: 1.0,
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
    rateToPKR: 278.5,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    flag: "🇬🇧",
    rateToPKR: 362.0,
  },
  AED: {
    code: "AED",
    name: "UAE Dirham",
    symbol: "AED",
    flag: "🇦🇪",
    rateToPKR: 75.8,
  },
  SAR: {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "SAR",
    flag: "🇸🇦",
    rateToPKR: 74.2,
  },
};

/**
 * Converts a PKR amount to target foreign currency.
 */
export function convertFromPKR(amountPKR: number, target: CurrencyCode): number {
  if (!amountPKR || isNaN(amountPKR)) return 0;
  if (target === "PKR") return amountPKR;
  const meta = SUPPORTED_CURRENCIES[target];
  if (!meta || !meta.rateToPKR) return amountPKR;
  return amountPKR / meta.rateToPKR;
}

/**
 * Converts an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const pkrVal = from === "PKR" ? amount : amount * SUPPORTED_CURRENCIES[from].rateToPKR;
  return convertFromPKR(pkrVal, to);
}

/**
 * Formats a currency amount smartly based on currency code.
 */
export function formatCurrency(
  amountPKR: number,
  currency: CurrencyCode = "PKR",
  compact: boolean = true
): string {
  if (currency === "PKR") {
    return formatPKR(amountPKR, compact);
  }

  const meta = SUPPORTED_CURRENCIES[currency];
  const converted = convertFromPKR(amountPKR, currency);
  const rounded = Math.round(converted);

  if (compact && rounded >= 1_000_000) {
    const millions = (converted / 1_000_000).toFixed(2).replace(/\.?0+$/, "");
    return `${meta.symbol} ${millions}M`;
  }

  const formattedNum = new Intl.NumberFormat("en-US").format(rounded);
  if (currency === "USD" || currency === "GBP") {
    return `${meta.symbol}${formattedNum}`;
  }
  return `${meta.symbol} ${formattedNum}`;
}

/**
 * Formats dual currency display: e.g. "Rs. 8.50 Crore (~£234,800)"
 */
export function formatDualCurrency(
  amountPKR: number,
  secondaryCurrency: CurrencyCode = "GBP"
): string {
  const pkrStr = formatPKR(amountPKR);
  if (secondaryCurrency === "PKR") return pkrStr;
  const secStr = formatCurrency(amountPKR, secondaryCurrency, false);
  return `${pkrStr} (~${secStr})`;
}
