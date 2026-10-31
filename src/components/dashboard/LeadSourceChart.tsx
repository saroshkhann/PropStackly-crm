"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useCRM } from "@/context/CRMContext";

const SOURCE_COLORS: Record<string, string> = {
  "Facebook Ads": "#EE6427",
  "Zameen.com": "#10B981",
  "WhatsApp": "#25D366",
  "Phone Call": "#0F172A",
  "Website Form": "#6366F1",
  "Walk-in": "#F59E0B",
  "Referral": "#EC4899",
  "Graana": "#8B5CF6",
};

export function LeadSourceChart() {
  const { leads } = useCRM();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute live counts per source
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });

  const data = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      color: SOURCE_COLORS[source] || "#EE6427",
    }))
    .sort((a, b) => b.count - a.count);

  if (!mounted) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Loading source attribution...
      </div>
    );
  }

  return (
    <div className="ember-card p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white tracking-tight">
            Acquisition by Source
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Attribution from Facebook Ads, Zameen & WhatsApp
          </p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fill: "#64748B", fontSize: 11 }}
                width={85}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "11px",
                }}
                formatter={(value: any) => [`${value} leads`, "Count"]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
        Highest converting channel: WhatsApp direct campaigns
      </div>
    </div>
  );
}
