import { LeadStatus, LeadPriority, PropertyStatus } from "@/types/crm";

/**
 * Format numbers into Pakistani currency denominations (Crore & Lakh / Lac)
 * Standard Pakistani real estate format: Rs. 1.25 Crore, Rs. 85 Lakh
 */
export function formatPKR(
  amount: number,
  compact: boolean = true,
  prefix: string = "Rs. "
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${prefix}0`;
  }

  if (!compact) {
    return `${prefix}${new Intl.NumberFormat("en-PK").format(amount)}`;
  }

  // 1 Crore = 10,000,000 (10 Million)
  if (Math.abs(amount) >= 10_000_000) {
    const crores = amount / 10_000_000;
    const formatted =
      crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/\.?0+$/, "");
    return `${prefix}${formatted} Crore`;
  }

  // 1 Lakh / Lac = 100,000 (100 Thousand)
  if (Math.abs(amount) >= 100_000) {
    const lakhs = amount / 100_000;
    const formatted =
      lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1).replace(/\.?0+$/, "");
    return `${prefix}${formatted} Lakh`;
  }

  // Standard thousands
  return `${prefix}${new Intl.NumberFormat("en-PK").format(amount)}`;
}

/**
 * Format local Pakistani phone numbers (+92 300 1234567)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) {
    return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.startsWith("03") && digits.length === 11) {
    return `+92 ${digits.slice(1, 4)} ${digits.slice(4)}`;
  }
  return phone;
}

/**
 * Sanitize phone number for direct WhatsApp wa.me links
 */
export function getWhatsAppLink(phone: string, text?: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("03")) {
    clean = "92" + clean.slice(1);
  } else if (!clean.startsWith("92") && clean.length === 10) {
    clean = "92" + clean;
  }
  const baseUrl = `https://wa.me/${clean}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}

/**
 * Format readable dates
 */
export function parseUtcDate(dateString: string): Date {
  if (!dateString) return new Date();
  let s = String(dateString).trim();
  if (s.includes("T") && !s.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
    s += "Z";
  }
  return new Date(s);
}

export function formatDate(dateString: string): string {
  try {
    const date = parseUtcDate(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = parseUtcDate(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Status visual badge configurations
 */
export function getLeadStatusConfig(status: LeadStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case "new":
      return {
        label: "New Enquiry",
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "contacted":
      return {
        label: "Contacted",
        bg: "bg-sky-50",
        text: "text-sky-800",
        border: "border-sky-200",
        dot: "bg-sky-500",
      };
    case "qualified":
      return {
        label: "Qualified",
        bg: "bg-teal-50",
        text: "text-teal-800",
        border: "border-teal-200",
        dot: "bg-teal-500",
      };
    case "follow_up":
      return {
        label: "Follow-up Due",
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "site_visit_scheduled":
      return {
        label: "Site Visit Scheduled",
        bg: "bg-indigo-50",
        text: "text-indigo-800",
        border: "border-indigo-200",
        dot: "bg-indigo-500",
      };
    case "negotiation":
      return {
        label: "Under Negotiation",
        bg: "bg-purple-50",
        text: "text-purple-800",
        border: "border-purple-200",
        dot: "bg-purple-500",
      };
    case "won":
      return {
        label: "Deal Closed (Won)",
        bg: "bg-emerald-100",
        text: "text-emerald-900",
        border: "border-emerald-300",
        dot: "bg-emerald-600",
      };
    case "lost":
      return {
        label: "Lost / Dropped",
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
    default:
      return {
        label: status,
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

export function getPriorityConfig(priority: LeadPriority): {
  label: string;
  bg: string;
  text: string;
} {
  switch (priority) {
    case "high":
      return {
        label: "High Priority",
        bg: "bg-rose-50 text-rose-800 border-rose-200",
        text: "text-rose-700",
      };
    case "medium":
      return {
        label: "Medium",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        text: "text-amber-700",
      };
    case "low":
      return {
        label: "Low",
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        text: "text-slate-600",
      };
  }
}

export function getPropertyStatusConfig(status: PropertyStatus): {
  label: string;
  bg: string;
  text: string;
} {
  switch (status) {
    case "available":
      return {
        label: "Available",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        text: "text-emerald-800",
      };
    case "under_negotiation":
      return {
        label: "Under Negotiation",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        text: "text-amber-800",
      };
    case "sold":
      return {
        label: "Sold Out",
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        text: "text-slate-700",
      };
    case "reserved":
      return {
        label: "Token Reserved",
        bg: "bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] border-orange-200 dark:border-orange-800",
        text: "text-[#EE6427]",
      };
  }
}
