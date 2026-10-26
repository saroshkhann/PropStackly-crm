import { SpeedToLeadConfig, LeadSLAInfo, SLAState } from "@/types/sla";

/**
 * Calculates current SLA status for a given lead.
 */
export function computeLeadSLA(
  lead: {
    id: string;
    fullName: string;
    phone: string;
    source: any;
    priority: "high" | "medium" | "low";
    assignedAgentId: string;
    createdAt: string;
    lastContactedAt?: string;
  },
  agentName: string,
  config: SpeedToLeadConfig,
  currentSimulatedMinutes?: number
): LeadSLAInfo {
  const targetMinutes =
    config.priorityTargets?.[lead.priority] || config.firstResponseTargetMinutes;

  // Use stable reference timestamp during SSR/prerender to prevent Next.js prerender error
  const nowMs = typeof window !== "undefined" ? Date.now() : 1792842000000;
  const createdMs = lead.createdAt ? new Date(lead.createdAt).getTime() : nowMs;
  const diffMinutes =
    currentSimulatedMinutes !== undefined
      ? currentSimulatedMinutes
      : Math.max(0, (nowMs - createdMs) / (1000 * 60));

  const hasResponded = !!lead.lastContactedAt;
  const respondedMinutes = hasResponded
    ? Math.max(
        0,
        (new Date(lead.lastContactedAt!).getTime() - createdMs) / (1000 * 60)
      )
    : undefined;

  let state: SLAState = "safe";
  let isManagerAlerted = false;
  let isReassigned = false;

  if (hasResponded) {
    if (respondedMinutes! <= targetMinutes) {
      state = "responded_on_time";
    } else {
      state = "responded_late";
    }
  } else {
    if (config.autoReassignEnabled && diffMinutes >= config.autoReassignMinutes) {
      state = "reassigned";
      isReassigned = true;
      isManagerAlerted = true;
    } else if (diffMinutes >= config.managerEscalationMinutes) {
      state = "escalated";
      isManagerAlerted = true;
    } else if (diffMinutes >= targetMinutes) {
      state = "breached";
    } else if (diffMinutes >= config.agentWarningMinutes) {
      state = "warning";
    } else {
      state = "safe";
    }
  }

  const remaining = Math.max(0, targetMinutes - diffMinutes);

  return {
    leadId: lead.id,
    leadName: lead.fullName,
    phone: lead.phone,
    source: lead.source,
    priority: lead.priority,
    assignedAgentId: lead.assignedAgentId,
    assignedAgentName: agentName,
    createdAt: lead.createdAt,
    firstResponseAt: lead.lastContactedAt,
    firstResponseMinutes: respondedMinutes,
    targetMinutes,
    elapsedMinutes: Number(diffMinutes.toFixed(1)),
    remainingMinutes: Number(remaining.toFixed(1)),
    state,
    isManagerAlerted,
    isReassigned,
  };
}

/**
 * Returns formatted countdown display string (e.g. "02:45" or "+12:15 overdue")
 */
export function formatSLACountdown(remainingMinutes: number, elapsedMinutes: number, targetMinutes: number): {
  text: string;
  isOverdue: boolean;
} {
  if (remainingMinutes > 0) {
    const totalSecs = Math.round(remainingMinutes * 60);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return {
      text: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} left`,
      isOverdue: false,
    };
  } else {
    const overdueSecs = Math.round((elapsedMinutes - targetMinutes) * 60);
    const mins = Math.floor(overdueSecs / 60);
    const secs = overdueSecs % 60;
    return {
      text: `+${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} breached`,
      isOverdue: true,
    };
  }
}

/**
 * Helper to get styling for SLA states
 */
export function getSLAStateBadge(state: SLAState): {
  label: string;
  sublabel: string;
  badgeBg: string;
  textColor: string;
  dotColor: string;
} {
  switch (state) {
    case "safe":
      return {
        label: "On Track",
        sublabel: "Within SLA target",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        textColor: "text-emerald-700 dark:text-emerald-400",
        dotColor: "bg-emerald-500",
      };
    case "warning":
      return {
        label: "Warning: SLA Ending",
        sublabel: "Agent Warned (< 2m left)",
        badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800",
        textColor: "text-amber-700 dark:text-amber-400",
        dotColor: "bg-amber-500 animate-pulse",
      };
    case "breached":
      return {
        label: "SLA Breached",
        sublabel: "Target Missed",
        badgeBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800",
        textColor: "text-rose-700 dark:text-rose-400",
        dotColor: "bg-rose-500",
      };
    case "escalated":
      return {
        label: "Manager Alerted",
        sublabel: "Escalated to Leadership",
        badgeBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800",
        textColor: "text-purple-700 dark:text-purple-400",
        dotColor: "bg-purple-600 animate-ping",
      };
    case "reassigned":
      return {
        label: "Auto-Reassigned",
        sublabel: "Handed over to next agent",
        badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800",
        textColor: "text-blue-700 dark:text-blue-400",
        dotColor: "bg-blue-500",
      };
    case "responded_on_time":
      return {
        label: "SLA Met ✓",
        sublabel: "Responded on time",
        badgeBg: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700",
        textColor: "text-emerald-800 dark:text-emerald-300",
        dotColor: "bg-emerald-600",
      };
    case "responded_late":
      return {
        label: "Responded (Late)",
        sublabel: "Contacted after target",
        badgeBg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700",
        textColor: "text-slate-700 dark:text-slate-300",
        dotColor: "bg-slate-400",
      };
  }
}
