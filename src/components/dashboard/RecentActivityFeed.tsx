"use client";

import React from "react";
import Link from "next/link";
import {
  UserCheck,
  CheckCircle,
  Calendar,
  MessageSquare,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { formatDateTime } from "@/lib/formatters";

export function RecentActivityFeed() {
  const { activities } = useCRM();

  const getIcon = (type: string) => {
    switch (type) {
      case "site_visit":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case "note":
        return <FileText className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-[#EE6427]" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Live Activity Feed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time pipeline transitions and interactions
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No activity logged yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Interactions and stage transitions will appear here live.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                {getIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {act.title}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0 ml-2">
                    {formatDateTime(act.createdAt).split(",")[0]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  {act.description}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  By <span className="font-medium text-slate-600 dark:text-slate-300">{act.performedBy}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
