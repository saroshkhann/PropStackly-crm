"use client";

import React, { useState } from "react";
import { Sparkles, Clock, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { TrialUpgradeModal } from "./TrialUpgradeModal";

export function TrialBadge() {
  const {
    settings,
    isTrialExpired,
    trialRemainingFormatted,
    trialRemainingHours,
  } = useCRM();

  const [showModal, setShowModal] = useState(false);

  const subStatus = settings.subscriptionStatus || "trial";

  if (subStatus === "active") {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
          title="Click to view subscription details"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Agency Pro License</span>
        </button>
        <TrialUpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (isTrialExpired) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse hover:bg-rose-200 transition-all cursor-pointer shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Trial Expired — Activate</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
        <TrialUpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Active 3-Day Free Trial
  const isUrgent = trialRemainingHours < 24;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
          isUrgent
            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200"
            : "bg-orange-50 dark:bg-orange-950/60 text-[#EE6427] dark:text-orange-400 border border-orange-200 dark:border-orange-800/80 hover:bg-orange-100"
        }`}
        title="3-Day Free Trial. Click to Upgrade to Pro"
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Trial: {trialRemainingFormatted}</span>
        <span className="hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded-xs bg-[#EE6427] text-white text-[9px] uppercase font-extrabold tracking-wider">
          Upgrade
        </span>
      </button>

      <TrialUpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
