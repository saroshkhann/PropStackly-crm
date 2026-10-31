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
    <div className="ember-card p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white tracking-tight">
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
            <span>Schedule</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {scheduledVisits.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 my-2">
            <Compass className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No site visits scheduled today
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Plan tours with qualified buyers.</p>
          </div>
        ) : (
          <div className="space-y-2.5 my-3">
            {scheduledVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {visit.leadName}
                  </span>
                  <span className="text-[10px] font-semibold text-[#EE6427] bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-1.5 py-0.2 rounded-md">
                    {visit.propertyLocation}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {visit.propertyTitle}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(visit.visitDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {visit.visitTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
        Site visits boost deal closing probability by 4.2x
      </div>
    </div>
  );
}
