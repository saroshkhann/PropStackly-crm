"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  MessageSquare,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldAlert,
  Send,
  Building,
} from "lucide-react";
import { LeadSLAInfo } from "@/types/sla";
import { formatSLACountdown, getSLAStateBadge } from "@/lib/slaEngine";
import { useCRM } from "@/context/CRMContext";

interface QuickContactSLAModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadSla: LeadSLAInfo | null;
  onLogContactSuccess: (
    leadId: string,
    contactType: "call" | "whatsapp" | "meeting" | "note",
    notes: string,
    responseMinutes: number
  ) => void;
}

export function QuickContactSLAModal({
  isOpen,
  onClose,
  leadSla,
  onLogContactSuccess,
}: QuickContactSLAModalProps) {
  const { currentAgent, settings } = useCRM();

  const [contactType, setContactType] = useState<"call" | "whatsapp" | "meeting" | "note">(
    "whatsapp"
  );
  const [notes, setNotes] = useState<string>("Contacted lead immediately. Interested in site visit.");

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !leadSla) return null;

  const countdown = formatSLACountdown(
    leadSla.remainingMinutes,
    leadSla.elapsedMinutes,
    leadSla.targetMinutes
  );
  const badge = getSLAStateBadge(leadSla.state);

  const agentName = currentAgent?.name || leadSla.assignedAgentName || "PropStackly Agent";
  const agencyName = settings.agencyName || "PropStackly Prime Properties";

  const waMessage =
    `Assalam-o-Alaikum *${leadSla.leadName}*,\n\n` +
    `Thank you for reaching out via *${leadSla.source}* regarding real estate opportunities in Islamabad / Rawalpindi.\n\n` +
    `I am *${agentName}* from *${agencyName}*. When would be a convenient time for a quick 2-minute call or site visit to discuss available inventory and price quotation?\n\n` +
    `Looking forward to assisting you!`;

  const handleLaunchWhatsApp = () => {
    const cleanPhone = leadSla.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`, "_blank");
    setContactType("whatsapp");
  };

  const handleLaunchCall = () => {
    window.open(`tel:${leadSla.phone}`, "_self");
    setContactType("call");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogContactSuccess(
      leadSla.leadId,
      contactType,
      notes,
      leadSla.elapsedMinutes
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Cross Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-300/80 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 group"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 pr-14">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Log First Contact & Stop SLA Timer
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calling or WhatsApping this lead records first-response SLA compliance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* SLA Countdown Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${badge.badgeBg}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${badge.dotColor}`}></span>
                <span className={`font-bold text-sm ${badge.textColor}`}>{badge.label}</span>
                <span className="text-[11px] font-semibold text-slate-500">({leadSla.targetMinutes}m SLA Target)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                {leadSla.remainingMinutes > 0
                  ? `Inquiry received ${leadSla.elapsedMinutes} mins ago via ${leadSla.source}.`
                  : `Target breached by ${leadSla.elapsedMinutes - leadSla.targetMinutes} mins. Contact immediately!`}
              </p>
            </div>

            <div className="text-right">
              <span className={`font-mono text-xl font-black ${countdown.isOverdue ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"}`}>
                {countdown.text}
              </span>
            </div>
          </div>

          {/* Lead Info Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-slate-950 dark:text-white">{leadSla.leadName}</p>
              <p className="text-slate-600 dark:text-slate-400 font-mono text-xs mt-0.5">{leadSla.phone}</p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                Source: {leadSla.source}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Assigned: {leadSla.assignedAgentName}</p>
            </div>
          </div>

          {/* 1-Click Launch Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleLaunchWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Launch WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchCall}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Dial Phone Call</span>
            </button>
          </div>

          {/* Contact Method Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Channel Used
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                { id: "call", label: "Phone Call", icon: Phone },
                { id: "meeting", label: "In-Person", icon: User },
                { id: "note", label: "Email / Note", icon: Send },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = contactType === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setContactType(m.id as any)}
                    className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? "bg-[#EE6427] text-white border-[#EE6427] shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* First Contact Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              First Response Notes / Client Feedback
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent video walkthrough on WhatsApp, client is overseas in UK, requested callback at 8 PM PKT"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Contacted ({leadSla.elapsedMinutes}m response)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
