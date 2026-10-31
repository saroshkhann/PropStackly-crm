"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { WeeklyConversionChart } from "@/components/dashboard/WeeklyConversionChart";
import { RecentPayoutsList } from "@/components/dashboard/RecentPayoutsList";
import { TodayFollowUps } from "@/components/dashboard/TodayFollowUps";
import { UpcomingSiteVisits } from "@/components/dashboard/UpcomingSiteVisits";
import { LeadSourceChart } from "@/components/dashboard/LeadSourceChart";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { useCRM } from "@/context/CRMContext";
import { formatPKR } from "@/lib/formatters";
import {
  Users,
  UserPlus,
  Compass,
  DollarSign,
  TrendingUp,
  Download,
  Flame,
  Zap,
  Handshake,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { leads, followUps, siteVisits, currentAgent, settings, showToast } = useCRM();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  // Compute live metrics from dataset
  const activeLeads = leads.filter((l) => !l.isArchived);
  const totalLeads = activeLeads.length;
  const newLeads = activeLeads.filter((l) => l.status === "new").length;
  const pendingFollowups = followUps.filter((f) => !f.completed).length;
  const upcomingVisits = siteVisits.filter((s) => s.status === "scheduled").length;

  const totalPipelinePKR = activeLeads
    .filter((l) => l.status !== "lost")
    .reduce((acc, curr) => acc + (curr.budgetPKR || 0), 0);

  const wonDealsCount = activeLeads.filter((l) => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? ((wonDealsCount / totalLeads) * 100).toFixed(1) : "0.0";

  const handleExportDashboard = () => {
    const headers = ["Metric", "Value", "Notes"];
    const data = [
      ["Total Active Leads", totalLeads, "All acquisition channels"],
      ["New Enquiries Today", newLeads, "Awaiting first response"],
      ["Follow-ups Due", pendingFollowups, "Scheduled calls & meetings"],
      ["Site Visits Scheduled", upcomingVisits, "DHA, Bahria & Gulberg"],
      ["Active Pipeline Value", formatPKR(totalPipelinePKR, false), "Total buyer budgets"],
      ["Deal Conversion Rate", `${conversionRate}%`, `${wonDealsCount} deals closed`],
      ["Reporting Agency", settings.agencyName, `${settings.city} Head Office`],
      ["Export Date", new Date().toLocaleString(), "PropStackly CRM System"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...data.map((row) => row.map((v) => `"${v}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PropStackly_Pipeline_Summary_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded pipeline summary report (CSV).");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Editorial Header Section matching reference image ("October so far") */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight font-normal">
            October so far
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{settings?.agencyName || "Apex Properties"} {settings?.city || "Islamabad"}</span>
            <span>•</span>
            <span>{activeLeads.length} leads actively progressing.</span>
            <span className="text-[#EE6427] font-bold">✨</span>
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/speed-to-lead"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>5m SLA Active</span>
          </Link>
          <button
            onClick={handleExportDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 hover:bg-slate-50 border border-black/[0.06] dark:border-white/[0.08] rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ New Lead</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards Row (4 cards matching the reference image top row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Gross pipeline volume"
          value={formatPKR(totalPipelinePKR)}
          change="+18.2% vs. Sept"
          isPositive={true}
          subtitle="Buyer budgets"
          icon={DollarSign}
          velocityPercent={76}
          barColor="slate"
        />
        <MetricCard
          title="Active inquiries"
          value={totalLeads}
          change={`+${newLeads} new today`}
          isPositive={true}
          subtitle="Facebook & Zameen"
          icon={Users}
          velocityPercent={62}
          barColor="orange"
        />
        <MetricCard
          title="Closed transactions"
          value={wonDealsCount}
          change={`${conversionRate}% conversion`}
          isPositive={true}
          subtitle="Won deals"
          icon={Handshake}
          velocityPercent={58}
          barColor="emerald"
        />
        <MetricCard
          title="Speed-to-lead response"
          value="2.4 min"
          change="Target < 5.0m"
          isPositive={true}
          subtitle="391% boost"
          icon={Zap}
          velocityPercent={88}
          barColor="sky"
        />
      </div>

      {/* Middle Row: Acquisition Chart (2 cols) + Recent Payouts List (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 ember-card p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white tracking-tight">
                Gross Acquisition & Volume
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Incoming enquiries and closed transaction progression
              </p>
            </div>
          </div>
          <WeeklyConversionChart />
        </div>

        {/* Payouts / Deal settlements card directly from reference image */}
        <RecentPayoutsList />
      </div>

      {/* Bottom Tri-Column Row: Follow-ups, Site Visits, Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <TodayFollowUps />
        <UpcomingSiteVisits />
        <LeadSourceChart />
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
      />
    </div>
  );
}
