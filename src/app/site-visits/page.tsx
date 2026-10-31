"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Building,
  Loader2,
} from "lucide-react";
import { getWhatsAppLink, formatPhoneNumber, formatPKR } from "@/lib/formatters";
import { SiteVisit } from "@/types/crm";

export default function SiteVisitsPage() {
  return (
    <AppShell>
      <SiteVisitsContent />
    </AppShell>
  );
}

function SiteVisitsContent() {
  const { siteVisits, updateSiteVisitStatus, deleteSiteVisit, addSiteVisit, leads, properties, agents, currentAgent, showToast } = useCRM();

  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackModalVisit, setFeedbackModalVisit] = useState<SiteVisit | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<SiteVisit["status"]>("completed_interested");

  const [todayStr, setTodayStr] = useState("2026-10-20");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);
  const [leadId, setLeadId] = useState(leads[0]?.id || "");
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [visitDate, setVisitDate] = useState(todayStr);
  const [visitTime, setVisitTime] = useState("16:00");
  const [notes, setNotes] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = siteVisits.filter((sv) => {
    if (filter === "scheduled") return sv.status === "scheduled";
    if (filter === "completed") return sv.status.startsWith("completed");
    return true;
  });

  const scheduledCount = siteVisits.filter((s) => s.status === "scheduled").length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (visitDate < todayStr) {
      setServerError("Cannot schedule site visits in the past.");
      return;
    }

    const lead = leads.find((l) => l.id === leadId) || leads[0];
    const prop = properties.find((p) => p.id === propertyId) || properties[0];

    setIsSubmitting(true);
    try {
      await addSiteVisit({
        leadId: lead.id,
        leadName: lead.fullName,
        leadPhone: lead.phone,
        propertyId: prop.id,
        propertyTitle: prop.title,
        propertyLocation: `${prop.location}, ${prop.society}`,
        assignedAgentId: lead.assignedAgentId,
        agentName: agents.find((a) => a.id === lead.assignedAgentId)?.name || currentAgent?.name || "Assigned Consultant",
        visitDate,
        visitTime,
        status: "scheduled",
        notes: notes || "Client property tour",
      });

      setIsModalOpen(false);
      setNotes("");
    } catch (err: any) {
      setServerError(err.message || "Failed to schedule visit. Scheduling conflict detected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackModalVisit) return;
    updateSiteVisitStatus(feedbackModalVisit.id, feedbackStatus, feedbackText);
    setFeedbackModalVisit(null);
    setFeedbackText("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight font-normal">
            Site Visits & Tours
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{scheduledCount} scheduled tours in progress</span>
            <span>•</span>
            <span>In-person client visits across DHA, Bahria Town & Gulberg.</span>
            <span className="text-[#EE6427] font-bold">✨</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === "all" ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({siteVisits.length})
            </button>
            <button
              onClick={() => setFilter("scheduled")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === "scheduled" ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === "completed" ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Schedule Site Visit</span>
          </button>
        </div>
      </div>

      {/* Grid of Site Visits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No site visits found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Book a new tour using the button above.</p>
          </div>
        ) : (
          filtered.map((visit) => {
            const waGreeting = `Assalam-o-Alaikum ${visit.leadName}, confirming our site visit to ${visit.propertyTitle} on ${visit.visitDate} at ${visit.visitTime}.`;
            const waLink = getWhatsAppLink(visit.leadPhone, waGreeting);

            const isScheduled = visit.status === "scheduled";
            const isInterested = visit.status === "completed_interested";

            return (
              <div
                key={visit.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isScheduled
                          ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
                          : isInterested
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {visit.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {visit.visitDate} • {visit.visitTime}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                    {visit.propertyTitle}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {visit.propertyLocation}
                  </p>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/leads/${visit.leadId}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#EE6427]"
                      >
                        Client: {visit.leadName}
                      </Link>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {formatPhoneNumber(visit.leadPhone)}
                      </span>
                    </div>
                    {visit.notes && (
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 italic">
                        &quot;{visit.notes}&quot;
                      </p>
                    )}
                    {visit.clientFeedback && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/50 p-2 rounded-md">
                        <strong>Client Feedback:</strong> {visit.clientFeedback}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Tour Guide: <strong className="text-slate-800 dark:text-slate-200">{visit.agentName}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${visit.leadPhone}`}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#EE6427] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      title="Call Client"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md transition-colors"
                      title="WhatsApp Location Pin"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setFeedbackModalVisit(visit);
                        setFeedbackStatus(visit.status);
                        setFeedbackText(visit.clientFeedback || "");
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                    >
                      Log Feedback
                    </button>
                    <button
                      onClick={() => deleteSiteVisit(visit.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                      title="Cancel/Delete visit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Tour Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Book Property Site Visit</h3>

            {serverError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Lead</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.fullName} ({l.propertyTypeInterest})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Property</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.society}) - {formatPKR(p.pricePKR)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Client requested developer presence or site engineer"
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? "Checking..." : "Confirm Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Feedback Modal */}
      {feedbackModalVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Tour Outcome & Feedback</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For {feedbackModalVisit.propertyTitle} with {feedbackModalVisit.leadName}
            </p>
            <form onSubmit={handleSaveFeedback} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tour Result</label>
                <select
                  value={feedbackStatus}
                  onChange={(e) => setFeedbackStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="completed_interested">Completed - Highly Interested (Ready to negotiate)</option>
                  <option value="completed_not_interested">Completed - Not Interested (Looking for alternate)</option>
                  <option value="scheduled">Scheduled (Pending visit)</option>
                  <option value="rescheduled">Client Requested Reschedule</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Client Feedback Details</label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Liked the modern architecture and street position. Disliked the lower ceiling height in basement..."
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalVisit(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-xs cursor-pointer"
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
