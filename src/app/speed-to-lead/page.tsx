"use client";

import React, { useState, useMemo, Suspense, useEffect } from "react";
import {
  Zap,
  Clock,
  ShieldAlert,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Users,
  Settings,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Volume2,
  Calendar,
  Layers,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import {
  SpeedToLeadConfig,
  LeadSLAInfo,
  SLAEscalationLog,
  AgentSLAPerformance,
  SourceSLAPerformance,
} from "@/types/sla";
import {
  defaultSpeedToLeadConfig,
  initialSlaLeads,
  initialEscalationLogs,
  initialAgentSlaStats,
  initialSourceSlaStats,
} from "@/data/slaPresets";
import { formatSLACountdown, getSLAStateBadge } from "@/lib/slaEngine";
import { SLAConfigModal } from "@/components/sla/SLAConfigModal";
import { QuickContactSLAModal } from "@/components/sla/QuickContactSLAModal";
import { SLACountdownBadge } from "@/components/sla/SLACountdownBadge";

type ActiveTab = "radar" | "agent_report" | "source_report" | "escalation_log";

function SpeedToLeadContent() {
  const { currentAgent, showToast, currentUser } = useCRM();
  const isDemo = currentUser?.email === "admin@propstackly.com";

  // State
  const [config, setConfig] = useState<SpeedToLeadConfig>(defaultSpeedToLeadConfig);
  const [slaLeads, setSlaLeads] = useState<LeadSLAInfo[]>(() => (isDemo ? initialSlaLeads : []));
  const [escalationLogs, setEscalationLogs] = useState<SLAEscalationLog[]>(() => (isDemo ? initialEscalationLogs : []));
  const [agentStats, setAgentStats] = useState<AgentSLAPerformance[]>(() => (isDemo ? initialAgentSlaStats : []));
  const [sourceStats, setSourceStats] = useState<SourceSLAPerformance[]>(() => (isDemo ? initialSourceSlaStats : []));

  // Active Tab & Filter
  const [activeTab, setActiveTab] = useState<ActiveTab>("radar");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [contactModalLead, setContactModalLead] = useState<LeadSLAInfo | null>(null);

  // Live ticking countdown effect every 10 seconds to update remaining and elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaLeads((prev) =>
        prev.map((lead) => {
          if (lead.state === "responded_on_time" || lead.state === "responded_late") {
            return lead;
          }
          const newElapsed = Number((lead.elapsedMinutes + 0.1).toFixed(1));
          const newRemaining = Math.max(0, Number((lead.targetMinutes - newElapsed).toFixed(1)));

          let newState = lead.state;
          let newManagerAlerted = lead.isManagerAlerted;
          let newReassigned = lead.isReassigned;

          if (config.autoReassignEnabled && newElapsed >= config.autoReassignMinutes) {
            newState = "reassigned";
            newReassigned = true;
            newManagerAlerted = true;
          } else if (newElapsed >= config.managerEscalationMinutes) {
            newState = "escalated";
            newManagerAlerted = true;
          } else if (newElapsed >= lead.targetMinutes) {
            newState = "breached";
          } else if (newElapsed >= config.agentWarningMinutes) {
            newState = "warning";
          }

          return {
            ...lead,
            elapsedMinutes: newElapsed,
            remainingMinutes: newRemaining,
            state: newState,
            isManagerAlerted: newManagerAlerted,
            isReassigned: newReassigned,
          };
        })
      );
    }, 10000);

    return () => clearInterval(timer);
  }, [config]);

  // Aggregate Metrics
  const activeUnresponded = useMemo(
    () =>
      slaLeads.filter(
        (l) => l.state !== "responded_on_time" && l.state !== "responded_late"
      ),
    [slaLeads]
  );

  const avgAgencyResponseTime = useMemo(() => {
    const responded = slaLeads.filter((l) => l.firstResponseMinutes !== undefined);
    if (responded.length === 0) return 3.8;
    const total = responded.reduce((sum, l) => sum + (l.firstResponseMinutes || 0), 0);
    return Number((total / responded.length).toFixed(1));
  }, [slaLeads]);

  const slaCompliancePct = useMemo(() => {
    const responded = slaLeads.filter((l) => l.firstResponseMinutes !== undefined);
    if (responded.length === 0) return 91.2;
    const met = responded.filter((l) => l.state === "responded_on_time").length;
    return Number(((met / responded.length) * 100).toFixed(1));
  }, [slaLeads]);

  const atRiskCount = useMemo(
    () => activeUnresponded.filter((l) => l.state === "warning" || l.state === "breached" || l.state === "escalated").length,
    [activeUnresponded]
  );

  // Handlers
  const handleSaveConfig = (newConfig: SpeedToLeadConfig) => {
    setConfig(newConfig);
    showToast("Speed-to-Lead SLA policy updated successfully!", "success");
  };

  const handleOpenContactModal = (lead: LeadSLAInfo) => {
    setContactModalLead(lead);
  };

  const handleLogContactSuccess = (
    leadId: string,
    contactType: "call" | "whatsapp" | "meeting" | "note",
    notes: string,
    responseMinutes: number
  ) => {
    const target = config.firstResponseTargetMinutes;
    const isMet = responseMinutes <= target;

    // 1. Update lead SLA
    setSlaLeads((prev) =>
      prev.map((l) =>
        l.leadId === leadId
          ? {
              ...l,
              state: isMet ? "responded_on_time" : "responded_late",
              firstResponseAt: new Date().toISOString(),
              firstResponseMinutes: responseMinutes,
              firstResponseType: contactType,
              remainingMinutes: 0,
            }
          : l
      )
    );

    // 2. Add log entry
    const targetLead = slaLeads.find((l) => l.leadId === leadId);
    if (targetLead) {
      const newLog: SLAEscalationLog = {
        id: `log-${Date.now()}`,
        leadId,
        leadName: targetLead.leadName,
        leadPhone: targetLead.phone,
        source: targetLead.source,
        agentId: targetLead.assignedAgentId,
        agentName: targetLead.assignedAgentName,
        eventType: "sla_met",
        timestamp: new Date().toISOString(),
        targetMinutes: target,
        elapsedMinutes: responseMinutes,
        message: `First contact logged via ${contactType.toUpperCase()} in ${responseMinutes.toFixed(1)} mins. SLA target ${isMet ? "achieved ✓" : "missed"}`,
      };
      setEscalationLogs((prev) => [newLog, ...prev]);
    }

    // 3. Update agent stats
    if (targetLead) {
      setAgentStats((prev) =>
        prev.map((a) =>
          a.agentId === targetLead.assignedAgentId
            ? {
                ...a,
                respondedCount: a.respondedCount + 1,
                targetMetCount: isMet ? a.targetMetCount + 1 : a.targetMetCount,
                complianceRate: Number(
                  (
                    ((isMet ? a.targetMetCount + 1 : a.targetMetCount) /
                      (a.respondedCount + 1)) *
                    100
                  ).toFixed(1)
                ),
              }
            : a
        )
      );
    }

    showToast(
      isMet
        ? `⚡ Great job! First response logged in ${responseMinutes.toFixed(1)} mins (SLA Met)`
        : `First response logged in ${responseMinutes.toFixed(1)} mins.`,
      isMet ? "success" : "info"
    );
  };

  const handleManualReassign = (leadId: string) => {
    // Reassign to Ayesha Khan
    setSlaLeads((prev) =>
      prev.map((l) =>
        l.leadId === leadId
          ? {
              ...l,
              assignedAgentId: "agent-2",
              assignedAgentName: "Ayesha Khan",
              state: "reassigned",
              isReassigned: true,
              reassignedFromAgentName: l.assignedAgentName,
              reassignedAt: new Date().toISOString(),
            }
          : l
      )
    );

    const targetLead = slaLeads.find((l) => l.leadId === leadId);
    if (targetLead) {
      const newLog: SLAEscalationLog = {
        id: `log-${Date.now()}`,
        leadId,
        leadName: targetLead.leadName,
        leadPhone: targetLead.phone,
        source: targetLead.source,
        agentId: targetLead.assignedAgentId,
        agentName: targetLead.assignedAgentName,
        eventType: "auto_reassign",
        timestamp: new Date().toISOString(),
        targetMinutes: targetLead.targetMinutes,
        elapsedMinutes: targetLead.elapsedMinutes,
        reassignedToAgentName: "Ayesha Khan",
        message: `Manual escalation hand-off from ${targetLead.assignedAgentName} to Ayesha Khan.`,
      };
      setEscalationLogs((prev) => [newLog, ...prev]);
    }

    showToast("Lead successfully reassigned to Ayesha Khan!", "success");
  };

  // Filtered Leads for Radar
  const filteredRadarLeads = useMemo(() => {
    return slaLeads.filter((l) => {
      if (statusFilter === "active" && (l.state === "responded_on_time" || l.state === "responded_late")) {
        return false;
      }
      if (statusFilter === "warning" && l.state !== "warning") return false;
      if (statusFilter === "breached" && (l.state !== "breached" && l.state !== "escalated")) return false;
      if (statusFilter === "responded" && l.state !== "responded_on_time" && l.state !== "responded_late") {
        return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.leadName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.source.toLowerCase().includes(q) ||
        l.assignedAgentName.toLowerCase().includes(q)
      );
    });
  }, [slaLeads, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Speed-to-Lead SLA & Escalation
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] border border-orange-200 dark:border-orange-800 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>{config.firstResponseTargetMinutes}m Target SLA</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time inquiry monitoring, agent warning timers, automated manager escalations, and per-agent/source response reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Policy</span>
          </button>
        </div>
      </div>

      {/* SLA Policy Summary Ribbon */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-orange-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 dark:text-slate-400">1st Response Target:</span>
            <span className="font-bold text-slate-950 dark:text-white font-mono">
              {config.firstResponseTargetMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-4">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-slate-600 dark:text-slate-400">Agent Warning:</span>
            <span className="font-bold text-slate-950 dark:text-white font-mono">
              {config.agentWarningMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-4">
            <span className="w-3 h-3 rounded-full bg-purple-600"></span>
            <span className="text-slate-600 dark:text-slate-400">Manager Alert:</span>
            <span className="font-bold text-slate-950 dark:text-white font-mono">
              {config.managerEscalationMinutes} Minutes
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-700 pl-4">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 dark:text-slate-400">Auto-Reassign:</span>
            <span className="font-bold text-slate-950 dark:text-white font-mono">
              {config.autoReassignEnabled ? `${config.autoReassignMinutes}m (${config.reassignStrategy})` : "Disabled"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          className="text-xs font-bold text-[#EE6427] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <span>Edit Policy Rules</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Response Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Agency Avg Response Time</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {avgAgencyResponseTime} mins
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Target: &lt; {config.firstResponseTargetMinutes} mins</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-[#EE6427] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">SLA Compliance Rate</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {slaCompliancePct}%
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Contacted under {config.firstResponseTargetMinutes}m target
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Active Inflow / At Risk */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Inquiries (Timers Active)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeUnresponded.length} Leads
            </p>
            <p className={`text-[11px] font-semibold mt-0.5 ${atRiskCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {atRiskCount > 0 ? `⚠️ ${atRiskCount} at risk or breached` : "All on track"}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${atRiskCount > 0 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Auto-Reassignments */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Auto-Reassigned Due to Delay</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {slaLeads.filter((l) => l.isReassigned).length} Saved
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Prevented lead loss from inactive agents
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("radar")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "radar"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Live Inflow Radar ({activeUnresponded.length} Active)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("agent_report")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "agent_report"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Response-Time Report Per Agent</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("source_report")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "source_report"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Response-Time Report Per Source</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("escalation_log")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "escalation_log"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Escalation Log ({escalationLogs.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search lead, agent, source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
          />
        </div>
      </div>

      {/* TAB 1: LIVE INFLOW RADAR */}
      {activeTab === "radar" && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Enquiries" },
              { id: "active", label: "Active Timers Only" },
              { id: "warning", label: "⚠️ Approaching SLA Warning" },
              { id: "breached", label: "🚨 Breached / Manager Alert" },
              { id: "responded", label: "✓ Responded" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-[#EE6427] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRadarLeads.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No active lead SLA timers</p>
                <p className="text-[11px] text-slate-400 mt-1">When new enquiries arrive from Facebook, WhatsApp, or Portals, their speed-to-lead timer starts here.</p>
              </div>
            ) : (
              filteredRadarLeads.map((lead) => {
              const badge = getSLAStateBadge(lead.state);
              const countdown = formatSLACountdown(lead.remainingMinutes, lead.elapsedMinutes, lead.targetMinutes);
              const isFinished = lead.state === "responded_on_time" || lead.state === "responded_late";

              return (
                <div
                  key={lead.leadId}
                  className={`rounded-2xl border p-4.5 bg-white dark:bg-slate-900 shadow-xs transition-all flex flex-col justify-between ${
                    lead.state === "escalated"
                      ? "border-purple-300 dark:border-purple-800 shadow-md ring-1 ring-purple-400/30"
                      : lead.state === "warning"
                      ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div>
                    {/* Top Status & Countdown */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${badge.dotColor}`}></span>
                        <span className={`font-bold text-xs ${badge.textColor}`}>{badge.label}</span>
                      </div>
                      <SLACountdownBadge sla={lead} />
                    </div>

                    {/* Lead Bio */}
                    <div className="mt-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {lead.leadName}
                          </h3>
                          <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {lead.phone}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {lead.source}
                        </span>
                      </div>

                      {/* Escalation or Reassignment Notice */}
                      {lead.isReassigned && (
                        <div className="mt-2.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-300 flex items-center justify-between">
                          <span>Auto-reassigned from {lead.reassignedFromAgentName}</span>
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                      )}

                      {lead.isManagerAlerted && !lead.isReassigned && (
                        <div className="mt-2.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-300 flex items-center justify-between">
                          <span>Manager Alert Dispatched</span>
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                      )}

                      {/* Assignment & Elapsed Time Details */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>Assigned Agent:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {lead.assignedAgentName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Elapsed Since Inflow:</span>
                          <span className="font-mono font-medium text-slate-900 dark:text-slate-200">
                            {lead.elapsedMinutes} mins
                          </span>
                        </div>
                        {isFinished && (
                          <div className="flex items-center justify-between text-emerald-600 font-semibold">
                            <span>First Response Time:</span>
                            <span>{lead.firstResponseMinutes?.toFixed(1)} mins ({lead.firstResponseType})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {!isFinished ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenContactModal(lead)}
                          className="flex-1 py-1.5 px-3 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Log Contact (Stop SLA)</span>
                        </button>

                        {lead.state === "escalated" && (
                          <button
                            type="button"
                            onClick={() => handleManualReassign(lead.leadId)}
                            className="py-1.5 px-2.5 text-xs font-medium rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors cursor-pointer"
                            title="Reassign to another agent"
                          >
                            Reassign
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full text-center py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                        ✓ Response Completed ({lead.firstResponseMinutes?.toFixed(1)}m)
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* TAB 2: RESPONSE-TIME REPORT PER AGENT */}
      {activeTab === "agent_report" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Speed-to-Lead Response Ranking Per Agent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance metrics for first response time against the {config.firstResponseTargetMinutes}-minute SLA target
              </p>
            </div>
            <span className="text-xs font-bold text-[#EE6427]">
              Ranked by Fastest Response Speed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Sales Agent</th>
                  <th className="py-3 px-4 text-center">Total Enquiries</th>
                  <th className="py-3 px-4 text-center">Avg Response Time</th>
                  <th className="py-3 px-4 text-center">SLA Compliance %</th>
                  <th className="py-3 px-4 text-center">Warnings</th>
                  <th className="py-3 px-4 text-center">SLA Breaches</th>
                  <th className="py-3 px-4 text-center">Auto-Reassigned Out</th>
                  <th className="py-3 px-4 text-center">Speed Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {agentStats.map((agent) => {
                  const isUnder5 = agent.avgResponseMinutes <= 5.0;
                  return (
                    <tr key={agent.agentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar}
                            alt={agent.agentName}
                            className="w-9 h-9 rounded-full object-cover border"
                          />
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">{agent.agentName}</p>
                            <p className="text-[11px] text-slate-500">{agent.agentRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {agent.totalLeads}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-md ${
                            isUnder5
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : agent.avgResponseMinutes <= 10
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {agent.avgResponseMinutes}m
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full ${
                                agent.complianceRate >= 90
                                  ? "bg-emerald-500"
                                  : agent.complianceRate >= 75
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${agent.complianceRate}%` }}
                            ></div>
                          </div>
                          <span className="font-bold font-mono">{agent.complianceRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                        {agent.warningCount}
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600 font-bold">
                        {agent.breachCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {agent.reassignedOutCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            {agent.reassignedOutCount} leads lost
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            agent.rating.includes("Elite")
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                              : agent.rating.includes("Good")
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {agent.rating}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESPONSE-TIME REPORT PER SOURCE */}
      {activeTab === "source_report" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Lead Channel Speed-to-Contact Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identifying which marketing channels receive rapid response vs where leads risk going cold
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Inquiry Source</th>
                    <th className="py-3 px-4 text-center">Total Inflow</th>
                    <th className="py-3 px-4 text-center">Avg Response Time</th>
                    <th className="py-3 px-4 text-center">SLA Compliance %</th>
                    <th className="py-3 px-4 text-center">Fastest Response</th>
                    <th className="py-3 px-4 text-center">Slowest Response</th>
                    <th className="py-3 px-4 text-center">Lead Loss Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {sourceStats.map((src) => (
                    <tr key={src.source} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-slate-950 dark:text-white">
                        {src.source}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {src.totalLeads} leads
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-sm text-orange-600">
                          {src.avgResponseMinutes} mins
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold font-mono">{src.complianceRate}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-600 font-mono">
                        {src.fastestMinutes}m
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600 font-mono">
                        {src.slowestMinutes}m
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            src.riskLevel === "Low"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : src.riskLevel === "Medium"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {src.riskLevel} Drop-off Risk
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic Insight Box */}
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 text-xs space-y-1">
            <span className="font-bold text-orange-950 dark:text-orange-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#EE6427]" />
              <span>Conversion Impact Insight:</span>
            </span>
            <p className="text-orange-900 dark:text-orange-300/90 leading-relaxed">
              Leads contacted under 5 minutes on WhatsApp and Facebook convert at <strong>391% higher frequency</strong> than leads contacted after 30 minutes. Setting a strict 5-minute escalation policy guarantees real estate agents reach buyers before they click on competing Zameen.com listings.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: ESCALATION LOG */}
      {activeTab === "escalation_log" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Chronological SLA Warning & Escalation Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete historical record of warnings triggered, manager alerts, and automatic hand-offs
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {escalationLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.eventType === "auto_reassign"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : log.eventType === "manager_alert"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                          : log.eventType === "warning"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {log.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{log.leadName}</span>
                    <span className="text-slate-400 font-mono">({log.leadPhone})</span>
                    <span className="text-slate-500 font-medium">via {log.source}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{log.message}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-slate-500 text-[11px] block">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Elapsed: {log.elapsedMinutes.toFixed(1)}m (Target: {log.targetMinutes}m)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLA Policy Modal */}
      <SLAConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      {/* Quick Contact & Stop Timer Modal */}
      <QuickContactSLAModal
        isOpen={!!contactModalLead}
        onClose={() => setContactModalLead(null)}
        leadSla={contactModalLead}
        onLogContactSuccess={handleLogContactSuccess}
      />
    </div>
  );
}

export default function SpeedToLeadPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Speed-to-Lead SLA Suite...</div>}>
        <SpeedToLeadContent />
      </Suspense>
    </AppShell>
  );
}
