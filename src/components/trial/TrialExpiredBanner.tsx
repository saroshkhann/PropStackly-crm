"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { TrialUpgradeModal } from "./TrialUpgradeModal";

export function TrialExpiredBanner() {
  const { isTrialExpired, settings } = useCRM();
  const [showModal, setShowModal] = useState(false);

  if (!isTrialExpired) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 text-white px-4 py-2 border-b border-rose-800/80 shadow-md flex items-center justify-between text-xs z-40 sticky top-0">
        <div className="flex items-center gap-2 max-w-2xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <p className="text-rose-100">
            <strong>3-Day Free Trial Concluded:</strong> New lead & deal creation for{" "}
            <strong>{settings.agencyName}</strong> is paused. Your existing records remain safe.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="ml-3 px-3.5 py-1 rounded-lg bg-[#EE6427] hover:bg-[#d5531d] text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Activate Agency License</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <TrialUpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
