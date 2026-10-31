"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Phone, MessageSquare, ArrowRight, Clock } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { getWhatsAppLink, formatPhoneNumber } from "@/lib/formatters";

export function TodayFollowUps() {
  const { followUps, toggleFollowUp } = useCRM();

  // Show up to 4 pending follow-ups
  const pending = followUps.filter((f) => !f.completed).slice(0, 4);

  return (
    <div className="ember-card p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white tracking-tight">
              Follow-ups Due Today
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Urgent client touchpoints across WhatsApp & Phone
            </p>
          </div>
          <Link
            href="/follow-ups"
            className="text-xs font-semibold text-[#EE6427] hover:text-[#DE5518] flex items-center gap-1 group"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 my-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              All follow-ups completed
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Pipeline is fully nurtured.</p>
          </div>
        ) : (
          <div className="space-y-2.5 my-3">
            {pending.map((fu) => {
              const waGreeting = `Assalam-o-Alaikum ${fu.leadName}, this is regarding your property enquiry with PropStackly Prime Properties. Are you available for a brief update today?`;
              const waLink = getWhatsAppLink(fu.leadPhone, waGreeting);

              return (
                <div
                  key={fu.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 group"
                >
                  <button
                    onClick={() => toggleFollowUp(fu.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <Circle className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {fu.leadName}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {fu.scheduledTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {fu.notes}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${fu.leadPhone}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
        Active reminder engine synced with agent calendars
      </div>
    </div>
  );
}
