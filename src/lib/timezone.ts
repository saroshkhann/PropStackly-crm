export interface OverseasTimezone {
  id: string; // IANA zone, e.g. "Europe/London"
  code: string; // BST, GST, etc.
  city: string;
  country: string;
  flag: string;
  utcOffsetMinutes: number; // e.g. +60 for London (BST UTC+1), +300 for PKT (UTC+5)
}

export const SUPPORTED_TIMEZONES: OverseasTimezone[] = [
  {
    id: "Europe/London",
    code: "BST",
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    utcOffsetMinutes: 60, // UTC+1 during BST
  },
  {
    id: "Asia/Dubai",
    code: "GST",
    city: "Dubai / Abu Dhabi",
    country: "UAE",
    flag: "🇦🇪",
    utcOffsetMinutes: 240, // UTC+4
  },
  {
    id: "Asia/Riyadh",
    code: "AST",
    city: "Riyadh / Jeddah",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    utcOffsetMinutes: 180, // UTC+3
  },
  {
    id: "America/New_York",
    code: "EDT",
    city: "New York / Toronto",
    country: "USA / Canada",
    flag: "🇺🇸",
    utcOffsetMinutes: -240, // UTC-4
  },
  {
    id: "America/Chicago",
    code: "CDT",
    city: "Chicago / Houston",
    country: "USA",
    flag: "🇺🇸",
    utcOffsetMinutes: -300, // UTC-5
  },
  {
    id: "America/Los_Angeles",
    code: "PDT",
    city: "Los Angeles / SF",
    country: "USA",
    flag: "🇺🇸",
    utcOffsetMinutes: -420, // UTC-7
  },
  {
    id: "Australia/Sydney",
    code: "AEST",
    city: "Sydney",
    country: "Australia",
    flag: "🇦🇺",
    utcOffsetMinutes: 600, // UTC+10
  },
  {
    id: "Asia/Karachi",
    code: "PKT",
    city: "Islamabad / Lahore",
    country: "Pakistan",
    flag: "🇵🇰",
    utcOffsetMinutes: 300, // UTC+5
  },
];

/**
 * Converts a scheduled date & time from one timezone to another.
 */
export function convertTimeBetweenZones(
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:MM (24h)
  fromTzId: string,
  toTzId: string
): {
  date: string;
  time24h: string;
  time12h: string;
  display: string;
} {
  const fromTz = SUPPORTED_TIMEZONES.find((t) => t.id === fromTzId) || SUPPORTED_TIMEZONES[7];
  const toTz = SUPPORTED_TIMEZONES.find((t) => t.id === toTzId) || SUPPORTED_TIMEZONES[7];

  const [hours, minutes] = timeStr.split(":").map(Number);
  const [year, month, day] = dateStr.split("-").map(Number);

  // Approximate using standard UTC offsets
  const totalMinutesFromMidnight = hours * 60 + minutes;
  const diffMinutes = toTz.utcOffsetMinutes - fromTz.utcOffsetMinutes;
  let targetTotalMinutes = totalMinutesFromMidnight + diffMinutes;

  let dayOffset = 0;
  if (targetTotalMinutes < 0) {
    targetTotalMinutes += 24 * 60;
    dayOffset = -1;
  } else if (targetTotalMinutes >= 24 * 60) {
    targetTotalMinutes -= 24 * 60;
    dayOffset = 1;
  }

  const targetHours = Math.floor(targetTotalMinutes / 60);
  const targetMinutes = targetTotalMinutes % 60;

  const targetDate = new Date(year, month - 1, day + dayOffset);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const targetDateStr = `${yyyy}-${mm}-${dd}`;

  const time24h = `${String(targetHours).padStart(2, "0")}:${String(targetMinutes).padStart(2, "0")}`;
  
  const period = targetHours >= 12 ? "PM" : "AM";
  const h12 = targetHours % 12 || 12;
  const time12h = `${String(h12).padStart(2, "0")}:${String(targetMinutes).padStart(2, "0")} ${period}`;

  return {
    date: targetDateStr,
    time24h,
    time12h,
    display: `${time12h} (${toTz.code})`,
  };
}

/**
 * Generates formatted WhatsApp virtual tour invitation text.
 */
export function generateVirtualTourInviteText({
  buyerName,
  propertyTitle,
  propertySociety,
  demandFormatted,
  dateFormatted,
  clientTimeDisplay,
  pktTimeDisplay,
  platform,
  agentName,
  agencyName,
  contactPhone,
  portalLink,
}: {
  buyerName: string;
  propertyTitle: string;
  propertySociety: string;
  demandFormatted: string;
  dateFormatted: string;
  clientTimeDisplay: string;
  pktTimeDisplay: string;
  platform: string;
  agentName: string;
  agencyName: string;
  contactPhone: string;
  portalLink?: string;
}): string {
  const platformLabel =
    platform === "whatsapp_video"
      ? "WhatsApp HD Video Call"
      : platform === "zoom"
      ? "Zoom Meeting"
      : "Google Meet";

  let msg =
    `Assalam-o-Alaikum ${buyerName}!\n\n` +
    `Your private virtual walkthrough for *${propertyTitle}* has been scheduled:\n\n` +
    `🏠 *Property*: ${propertyTitle}\n` +
    `📍 *Society*: ${propertySociety}\n` +
    `💰 *Demand*: ${demandFormatted}\n\n` +
    `📅 *Date*: ${dateFormatted}\n` +
    `⏰ *Your Time*: ${clientTimeDisplay}\n` +
    `🇵🇰 *Islamabad Time*: ${pktTimeDisplay}\n` +
    `📱 *Platform*: ${platformLabel} (${contactPhone})\n\n` +
    `During this video session, we will provide a comprehensive live tour of the property, structural details, and review society NOC verification & transfer documents.\n\n`;

  if (portalLink) {
    msg += `🔗 *View Digital Dossier & High-Res Walkthrough*:\n${portalLink}\n\n`;
  }

  msg += `Best regards,\n*${agentName}*\n${agencyName}`;
  return msg;
}

/**
 * Generates an .ics calendar file data URI for 1-click add to Google/Apple/Outlook Calendar.
 */
export function generateCalendarICS({
  title,
  description,
  location,
  startDateStr, // YYYY-MM-DD
  startTime24h, // HH:MM
  durationMinutes = 45,
}: {
  title: string;
  description: string;
  location: string;
  startDateStr: string;
  startTime24h: string;
  durationMinutes?: number;
}): string {
  const [yyyy, mm, dd] = startDateStr.split("-");
  const [hh, min] = startTime24h.split(":");

  const startUtc = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh) - 5, Number(min)));
  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000);

  const formatIcsTime = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PropStackly Real Estate CRM//Overseas Walkthrough//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    `DTSTART:${formatIcsTime(startUtc)}`,
    `DTEND:${formatIcsTime(endUtc)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
}
