"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  Building,
  Phone,
  MessageCircle,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Percent,
  ShieldCheck,
  FileText,
  Sparkles,
  Calculator,
} from "lucide-react";
import { InstallmentPlan, InstallmentMilestone, MilestoneStatus } from "@/types/installment";
import { INITIAL_INSTALLMENT_PLANS } from "@/data/installmentPresets";
import { InstallmentPlanModal } from "@/components/installments/InstallmentPlanModal";
import { InstallmentVoucherModal } from "@/components/installments/InstallmentVoucherModal";
import { formatPKR } from "@/lib/formatters";
import { pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

export default function InstallmentPlansPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold">Loading Installment Plans...</div>}>
        <InstallmentPlansContent />
      </Suspense>
    </AppShell>
  );
}

function InstallmentPlansContent() {
  const { showToast, currentUser } = useCRM();
  const isDemo = currentUser?.email === "admin@propstackly.com";
  const storageKey = `propstackly_installments_${currentUser?.agency_id || "demo"}`;

  // State
  const [plans, setPlots] = useState<InstallmentPlan[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return isDemo ? INITIAL_INSTALLMENT_PLANS : [];
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => (isDemo ? INITIAL_INSTALLMENT_PLANS[0]?.id || "" : ""));
  const [search, setSearch] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser?.agency_id) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(plans));
      } catch {}
    }
  }, [plans, storageKey, currentUser?.agency_id]);

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedMilestoneForVoucher, setSelectedMilestoneForVoucher] = useState<{
    plan: InstallmentPlan;
    milestone: InstallmentMilestone;
  } | null>(null);

  // Active selected plan
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  }, [plans, selectedPlanId]);

  // Overall Recovery Analytics
  const analytics = useMemo(() => {
    let totalPortfolioPKR = 0;
    let totalCollectedPKR = 0;
    let totalOverduePKR = 0;
    let totalDueNext30DaysPKR = 0;
    let totalCommissionUnlockedPKR = 0;

    plans.forEach((plan) => {
      totalPortfolioPKR += plan.totalPricePKR;

      plan.milestones.forEach((m) => {
        if (m.status === "paid") {
          totalCollectedPKR += m.amountPKR;
          if (m.commissionReleased) {
            totalCommissionUnlockedPKR += m.developerCommissionPKR;
          }
        } else if (m.status === "overdue") {
          totalOverduePKR += m.amountPKR;
        } else if (m.status === "due_soon") {
          totalDueNext30DaysPKR += m.amountPKR;
        }
      });
    });

    const recoveryRate = totalPortfolioPKR > 0 ? (totalCollectedPKR / totalPortfolioPKR) * 100 : 0;

    return {
      totalPortfolioPKR,
      totalCollectedPKR,
      recoveryRate,
      totalOverduePKR,
      totalDueNext30DaysPKR,
      totalCommissionUnlockedPKR,
    };
  }, [plans]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (selectedProject !== "all" && plan.projectName !== selectedProject) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = plan.clientName.toLowerCase().includes(q);
        const matchesFile = plan.unitOrFileNumber.toLowerCase().includes(q);
        const matchesProject = plan.projectName.toLowerCase().includes(q);
        if (!matchesName && !matchesFile && !matchesProject) return false;
      }
      return true;
    });
  }, [plans, selectedProject, search]);

  // Unique project names for filter dropdown
  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(plans.map((p) => p.projectName)));
  }, [plans]);

  // Handle Mark Milestone as Paid
  const handleMarkAsPaid = (planId: string, milestoneId: string) => {
    setPlots((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;

        const updatedMilestones = plan.milestones.map((m) => {
          if (m.id !== milestoneId) return m;

          return {
            ...m,
            status: "paid" as MilestoneStatus,
            paidDate: new Date().toISOString().split("T")[0],
            paidAmountPKR: m.amountPKR,
            paymentMode: "Online Raast / IBFT" as const,
            instrumentReference: `RAAST-${Math.floor(100000 + Math.random() * 900000)}`,
            receiptNumber: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
            commissionReleased: m.developerCommissionPercent > 0,
          };
        });

        return { ...plan, milestones: updatedMilestones, updatedAt: new Date().toISOString() };
      })
    );

    showToast("Installment marked as Paid! Ledger updated.", "success");
  };

  // WhatsApp Payment Reminder Generator
  const handleSendWhatsAppReminder = (plan: InstallmentPlan, milestone: InstallmentMilestone) => {
    const isOverdue = milestone.status === "overdue";
    const lateFeeNotice = isOverdue
      ? `⚠️ *Late Notice*: A developer late surcharge of ${plan.lateFeeMonthlyPercent}% per month is applicable after grace period.\n`
      : "";

    const message =
      `Assalam-o-Alaikum *${plan.clientName}* sb,\n\n` +
      `📌 *Installment Recovery Notice - ${plan.projectName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📁 *File / Unit Ref*: ${plan.unitOrFileNumber} (${plan.size})\n` +
      `🔢 *Milestone*: ${milestone.title}\n` +
      `💰 *Amount Due*: ${formatPKR(milestone.amountPKR)} (${pkrToUrduWords(milestone.amountPKR)})\n` +
      `📅 *Due Date*: ${milestone.dueDate}\n` +
      `${lateFeeNotice}\n` +
      `🏦 *Designated Bank Deposit Particulars*:\n` +
      `• Bank: ${plan.bankName}\n` +
      `• Title: ${plan.bankAccountTitle}\n` +
      `• IBAN: ${plan.bankIban}\n\n` +
      `Kindly share your deposit slip screenshot once paid so we can update your official head office ledger.\n\n` +
      `Thank you,\n*${plan.assignedAgentName}* • PropStackly Prime Properties`;

    const encoded = encodeURIComponent(message);
    const phoneClean = plan.clientPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phoneClean}?text=${encoded}`, "_blank");
  };

  // Save new plan handler
  const handleSavePlan = (newPlan: InstallmentPlan) => {
    setPlots((prev) => [newPlan, ...prev]);
    setSelectedPlanId(newPlan.id);
    showToast(`Installment plan for ${newPlan.projectName} created successfully!`, "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-1">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight font-normal">
            Installment Recovery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Park View, Smart City, Eighteen & DHA files</span>
            <span>•</span>
            <span>Automate milestone tracking, developer commissions & WhatsApp reminders.</span>
            <span className="text-[#EE6427] font-bold">✨</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPlanModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 text-xs font-medium shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Installment Plan</span>
        </button>
      </div>

      {/* 2. RECOVERY PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="ember-card p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Portfolio Under Installments
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-950 dark:text-white truncate">
            {formatPKR(analytics.totalPortfolioPKR)}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Across {plans.length} Active Files
          </span>
        </div>

        <div className="ember-card p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Total Collected to Date
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 truncate">
            {formatPKR(analytics.totalCollectedPKR)}
          </div>
          <span className="text-xs text-emerald-600 font-bold">
            {analytics.recoveryRate.toFixed(1)}% Recovery Rate
          </span>
        </div>

        <div className="ember-card p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
            Overdue / Default Risk
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-700 dark:text-rose-300 truncate">
            {formatPKR(analytics.totalOverduePKR)}
          </div>
          <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Late Surcharges Active
          </span>
        </div>

        <div className="ember-card p-5 rounded-[20px] bg-slate-950 text-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Agency Commission Unlocked
          </span>
          <div className="text-lg sm:text-xl font-black font-mono text-[#EE6427] truncate">
            {formatPKR(analytics.totalCommissionUnlockedPKR)}
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Developer Milestone Ready
          </span>
        </div>
      </div>

      {/* 3. PLAN SELECTOR & LEDGER SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ACTIVE PLANS DIRECTORY */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Client Files ({filteredPlans.length})
              </h2>
              <span className="text-xs text-slate-400">Click to view ledger</span>
            </div>

            {/* Filter inputs */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search file # or client name..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="all">All Housing Projects</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan List */}
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pt-1">
              {filteredPlans.length === 0 ? (
                <div className="py-10 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  <Calculator className="w-7 h-7 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No installment plans found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Create your first client installment plan.</p>
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const isSelected = selectedPlan && plan.id === selectedPlan.id;
                  const paidMilestones = plan.milestones.filter((m) => m.status === "paid").length;
                  const totalM = plan.milestones.length;
                  const progressPct = totalM > 0 ? (paidMilestones / totalM) * 100 : 0;
                  const hasOverdue = plan.milestones.some((m) => m.status === "overdue");

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#EE6427] bg-orange-50/60 dark:bg-orange-950/30 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {plan.projectName}
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-[#EE6427]">
                            {plan.unitOrFileNumber} • {plan.size}
                          </span>
                        </div>

                        {hasOverdue ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mb-2">
                        Client: <strong>{plan.clientName}</strong>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Paid: {paidMilestones}/{totalM}</span>
                          <span>{formatPKR(plan.totalPricePKR)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#EE6427] rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED RECOVERY SCHEDULE & MILESTONE LEDGER */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedPlan ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
              <Calculator className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No installment plan selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Create custom milestone schedules for files or apartments, print bank challan slips, and track quarterly recovery.
              </p>
              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  + Create Installment Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlots(INITIAL_INSTALLMENT_PLANS);
                    setSelectedPlanId(INITIAL_INSTALLMENT_PLANS[0].id);
                    showToast("Loaded sample housing project installment plans");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Load Sample Plans
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Plan Overview Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EE6427]/10 text-[#EE6427] font-mono uppercase">
                    {selectedPlan.unitOrFileNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedPlan.propertyType} • {selectedPlan.size}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedPlan.planTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  Developer: <strong>{selectedPlan.developerName}</strong> • Agent: <strong>{selectedPlan.assignedAgentName}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total File Consideration:
                </span>
                <span className="text-xl font-black font-mono text-[#EE6427]">
                  {formatPKR(selectedPlan.totalPricePKR)}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedPlan.tenureYears} Years ({selectedPlan.frequency})
                </span>
              </div>
            </div>

            {/* Client & Bank Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Purchaser Particulars:</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedPlan.clientName}</p>
                <p className="font-mono text-slate-600 dark:text-slate-400">Phone: {selectedPlan.clientPhone}</p>
                <p className="font-mono text-slate-500 text-[11px]">CNIC: {selectedPlan.clientCnic || "N/A"}</p>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:dark:border-slate-750 sm:pl-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Designated Bank Account:</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedPlan.bankName}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{selectedPlan.bankAccountTitle}</p>
                <p className="font-mono text-[11px] text-[#EE6427] truncate font-bold">{selectedPlan.bankIban}</p>
              </div>
            </div>
          </div>

          {/* Milestone Schedule Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Payment Milestones Ledger (قسط وار کھاتہ)
                </h3>
                <p className="text-xs text-slate-500">
                  Track dues, print 3-slip bank deposit challans, and dispatch WhatsApp payment reminders
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Milestone Title</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Payable Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Developer Commission</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPlan.milestones.map((milestone) => {
                    const isPaid = milestone.status === "paid";
                    const isOverdue = milestone.status === "overdue";
                    const isDueSoon = milestone.status === "due_soon";

                    return (
                      <tr
                        key={milestone.id}
                        className={`transition-colors ${
                          isOverdue
                            ? "bg-rose-50/40 dark:bg-rose-950/20"
                            : isDueSoon
                            ? "bg-amber-50/40 dark:bg-amber-950/20"
                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-500">
                          {milestone.milestoneNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {milestone.title}
                          </div>
                          {milestone.paidDate && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Paid on {milestone.paidDate} ({milestone.instrumentReference})
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span
                            className={
                              isOverdue
                                ? "text-rose-600 dark:text-rose-400"
                                : isDueSoon
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-700 dark:text-slate-300"
                            }
                          >
                            {milestone.dueDate}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          {formatPKR(milestone.amountPKR)}
                        </td>
                        <td className="p-3">
                          {isPaid && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid
                            </span>
                          )}
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                          {isDueSoon && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              Due Soon
                            </span>
                          )}
                          {!isPaid && !isOverdue && !isDueSoon && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit block">
                              Upcoming
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {milestone.developerCommissionPercent > 0 ? (
                            <div className="space-y-0.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  milestone.commissionReleased
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {milestone.commissionReleased ? "Released" : `${milestone.developerCommissionPercent}% Commission`}
                              </span>
                              <div className="font-mono text-[10px] text-slate-600 font-bold">
                                {formatPKR(milestone.developerCommissionPKR)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Reminder Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReminder(selectedPlan, milestone)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors cursor-pointer"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* 3-Slip Bank Deposit Challan */}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMilestoneForVoucher({
                                  plan: selectedPlan,
                                  milestone,
                                })
                              }
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 transition-colors cursor-pointer"
                              title="Generate & Print 3-Slip Bank Deposit Challan Form"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Mark as Paid Action */}
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(selectedPlan.id, milestone.id)}
                                className="px-2 py-1 rounded-lg bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  </div>

      {/* MODAL 1: CREATE NEW INSTALLMENT PLAN */}
      <InstallmentPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSavePlan={handleSavePlan}
      />

      {/* MODAL 2: PRINT 3-SLIP BANK DEPOSIT CHALLAN */}
      {selectedMilestoneForVoucher && (
        <InstallmentVoucherModal
          isOpen={!!selectedMilestoneForVoucher}
          onClose={() => setSelectedMilestoneForVoucher(null)}
          plan={selectedMilestoneForVoucher.plan}
          milestone={selectedMilestoneForVoucher.milestone}
        />
      )}
    </div>
  );
}
