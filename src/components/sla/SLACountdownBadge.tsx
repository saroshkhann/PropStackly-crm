"use client";

import React from "react";
import { LeadSLAInfo } from "@/types/sla";
import { formatSLACountdown, getSLAStateBadge } from "@/lib/slaEngine";
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface SLACountdownBadgeProps {
  sla: LeadSLAInfo;
  onClick?: () => void;
  compact?: boolean;
}

export function SLACountdownBadge({ sla, onClick, compact = false }: SLACountdownBadgeProps) {
  const badge = getSLAStateBadge(sla.state);
  const countdown = formatSLACountdown(sla.remainingMinutes, sla.elapsedMinutes, sla.targetMinutes);

  if (sla.state === "responded_on_time") {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${
          onClick ? "cursor-pointer hover:bg-emerald-100" : ""
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>SLA Met ({sla.firstResponseMinutes?.toFixed(1)}m)</span>
      </span>
    );
  }

  if (sla.state === "responded_late") {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${
          onClick ? "cursor-pointer hover:bg-slate-200" : ""
        }`}
      >
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>Late Response ({sla.firstResponseMinutes?.toFixed(1)}m)</span>
      </span>
    );
  }

  const isOverdue = countdown.isOverdue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
        isOverdue
          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs"
          : sla.state === "warning"
          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs animate-pulse"
          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
      } ${onClick ? "cursor-pointer hover:scale-105" : ""}`}
      title={`${badge.label}: ${countdown.text} (${sla.targetMinutes}m target)`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOverdue
            ? "bg-rose-500"
            : sla.state === "warning"
            ? "bg-amber-500"
            : "bg-emerald-500"
        }`}
      />
      <span className="font-mono text-xs">{countdown.text}</span>
      {!compact && (
        <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
          {sla.state === "warning" ? "• Call Now" : sla.state === "escalated" ? "• Escalated" : ""}
        </span>
      )}
    </button>
  );
}
