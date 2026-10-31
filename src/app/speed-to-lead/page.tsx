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
  User,
  Building2,
  Globe,
  Share2,
  Check,
  Sparkles,
  ChevronRight,
  ShieldCheck,
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

function getSourceBadge(source: string) {
  const s = source.toLowerCase();
  if (s.includes("whatsapp")) {
    return {
      label: "WhatsApp",
      icon: MessageSquare,
      className: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    };
  }
  if (s.includes("facebook") || s.includes("meta") || s.includes("insta")) {
    return {
      label: source,
      icon: Share2,
      className: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      dot: "bg-blue-500",
    };
  }
  if (s.includes("zameen")) {
    return {
      label: "Zameen.com",
      icon: Building2,
      className: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      dot: "bg-rose-500",
    };
  }
  if (s.includes("referral")) {
    return {
      label: "Referral",
      icon: Users,
      className: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      dot: "bg-purple-500",
    };
  }
  return {
    label: source,
    icon: Globe,
    className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  };
}

function SpeedToLeadContent() {
  const { currentAgent, showToast, currentUser, settings } = useCRM();
  const isDemo = currentUser?.email === "admin@propstackly.com" || !currentUser;

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

  const warningCount = useMemo(
    () => activeUnresponded.filter((l) => l.state === "warning").length,
    [activeUnresponded]
  );

  const breachedCount = useMemo(
    () => activeUnresponded.filter((l) => l.state === "breached" || l.state === "escalated" || l.state === "reassigned").length,
    [activeUnresponded]
  );

  const respondedCount = useMemo(
    () => slaLeads.filter((l) => l.state === "responded_on_time" || l.state === "responded_late").length,
    [slaLeads]
  );

  // Handlers
  const handleSaveConfig = (newConfig: SpeedToLeadConfig) => {
    setConfig(newConfig);
    showToast("Speed-to-Lead SLA policy updated successfully!", "success");
  };

  const handleOpenContactModal = (lead: LeadSLAInfo) => {
    setContactModalLead(lead);
  };

  const handleQuickWhatsApp = (lead: LeadSLAInfo) => {
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const agentName = currentAgent?.name || lead.assignedAgentName || "PropStackly Agent";
    const agencyName = settings.agencyName || "Apex Properties";
    const waMessage =
      `Assalam-o-Alaikum *${lead.leadName}*,\n\n` +
      `Thank you for reaching out via *${lead.source}* regarding property opportunities.\n\n` +
      `I am *${agentName}* from *${agencyName}*. When would be a good time for a quick 2-minute call to discuss available listings and quotation?\n\n` +
      `Looking forward to assisting you!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`, "_blank");
    handleOpenContactModal(lead);
  };

  const handleQuickCall = (lead: LeadSLAInfo) => {
    window.open(`tel:${lead.phone}`, "_self");
    handleOpenContactModal(lead);
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
      if (statusFilter === "breached" && (l.state !== "breached" && l.state !== "escalated" && l.state !== "reassigned")) return false;
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight font-normal">
            Speed-to-Lead SLA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>5-minute first response guarantee</span>
            <span>•</span>
            <span>Live inquiry monitoring, automated escalation & agent scorecards.</span>
            <span className="text-[#EE6427] font-bold">✨</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 hover:bg-slate-50 border border-black/[0.06] dark:border-white/[0.08] rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Configure Policy Rules</span>
          </button>
        </div>
      </div>

      {/* SLA Policy Summary Ribbon */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></span>
            <span className="text-slate-400">1st Response Target:</span>
            <span className="font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
              {config.firstResponseTargetMinutes} Mins
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-6">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-slate-400">Agent Warning:</span>
            <span className="font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
              {config.agentWarningMinutes} Mins
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-6">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span className="text-slate-400">Manager Alert:</span>
            <span className="font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
              {config.managerEscalationMinutes} Mins
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-6">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span className="text-slate-400">Auto-Reassign:</span>
            <span className="font-bold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
              {config.autoReassignEnabled ? `${config.autoReassignMinutes}m (${config.reassignStrategy})` : "Disabled"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          className="text-xs font-bold text-[#EE6427] hover:text-orange-400 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>Modify Thresholds</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Response Time */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Agency Avg Response Time</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
              {avgAgencyResponseTime} mins
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target: &lt; {config.firstResponseTargetMinutes}m benchmark</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#EE6427] border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-[#EE6427]" />
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">SLA Compliance Rate</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tracking-tight">
              {slaCompliancePct}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Contacted under {config.firstResponseTargetMinutes}m window
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Active Inflow / At Risk */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Radar Inflow</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
              {activeUnresponded.length} Leads
            </p>
            <p className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${atRiskCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {atRiskCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{atRiskCount} at risk or breached</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All timers safely on track</span>
                </>
              )}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${atRiskCount > 0 ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200/60 dark:border-rose-900/40" : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200/60 dark:border-blue-900/40"}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Auto-Reassignments */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leads Rescued & Reassigned</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono tracking-tight">
              {slaLeads.filter((l) => l.isReassigned).length} Saved
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Zero lead loss from delayed agents
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Modern Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("radar")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === "radar"
                ? "bg-[#EE6427] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === "radar" ? "text-white" : "text-orange-500"}`} />
            <span>Live Radar</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "radar" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
              {activeUnresponded.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("agent_report")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === "agent_report"
                ? "bg-[#EE6427] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Agent Scorecard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("source_report")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === "source_report"
                ? "bg-[#EE6427] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Channel Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("escalation_log")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === "escalation_log"
                ? "bg-[#EE6427] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-500" />
            <span>Escalation Log</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "escalation_log" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
              {escalationLogs.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search lead, phone, agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LIVE INFLOW RADAR */}
      {activeTab === "radar" && (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Inquiries", count: slaLeads.length },
              { id: "active", label: "⚡ Active Timers", count: activeUnresponded.length },
              { id: "warning", label: "⚠️ Approaching Warning", count: warningCount },
              { id: "breached", label: "🚨 Breached / Alerted", count: breachedCount },
              { id: "responded", label: "✓ Responded", count: respondedCount },
            ].map((f) => {
              const isSelected = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Radar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredRadarLeads.length === 0 ? (
              <div className="col-span-full py-16 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-40 animate-pulse" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching inquiry timers found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  When new prospective buyers arrive via Facebook Ads, WhatsApp, or Portals, their speed-to-lead SLA countdown starts here instantly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredRadarLeads.map((lead) => {
                const badge = getSLAStateBadge(lead.state);
                const sourceBadge = getSourceBadge(lead.source);
                const SourceIcon = sourceBadge.icon;
                const isFinished = lead.state === "responded_on_time" || lead.state === "responded_late";

                // Progress calculation
                const progressPct = Math.min(100, Math.round((lead.elapsedMinutes / lead.targetMinutes) * 100));

                return (
                  <div
                    key={lead.leadId}
                    className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative ${
                      lead.state === "escalated"
                        ? "border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20"
                        : lead.state === "warning"
                        ? "border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                        : lead.state === "breached"
                        ? "border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20"
                        : isFinished
                        ? "border-slate-200 dark:border-slate-800 opacity-90"
                        : "border-slate-200/90 dark:border-slate-800"
                    }`}
                  >
                    {/* Top Colored Accent Stripe */}
                    <div
                      className={`h-1.5 w-full ${
                        lead.state === "safe"
                          ? "bg-emerald-500"
                          : lead.state === "warning"
                          ? "bg-amber-500"
                          : lead.state === "escalated"
                          ? "bg-purple-600"
                          : lead.state === "reassigned"
                          ? "bg-blue-500"
                          : lead.state === "breached"
                          ? "bg-rose-500"
                          : "bg-slate-400"
                      }`}
                    />

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      {/* Top Header Row: Status & Countdown Badge */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${badge.dotColor}`} />
                          <span className={`font-bold text-xs ${badge.textColor}`}>{badge.label}</span>
                        </div>
                        <SLACountdownBadge sla={lead} />
                      </div>

                      {/* Lead Bio & Phone */}
                      <div className="mt-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-950 dark:text-white truncate">
                              {lead.leadName}
                            </h3>
                            <a
                              href={`tel:${lead.phone}`}
                              className="font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-[#EE6427] flex items-center gap-1.5 mt-0.5 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                            </a>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border shrink-0 ${sourceBadge.className}`}
                          >
                            <SourceIcon className="w-3 h-3" />
                            <span>{sourceBadge.label}</span>
                          </span>
                        </div>

                        {/* Special Notices: Reassigned or Manager Alerted */}
                        {lead.isReassigned && (
                          <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Reassigned from {lead.reassignedFromAgentName}</span>
                            </span>
                            <span className="text-[10px] text-blue-600 font-mono font-bold">Auto-Handed Off</span>
                          </div>
                        )}

                        {lead.isManagerAlerted && !lead.isReassigned && (
                          <div className="mt-3 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-200 flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                              <span>Manager Alert Dispatched</span>
                            </span>
                            <span className="text-[10px] text-purple-600 font-mono font-bold">High Priority</span>
                          </div>
                        )}

                        {/* Visual SLA Progress Bar */}
                        {!isFinished && (
                          <div className="mt-3.5 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              <span>Elapsed: {lead.elapsedMinutes}m</span>
                              <span>Target: {lead.targetMinutes}m</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  lead.elapsedMinutes >= lead.targetMinutes
                                    ? "bg-rose-500"
                                    : lead.elapsedMinutes >= config.agentWarningMinutes
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, progressPct)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Assignment Details */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Assigned Agent:</span>
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center">
                                {lead.assignedAgentName.charAt(0)}
                              </span>
                              <span>{lead.assignedAgentName}</span>
                            </span>
                          </div>

                          {isFinished && (
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                              <span>First Response Recorded:</span>
                              <span className="font-mono font-bold">
                                {lead.firstResponseMinutes?.toFixed(1)} mins ({lead.firstResponseType})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Multi-Action Fast Response Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {!isFinished ? (
                          <div className="flex items-center gap-2">
                            {/* 1-Click WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickWhatsApp(lead)}
                              className="flex-1 py-2 px-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              title="1-Click WhatsApp greeting"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            {/* 1-Click Direct Call */}
                            <button
                              type="button"
                              onClick={() => handleQuickCall(lead)}
                              className="py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Direct phone dialer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Call</span>
                            </button>

                            {/* Log Response / Stop Timer */}
                            <button
                              type="button"
                              onClick={() => handleOpenContactModal(lead)}
                              className="py-2 px-3 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Stop SLA timer and enter notes"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Log Done</span>
                            </button>

                            {/* Reassign Button if Escalated */}
                            {lead.state === "escalated" && (
                              <button
                                type="button"
                                onClick={() => handleManualReassign(lead.leadId)}
                                className="py-2 px-2.5 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors cursor-pointer shrink-0"
                                title="Reassign to another available agent"
                              >
                                Reassign
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                            <span className="font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Response Logged in {lead.firstResponseMinutes?.toFixed(1)}m</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/60 dark:bg-emerald-800/40 px-2 py-0.5 rounded-md">
                              {lead.firstResponseType || "Contacted"}
                            </span>
                          </div>
                        )}
                      </div>
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
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Speed-to-Lead Response Ranking Per Agent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance metrics for first response time against the {config.firstResponseTargetMinutes}-minute SLA target
              </p>
            </div>
            <span className="text-xs font-bold text-[#EE6427] bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900">
              Ranked by Fastest Response Speed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Sales Agent</th>
                  <th className="py-3 px-4 text-center">Total Inquiries</th>
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
                    <tr key={agent.agentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar}
                            alt={agent.agentName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">{agent.agentName}</p>
                            <p className="text-[11px] text-slate-500">{agent.agentRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white font-mono">
                        {agent.totalLeads}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
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
                            />
                          </div>
                          <span className="font-bold font-mono">{agent.complianceRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-amber-600 font-bold font-mono">
                        {agent.warningCount}
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600 font-bold font-mono">
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
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white font-mono">
                        {src.totalLeads} leads
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                          {src.avgResponseMinutes} mins
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {src.complianceRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-600 font-mono font-bold">
                        {src.fastestMinutes}m
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600 font-mono font-bold">
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
          <div className="p-4.5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 text-xs space-y-1.5">
            <span className="font-bold text-orange-950 dark:text-orange-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#EE6427] fill-[#EE6427]" />
              <span>Conversion Impact Insight:</span>
            </span>
            <p className="text-orange-900/90 dark:text-orange-300/90 leading-relaxed">
              Leads contacted under 5 minutes on WhatsApp and Facebook convert at <strong>391% higher frequency</strong> than leads contacted after 30 minutes. Setting a strict 5-minute escalation policy guarantees real estate agents reach prospective buyers before they click on competing listings.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: ESCALATION AUDIT LOG */}
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
              <div key={log.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 flex items-start justify-between gap-4 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                  <span className="text-[10px] text-slate-400 font-mono">
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
