"use client";

import React from "react";
import Link from "next/link";
import { Compass, Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { formatDate } from "@/lib/formatters";

export function UpcomingSiteVisits() {
  const { siteVisits } = useCRM();

  const scheduledVisits = siteVisits
    .filter((sv) => sv.status === "scheduled")
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Upcoming Site Visits
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Property tours in DHA, Bahria Town & Gulberg
          </p>
        </div>
        <Link
          href="/site-visits"
          className="text-xs font-semibold text-[#EE6427] hover:text-[#DE5518] flex items-center gap-1 group"
        >
          View schedule
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {scheduledVisits.length === 0 ? (
        <div className="py-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">No pending site visits scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledVisits.map((visit) => (
            <div
              key={visit.id}
              className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {visit.leadName}
                </span>
                <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 font-medium">
                  {visit.visitDate} • {visit.visitTime}
                </span>
              </div>

              <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate">{visit.propertyLocation}</span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Property: {visit.propertyTitle}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Guide: {visit.agentName}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
