"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Maximize2,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Building,
  Scale,
  Handshake,
  Users,
  Compass,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { SocietyPlot, PlotStatus } from "@/types/plot";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords, pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface PlotDetailDrawerProps {
  plot: SocietyPlot | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (plotId: string, newStatus: PlotStatus) => void;
  onInitiateDeal: (plot: SocietyPlot) => void;
  onOpenLegalDocs: (plot: SocietyPlot) => void;
}

export function PlotDetailDrawer({
  plot,
  isOpen,
  onClose,
  onUpdateStatus,
  onInitiateDeal,
  onOpenLegalDocs,
}: PlotDetailDrawerProps) {
  const { leads, showToast } = useCRM();
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedCnic, setCopiedCnic] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "buyers" | "tax">("details");

  if (!isOpen || !plot) return null;

  // Matching buyer leads in CRM whose budget is within 25% of this plot's price
  const matchedLeads = leads.filter((lead) => {
    if (lead.status === "won" || lead.status === "lost") return false;
    const minBudget = plot.demandPricePKR * 0.75;
    const maxBudget = plot.demandPricePKR * 1.35;
    const matchesBudget = lead.budgetPKR >= minBudget && lead.budgetPKR <= maxBudget;
    const matchesLocation =
      lead.preferredLocations.some((loc) =>
        loc.toLowerCase().includes(plot.societyName.toLowerCase()) ||
        plot.societyName.toLowerCase().includes(loc.toLowerCase())
      ) || lead.preferredLocations.length === 0;

    return matchesBudget && (matchesLocation || lead.city === "Islamabad" || lead.city === "Rawalpindi");
  });

  // Estimated FBR 236C / 236K Taxes
  const buyerTaxFiler = Math.round(plot.demandPricePKR * 0.03);
  const sellerTaxFiler = Math.round(plot.demandPricePKR * 0.03);
  const stampDuty = Math.round(plot.demandPricePKR * 0.01);
  const estimatedSocietyTransferFee = plot.size.includes("Kanal") ? 135_000 : 75_000;
  const totalEstimatedClosing = buyerTaxFiler + stampDuty + estimatedSocietyTransferFee;

  // WhatsApp Pitch Formatter
  const handleCopyWhatsAppPitch = (leadName?: string) => {
    const greeting = leadName ? `Assalam-o-Alaikum ${leadName} sb,` : `Assalam-o-Alaikum,`;
    const pitch =
      `${greeting}\n\n` +
      `🔥 *Direct Plot Available in ${plot.societyName} (${plot.sector})*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *Plot Number*: ${plot.plotNumber} (${plot.street})\n` +
      `📐 *Size & Dimensions*: ${plot.size} (${plot.dimensions})\n` +
      `🏷️ *Category*: ${plot.isCorner ? "🌟 Corner " : ""}${plot.isParkFacing ? "🌳 Park Facing " : ""}${plot.isBoulevard ? `🛣️ ${plot.roadWidthFt}ft Boulevard` : "Regular"}\n` +
      `📜 *Transfer Status*: ${plot.possession === "possession_ready" ? "Ready Possession (ADC)" : "Balloted File"}\n` +
      `💰 *Demand*: ${formatPKR(plot.demandPricePKR)} (${pkrToUrduWords(plot.demandPricePKR)})\n` +
      `🔒 *Token Requirement*: ${formatPKR(plot.minimumTokenPKR)}\n\n` +
      `📑 *Notes*: ${plot.notes || "Direct owner meeting available upon request."}\n\n` +
      `Kindly let me know if you would like to arrange a site visit today.`;

    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    showToast("WhatsApp pitch copied to clipboard!", "success");
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const getStatusBadge = (status: PlotStatus) => {
    switch (status) {
      case "available":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available for Sale
          </span>
        );
      case "token_paid":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Token Locked
          </span>
        );
      case "bayana_done":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Bayana Iqrarnama Executed
          </span>
        );
      case "sold":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Transferred / Sold
          </span>
        );
      case "hold":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Under Reservation Hold
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#EE6427]/10 text-[#EE6427] font-mono font-bold text-xs border border-[#EE6427]/20 uppercase">
                {plot.societyName}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {plot.sector} • {plot.street}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{plot.plotNumber}</span>
              <span className="text-sm font-semibold text-slate-500 font-sans">
                ({plot.size})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS BAR & TABS */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div>{getStatusBadge(plot.status)}</div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "details"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Plot Specs
            </button>
            <button
              onClick={() => setActiveTab("buyers")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "buyers"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Matched Buyers</span>
              {matchedLeads.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#EE6427] text-white text-[10px] flex items-center justify-center font-mono">
                  {matchedLeads.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "tax"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              FBR & Transfer Dues
            </button>
          </div>
        </div>

        {/* DRAWER BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: SPECIFICATIONS */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Financial Highlight Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Asking Demand Price:
                    </span>
                    <span className="text-2xl font-black font-mono text-[#EE6427]">
                      {formatPKR(plot.demandPricePKR)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                      Min Token Advance:
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {formatPKR(plot.minimumTokenPKR)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-750 text-xs font-urdu text-slate-300">
                  قیمت بحساب روپے: <strong>{pkrToUrduWords(plot.demandPricePKR)}</strong>
                </div>
              </div>

              {/* Special Category Badges */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pakistani Property Features & Premiums
                </label>
                <div className="flex flex-wrap gap-2">
                  {plot.isCorner && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Corner Plot (+10% Premium)</span>
                    </span>
                  )}
                  {plot.isParkFacing && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <span>🌳 Park Facing (+10% Premium)</span>
                    </span>
                  )}
                  {plot.isBoulevard && (
                    <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <span>🛣️ {plot.roadWidthFt}ft Main Boulevard</span>
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold">
                    Road Width: {plot.roadWidthFt} Feet
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold">
                    Dimensions: {plot.dimensions}
                  </span>
                </div>
              </div>

              {/* Allotment & Authority Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#EE6427]" />
                  Authority Allotment & Society NDC
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Possession Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                      {plot.possession.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Allotment Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plot.allotmentType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Society NDC Status:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {plot.ndcStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Direct Dealer / Source:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plot.directDealer || "In-House Agency Listing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner / Seller Particulars */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Plot Seller / Allottee Particulars
                  </h3>
                  <span className="text-[10px] text-slate-400">Direct Contact</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Owner Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{plot.ownerName}</span>
                  </div>

                  {plot.ownerCnic && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">CNIC Number:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(plot.ownerCnic || "");
                          setCopiedCnic(true);
                          setTimeout(() => setCopiedCnic(false), 2000);
                        }}
                        className="font-mono text-slate-700 dark:text-slate-300 hover:text-[#EE6427] flex items-center gap-1 cursor-pointer"
                        title="Click to copy CNIC"
                      >
                        <span>{plot.ownerCnic}</span>
                        {copiedCnic ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Phone:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${plot.ownerPhone}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-mono font-semibold text-xs flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{plot.ownerPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${plot.ownerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Assalam-o-Alaikum ${plot.ownerName} sb, regarding your plot ${plot.plotNumber} in ${plot.societyName}...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Quick Selector */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Update Plot Live Availability Status
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                  {(["available", "token_paid", "bayana_done", "sold", "hold"] as PlotStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateStatus(plot.id, st)}
                      className={`px-2 py-1.5 rounded-lg text-center font-bold text-[11px] capitalize transition-all cursor-pointer ${
                        plot.status === st
                          ? "bg-[#EE6427] text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plot Notes */}
              {plot.notes && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Internal Agency Agent Notes
                  </span>
                  <p>{plot.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MATCHED BUYER LEADS */}
          {activeTab === "buyers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Qualified CRM Buyer Inquiries
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active clients matching {plot.societyName} within {formatPKR(plot.demandPricePKR)} budget envelope.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EE6427]/10 text-[#EE6427] text-xs font-bold font-mono">
                  {matchedLeads.length} Matches Found
                </span>
              </div>

              {matchedLeads.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-750 text-slate-500 text-xs space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No exact matching buyer leads found in this price bracket.
                  </p>
                  <p>You can broadcast this plot directly to your WhatsApp network using the button below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedLeads.map((lead) => {
                    const delta = lead.budgetPKR - plot.demandPricePKR;
                    return (
                      <div
                        key={lead.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {lead.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Budget: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatPKR(lead.budgetPKR)}</strong>
                              {delta >= 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-semibold">
                                  (+{formatPKR(delta)} Surplus)
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 ml-1.5 font-semibold">
                                  (-{formatPKR(Math.abs(delta))} Gap)
                                </span>
                              )}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {lead.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span className="text-slate-500 font-mono">{lead.phone}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyWhatsAppPitch(lead.fullName)}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Pitch</span>
                            </button>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Assalam-o-Alaikum ${lead.fullName} sb,\n\nI have found an ideal option matching your requirement in ${plot.societyName}:\n• Plot ${plot.plotNumber}, ${plot.sector} (${plot.size})\n• Demand: ${formatPKR(plot.demandPricePKR)}\n\nWould you like me to share full details and arrange a site visit?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Send WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TAX & CLOSING DUES */}
          {activeTab === "tax" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Official Pakistani Transfer Closing Estimate
                </span>
                <div className="text-2xl font-black font-mono text-[#EE6427]">
                  {formatPKR(totalEstimatedClosing)}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Estimated purchaser settlement dues (FBR Section 236K, Provincial Stamp Duty, and Housing Society NDC Transfer Fees).
                </p>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">FBR Section 236K (Buyer - Filer 3%):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPKR(buyerTaxFiler)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Provincial Stamp Duty (1% ICT/Punjab):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPKR(stampDuty)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Estimated Society Transfer & NDC Fee:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPKR(estimatedSocietyTransferFee)}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">FBR Section 236C (Seller - Filer 3%):</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatPKR(sellerTaxFiler)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                ℹ️ Section 236C is adjustable by the seller during annual tax return filing. Society transfer fees vary slightly depending on Allotment vs Transfer Letter status.
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleCopyWhatsAppPitch()}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {copiedPitch ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPitch ? "Pitch Copied!" : "Copy Pitch"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenLegalDocs(plot)}
              className="px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Generate 1-Click Urdu Bayana Iqrarnama for this plot"
            >
              <Scale className="w-4 h-4 text-[#EE6427]" />
              <span className="hidden sm:inline">Bayana Iqrarnama</span>
              <span className="sm:hidden">Iqrarnama</span>
            </button>

            <button
              type="button"
              onClick={() => onInitiateDeal(plot)}
              className="px-4 py-2.5 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Initiate Token & Transaction Milestone"
            >
              <Handshake className="w-4 h-4" />
              <span>Lock Deal / Token</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
