"use client";

import React from "react";
import { LeadSLAInfo } from "@/types/sla";
import { formatSLACountdown, getSLAStateBadge } from "@/lib/slaEngine";
import { Zap, Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

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
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badgeBg} ${badge.textColor} ${
          onClick ? "cursor-pointer hover:opacity-90" : ""
        }`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>SLA Met ({sla.firstResponseMinutes?.toFixed(1)}m)</span>
      </span>
    );
  }

  if (sla.state === "responded_late") {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badgeBg} ${badge.textColor} ${
          onClick ? "cursor-pointer hover:opacity-90" : ""
        }`}
      >
        <Clock className="w-3 h-3 text-slate-500" />
        <span>Late Response ({sla.firstResponseMinutes?.toFixed(1)}m)</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${badge.badgeBg} ${badge.textColor} ${
        onClick ? "cursor-pointer hover:scale-105 shadow-xs" : ""
      }`}
      title={`${badge.label}: ${countdown.text} (${sla.targetMinutes}m target)`}
    >
      <span className={`w-2 h-2 rounded-full ${badge.dotColor}`}></span>
      <span className="font-mono font-bold">{countdown.text}</span>
      {!compact && (
        <span className="text-[10px] opacity-80 hidden sm:inline">
          {sla.state === "warning" ? "(Call Now!)" : sla.state === "escalated" ? "(Manager Alerted)" : ""}
        </span>
      )}
    </button>
  );
}
