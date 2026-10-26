"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import {
  CalendarCheck,
  Plus,
  Phone,
  MessageSquare,
  Clock,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";
import { getWhatsAppLink, formatPhoneNumber, formatDate } from "@/lib/formatters";

export default function FollowUpsPage() {
  return (
    <AppShell>
      <FollowUpsContent />
    </AppShell>
  );
}

function FollowUpsContent() {
  const { followUps, toggleFollowUp, deleteFollowUp, addFollowUp, leads, agents, currentAgent, showToast } = useCRM();

  const [todayStr, setTodayStr] = useState("2026-10-20");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);
  const [timelineFilter, setTimelineFilter] = useState<"all" | "overdue" | "today" | "upcoming" | "completed">("today");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || "");
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("15:00");
  const [type, setType] = useState<any>("Phone Call");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<any>("high");

  const overdueList = followUps.filter((f) => !f.completed && f.scheduledDate < todayStr);
  const todayList = followUps.filter((f) => !f.completed && f.scheduledDate === todayStr);
  const upcomingList = followUps.filter((f) => !f.completed && f.scheduledDate > todayStr);
  const completedList = followUps.filter((f) => f.completed);

  const filtered = followUps.filter((f) => {
    if (timelineFilter === "overdue") return !f.completed && f.scheduledDate < todayStr;
    if (timelineFilter === "today") return !f.completed && f.scheduledDate === todayStr;
    if (timelineFilter === "upcoming") return !f.completed && f.scheduledDate > todayStr;
    if (timelineFilter === "completed") return f.completed;
    return true;
  });

  const pendingCount = overdueList.length + todayList.length + upcomingList.length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === selectedLeadId) || leads[0];
    addFollowUp({
      leadId: lead.id,
      leadName: lead.fullName,
      leadPhone: lead.phone,
      assignedAgentId: lead.assignedAgentId,
      agentName: agents.find((a) => a.id === lead.assignedAgentId)?.name || currentAgent?.name || "Assigned Consultant",
      scheduledDate: date,
      scheduledTime: time,
      type,
      notes: notes || "Regular follow-up touchpoint",
      priority,
    });
    setIsModalOpen(false);
    setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Client Relationship Management</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{pendingCount} Follow-ups Due</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-slate-100 tracking-tight">
            Follow-up Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay consistent across phone calls, WhatsApp updates, and documentation transfers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setTimelineFilter("today")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                timelineFilter === "today" ? "bg-amber-500 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Due Today</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${timelineFilter === "today" ? "bg-amber-600 text-white" : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"}`}>
                {todayList.length}
              </span>
            </button>
            <button
              onClick={() => setTimelineFilter("overdue")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                timelineFilter === "overdue" ? "bg-rose-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Overdue</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${timelineFilter === "overdue" ? "bg-rose-700 text-white" : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"}`}>
                {overdueList.length}
              </span>
            </button>
            <button
              onClick={() => setTimelineFilter("upcoming")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                timelineFilter === "upcoming" ? "bg-[#EE6427] text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Upcoming</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${timelineFilter === "upcoming" ? "bg-[#DE5518] text-white" : "bg-orange-100 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200"}`}>
                {upcomingList.length}
              </span>
            </button>
            <button
              onClick={() => setTimelineFilter("completed")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                timelineFilter === "completed" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>Completed</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${timelineFilter === "completed" ? "bg-emerald-700 text-white" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"}`}>
                {completedList.length}
              </span>
            </button>
            <button
              onClick={() => setTimelineFilter("all")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                timelineFilter === "all" ? "bg-slate-900 dark:bg-slate-800 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All ({followUps.length})
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Follow-up
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No follow-ups in this view</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {timelineFilter === "completed"
                ? "No completed tasks recorded yet."
                : "All scheduled follow-ups for this view are up to date!"}
            </p>
          </div>
        ) : (
          filtered.map((fu) => {
            const waGreeting = `Assalam-o-Alaikum ${fu.leadName}, following up regarding your property requirement with PropStackly.`;
            const waLink = getWhatsAppLink(fu.leadPhone, waGreeting);

            return (
              <div
                key={fu.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  fu.completed
                    ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75"
                    : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs"
                }`}
              >
                <button
                  onClick={() => toggleFollowUp(fu.id)}
                  className="mt-1 text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                >
                  {fu.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leads/${fu.leadId}`}
                        className={`text-sm font-bold hover:text-[#EE6427] transition-colors ${
                          fu.completed ? "line-through text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {fu.leadName}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {formatPhoneNumber(fu.leadPhone)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {fu.completed ? (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-sans font-semibold text-[10px]">
                          Completed
                        </span>
                      ) : fu.scheduledDate < todayStr ? (
                        <span className="px-2 py-0.5 rounded-sm bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-sans font-semibold text-[10px]">
                          Overdue
                        </span>
                      ) : fu.scheduledDate === todayStr ? (
                        <span className="px-2 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-sans font-semibold text-[10px]">
                          Due Today
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm bg-orange-100 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 font-sans font-semibold text-[10px]">
                          Upcoming
                        </span>
                      )}
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {fu.scheduledDate} at {fu.scheduledTime}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans font-medium text-[10px]">
                        {fu.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{fu.notes}</p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Assigned to: <strong className="text-slate-700 dark:text-slate-200">{fu.agentName}</strong>
                      </p>
                      {fu.completed && (
                        <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                          Completed {fu.completedByName ? `by ${fu.completedByName}` : ""} {fu.completedAt ? `on ${formatDate(fu.completedAt)}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${fu.leadPhone}`}
                        className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-[#EE6427] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors"
                      >
                        <Phone className="w-3 h-3 text-[#EE6427]" />
                        Call
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium transition-colors"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        WhatsApp
                      </a>
                      <button
                        onClick={() => deleteFollowUp(fu.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                        title="Delete follow-up"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Follow-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Schedule New Follow-up</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.fullName} ({l.propertyTypeInterest})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Channel</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp Message">WhatsApp Message</option>
                  <option value="In-Person Meeting">In-Person Meeting</option>
                  <option value="Documentation">Documentation / Transfer Paper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call regarding site visit feedback or counter-offer status"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-xs cursor-pointer"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
