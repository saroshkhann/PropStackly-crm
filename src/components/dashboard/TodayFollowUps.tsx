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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
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
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {pending.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">All follow-ups completed!</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Great job keeping the pipeline warm.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((fu) => {
            const waGreeting = `Assalam-o-Alaikum ${fu.leadName}, this is regarding your property enquiry with PropStackly Prime Properties. Are you available for a brief update today?`;
            const waLink = getWhatsAppLink(fu.leadPhone, waGreeting);

            return (
              <div
                key={fu.id}
                className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-start gap-3 group"
              >
                <button
                  type="button"
                  onClick={() => toggleFollowUp(fu.id)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                  title="Mark as completed"
                >
                  <Circle className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/leads/${fu.leadId}`}
                      className="text-xs font-semibold text-slate-900 dark:text-white hover:text-[#EE6427] truncate"
                    >
                      {fu.leadName}
                    </Link>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {fu.scheduledTime}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                    {fu.notes}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Agent: {fu.agentName.split(" ")[0]}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${fu.leadPhone}`}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-[#EE6427] hover:bg-white dark:hover:bg-slate-700 rounded-md border border-slate-200/60 dark:border-slate-700 transition-colors"
                        title="Direct Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md border border-emerald-200/60 dark:border-emerald-800 transition-colors"
                        title="Send WhatsApp Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
