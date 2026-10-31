"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowRight, Sparkles, ShieldAlert } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { TrialUpgradeModal } from "./TrialUpgradeModal";

export function TrialExpiredBanner() {
  const { isTrialExpired, settings } = useCRM();
  const [showModal, setShowModal] = useState(false);

  if (!isTrialExpired) return null;

  return (
    <>
      <div className="bg-slate-950 text-white px-4 py-2.5 border-b border-rose-900/60 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs z-40 sticky top-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase tracking-wider border border-rose-500/30 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Trial Concluded</span>
          </span>
          <p className="text-slate-200 text-xs truncate">
            New lead & deal creation for <strong className="text-white font-semibold">{settings.agencyName || "Apex Properties"}</strong> is paused. All your customer & property records remain 100% secure.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-[#EE6427] hover:bg-[#d9551c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-orange-500/20 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Activate Agency License</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <TrialUpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
