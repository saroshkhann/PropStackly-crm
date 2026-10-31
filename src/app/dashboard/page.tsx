"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LeadSourceChart } from "@/components/dashboard/LeadSourceChart";
import { WeeklyConversionChart } from "@/components/dashboard/WeeklyConversionChart";
import { TodayFollowUps } from "@/components/dashboard/TodayFollowUps";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { UpcomingSiteVisits } from "@/components/dashboard/UpcomingSiteVisits";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { useCRM } from "@/context/CRMContext";
import { formatPKR } from "@/lib/formatters";
import {
  Users,
  UserPlus,
  CalendarCheck,
  Compass,
  DollarSign,
  TrendingUp,
  Download,
  Building,
  Sparkles,
  PhoneCall,
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#EE6427] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#EE6427] animate-pulse" />
            PropStackly Real Estate Operating System
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
            Welcome back, {currentAgent?.name || "Principal Broker"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {settings?.agencyName || "Real Estate Agency"} • {settings?.city || "Islamabad"} Portfolio Overview
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportDashboard}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Summary
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-md shadow-[#EE6427]/25 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            + New Lead
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          change="+18%"
          isPositive={true}
          subtitle="All active channels"
          icon={Users}
          iconColor="text-[#EE6427]"
          iconBg="bg-orange-50 dark:bg-orange-950/40"
        />
        <MetricCard
          title="New Enquiries"
          value={newLeads}
          change="+6 today"
          isPositive={true}
          subtitle="Awaiting response"
          icon={UserPlus}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MetricCard
          title="Follow-ups Due"
          value={pendingFollowups}
          change="3 Overdue"
          isPositive={false}
          subtitle="Phone & WhatsApp"
          icon={CalendarCheck}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <MetricCard
          title="Site Visits"
          value={upcomingVisits}
          change="2 this week"
          isPositive={true}
          subtitle="DHA & Bahria"
          icon={Compass}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <MetricCard
          title="Pipeline Volume"
          value={formatPKR(totalPipelinePKR)}
          change="+PKR 8.2 Cr"
          isPositive={true}
          subtitle="Active buyer interest"
          icon={DollarSign}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          change="+2.4%"
          isPositive={true}
          subtitle={`${wonDealsCount} deals closed`}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Weekly Lead Acquisition & Site Visits
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily volume of incoming buyer enquiries vs. scheduled tours
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EE6427]" />
                Enquiries
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Site Visits
              </span>
            </div>
          </div>
          <WeeklyConversionChart />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Enquiries by Lead Source
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Facebook Ads, Zameen.com & WhatsApp marketing attribution
            </p>
          </div>
          <LeadSourceChart />
        </div>
      </div>

      {/* Actionable Tri-Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TodayFollowUps />
        <UpcomingSiteVisits />
        <RecentActivityFeed />
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
      />
    </div>
  );
}
