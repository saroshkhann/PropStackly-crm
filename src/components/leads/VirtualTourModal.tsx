"use client";

import React, { useState, useMemo } from "react";
import { Lead, Property } from "@/types/crm";
import { useCRM } from "@/context/CRMContext";
import { formatPKR } from "@/lib/formatters";
import {
  SUPPORTED_TIMEZONES,
  convertTimeBetweenZones,
  generateVirtualTourInviteText,
  generateCalendarICS,
  OverseasTimezone,
} from "@/lib/timezone";
import {
  X,
  Video,
  Calendar,
  Clock,
  Globe,
  MessageSquare,
  Copy,
  Check,
  Download,
  Building,
  Sparkles,
} from "lucide-react";

interface VirtualTourModalProps {
  lead: Lead;
  properties: Property[];
  preSelectedPropertyId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VirtualTourModal({
  lead,
  properties,
  preSelectedPropertyId,
  isOpen,
  onClose,
}: VirtualTourModalProps) {
  const { addSiteVisit, logActivity, showToast, currentAgent, settings } = useCRM();

  const [propertyId, setPropertyId] = useState(
    preSelectedPropertyId || properties[0]?.id || ""
  );

  // Timezone selection
  const [selectedTzId, setSelectedTzId] = useState<string>("Europe/London");
  const [dateStr, setDateStr] = useState<string>(() =>
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [timeStr, setTimeStr] = useState<string>("16:00"); // 4:00 PM client time
  const [platform, setPlatform] = useState<string>("whatsapp_video");
  const [notes, setNotes] = useState<string>("");

  const [isScheduled, setIsScheduled] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedTz = SUPPORTED_TIMEZONES.find((t) => t.id === selectedTzId) || SUPPORTED_TIMEZONES[0];

  // Convert client time to PKT
  const convertedPkt = useMemo(() => {
    return convertTimeBetweenZones(dateStr, timeStr, selectedTzId, "Asia/Karachi");
  }, [dateStr, timeStr, selectedTzId]);

  const handleScheduleTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    try {
      await addSiteVisit({
        leadId: lead.id,
        leadName: lead.fullName,
        leadPhone: lead.phone,
        propertyId: selectedProperty.id,
        propertyTitle: selectedProperty.title,
        propertyLocation: selectedProperty.location,
        assignedAgentId: lead.assignedAgentId,
        agentName: currentAgent?.name || "Consultant",
        visitDate: convertedPkt.date,
        visitTime: convertedPkt.time24h,
        status: "scheduled",
        notes: `Virtual Video Tour (${platform}). Client local time: ${timeStr} (${selectedTz.code}, ${selectedTz.city}). PKT: ${convertedPkt.display}. Notes: ${notes || "None"}`,
      });

      // Log activity
      logActivity(lead.id, {
        leadId: lead.id,
        type: "site_visit",
        title: "Virtual Video Walkthrough Scheduled",
        description: `Scheduled virtual walkthrough for '${selectedProperty.title}' on ${dateStr} at ${timeStr} (${selectedTz.code}) / ${convertedPkt.display} PKT via ${platform}.`,
        performedBy: currentAgent?.name || "Consultant",
      });

      setIsScheduled(true);
      showToast("Virtual Walkthrough scheduled and added to pipeline!");
    } catch (err: any) {
      showToast(err.message || "Failed to schedule virtual tour", "error");
    }
  };

  const inviteText = useMemo(() => {
    if (!selectedProperty) return "";
    return generateVirtualTourInviteText({
      buyerName: lead.fullName,
      propertyTitle: selectedProperty.title,
      propertySociety: selectedProperty.society,
      demandFormatted: formatPKR(selectedProperty.pricePKR),
      dateFormatted: dateStr,
      clientTimeDisplay: `${timeStr} (${selectedTz.code})`,
      pktTimeDisplay: convertedPkt.display,
      platform,
      agentName: currentAgent?.name || "Hamza Malik",
      agencyName: settings?.agencyName || "Apex Properties Islamabad",
      contactPhone: currentAgent?.phone || "+92 300 5550192",
    });
  }, [lead, selectedProperty, dateStr, timeStr, selectedTz, convertedPkt, platform, currentAgent, settings]);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    showToast("Virtual tour invitation copied!");
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    showToast("Launching WhatsApp with confirmed invitation...");
  };

  const handleDownloadCalendar = () => {
    if (!selectedProperty) return;
    const icsUri = generateCalendarICS({
      title: `Virtual Tour: ${selectedProperty.title}`,
      description: `Virtual property walkthrough with ${lead.fullName} (${lead.phone}) for ${selectedProperty.title} in ${selectedProperty.society}.\n\nPlatform: ${platform}\nAgency: ${settings?.agencyName || "Apex Properties"}`,
      location: selectedProperty.society,
      startDateStr: convertedPkt.date,
      startTime24h: convertedPkt.time24h,
      durationMinutes: 45,
    });

    const link = document.createElement("a");
    link.href = icsUri;
    link.setAttribute("download", `walkthrough-${lead.fullName.replace(/\s+/g, "-")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Calendar invite (.ics) downloaded!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EE6427]/20 border border-orange-400/30 text-orange-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Schedule Virtual Video Tour
              </h3>
              <p className="text-xs text-orange-200/80 mt-0.5">
                Automatic timezone conversion for overseas Pakistani clients
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Pill */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Client:</span>{" "}
            <span className="font-bold text-slate-800 dark:text-white">{lead.fullName}</span>{" "}
            <span className="text-slate-400">({lead.phone})</span>
          </div>
          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/50 text-[#DE5518] dark:text-orange-400 font-bold rounded-full text-[10px]">
            {lead.city || "Overseas"}
          </span>
        </div>

        {/* Modal Form */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!isScheduled ? (
            <form onSubmit={handleScheduleTour} className="space-y-4">
              {/* Select Property */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Property
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.society} ({formatPKR(p.pricePKR)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timezone Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Timezone Hub
                </label>
                <select
                  value={selectedTzId}
                  onChange={(e) => setSelectedTzId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.flag} {tz.country} — {tz.city} ({tz.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Client Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Local Time ({selectedTz.code})
                  </label>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Live Dual Time Converter Banner */}
              <div className="p-3 bg-orange-50/80 dark:bg-slate-800 border border-orange-200/80 dark:border-orange-900/50 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-orange-950 dark:text-orange-200 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5 text-[#EE6427]" />
                  <span>Real-Time Dual Time Synchronization:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800 border border-orange-100 dark:border-orange-950/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      Client Local Time
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {timeStr} <span className="text-xs font-semibold text-[#EE6427]">({selectedTz.code})</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedTz.city}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800 border border-orange-100 dark:border-orange-950/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      Islamabad / Pakistan
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {convertedPkt.display}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{convertedPkt.date}</p>
                  </div>
                </div>
              </div>

              {/* Video Platform */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Video Calling Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform("whatsapp_video")}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      platform === "whatsapp_video"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    WhatsApp Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform("zoom")}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      platform === "zoom"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-[#EE6427] text-orange-950 dark:text-orange-200 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    Zoom
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform("google_meet")}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      platform === "google_meet"
                        ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-800 dark:text-indigo-300 font-bold"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750"
                    }`}
                  >
                    Google Meet
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Walkthrough Focus & Agenda Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspect Italian kitchen, 15kW solar system & CDA transfer papers"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  Confirm & Schedule Virtual Tour
                </button>
              </div>
            </form>
          ) : (
            /* Post-booking Confirmation State */
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    Virtual Walkthrough Scheduled!
                  </h4>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mt-0.5">
                    Logged to lead timeline and synced to PKT appointment register.
                  </p>
                </div>
              </div>

              {/* Invitation Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Client WhatsApp Invitation
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                  {inviteText}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCalendar}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Download .ics calendar event"
                >
                  <Download className="w-4 h-4" />
                  Add to Calendar (.ics)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {selectedProperty?.society} • Virtual Walkthrough
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
