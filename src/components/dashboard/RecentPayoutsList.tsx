"use client";

import React from "react";
import Link from "next/link";
import { Landmark, ArrowUpRight, CheckCircle2, Clock, ShieldCheck, MoreHorizontal, FileText } from "lucide-react";
import { formatPKR } from "@/lib/formatters";
import { useCRM } from "@/context/CRMContext";

interface PayoutItem {
  id: string;
  recipient: string;
  project: string;
  bankName: string;
  amountPKR: number;
  date: string;
  status: "paid" | "in_transit" | "on_hold";
  ref: string;
}

export function RecentPayoutsList() {

  // Mock or derived recent payouts matching the reference image layout
  const payouts: PayoutItem[] = [
    {
      id: "pay-1",
      recipient: "Hamza Malik (Principal)",
      project: "DHA Phase 6 • 1 Kanal Plot 412",
      bankName: "Meezan Bank (PK78 MEZN)",
      amountPKR: 1850000,
      date: "Oct 28, 2026",
      status: "in_transit",
      ref: "TX-94021",
    },
    {
      id: "pay-2",
      recipient: "Ayesha Khan (Senior Consultant)",
      project: "Bahria Town Phase 8 • Sector C Villa",
      bankName: "HBL Escrow (PK34 HABB)",
      amountPKR: 920000,
      date: "Oct 27, 2026",
      status: "paid",
      ref: "TX-93882",
    },
    {
      id: "pay-3",
      recipient: "Bilal Ahmed (Sales Lead)",
      project: "Gulberg Greens • 5 Marla Farmhouse",
      bankName: "Standard Chartered (PK11 SCBL)",
      amountPKR: 1250000,
      date: "Oct 25, 2026",
      status: "paid",
      ref: "TX-93510",
    },
    {
      id: "pay-4",
      recipient: "PropStackly Agency Escrow",
      project: "Eighteen Islamabad • 10 Marla Luxury",
      bankName: "Bank Alfalah (PK92 ALFH)",
      amountPKR: 3400000,
      date: "Oct 22, 2026",
      status: "on_hold",
      ref: "TX-93108",
    },
  ];

  const getStatusBadge = (status: PayoutItem["status"]) => {
    switch (status) {
      case "in_transit":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <Clock className="w-2.5 h-2.5 animate-spin" />
            IN TRANSIT
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-2.5 h-2.5" />
            PAID
          </span>
        );
      case "on_hold":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ON HOLD
          </span>
        );
    }
  };

  return (
    <div className="ember-card p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white tracking-tight">
              Payouts & Settlements
            </h2>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Live
            </span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 -mr-1"
            aria-label="Payout settings"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Direct 1-Link agency settlements & commission disbursements
        </p>

        {/* Transactions List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {payouts.map((item) => (
            <div
              key={item.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 group-hover:bg-[#EE6427]/10 group-hover:text-[#EE6427] transition-colors">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.project}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.bankName} • {item.date}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-950 dark:text-white tabular-nums">
                  {formatPKR(item.amountPKR)}
                </p>
                <div className="mt-1 flex justify-end">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          FBR Section 236 Verified
        </span>
        <Link
          href="/commissions"
          className="inline-flex items-center gap-1 font-semibold text-[#EE6427] hover:text-[#DE5518] transition-colors"
        >
          <span>View commission ledger</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
