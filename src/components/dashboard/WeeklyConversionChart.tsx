"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const dailyData = [
  { day: "Oct 1", enquiries: 12, volumeCr: 4.2 },
  { day: "Oct 5", enquiries: 19, volumeCr: 6.8 },
  { day: "Oct 10", enquiries: 24, volumeCr: 8.5 },
  { day: "Oct 15", enquiries: 18, volumeCr: 5.4 },
  { day: "Oct 20", enquiries: 38, volumeCr: 14.2 }, // DHA Event peak
  { day: "Oct 25", enquiries: 29, volumeCr: 10.1 },
  { day: "Oct 31", enquiries: 33, volumeCr: 11.8 },
];

const cumulativeData = [
  { day: "Oct 1", enquiries: 12, volumeCr: 4.2 },
  { day: "Oct 5", enquiries: 31, volumeCr: 11.0 },
  { day: "Oct 10", enquiries: 55, volumeCr: 19.5 },
  { day: "Oct 15", enquiries: 73, volumeCr: 24.9 },
  { day: "Oct 20", enquiries: 111, volumeCr: 39.1 },
  { day: "Oct 25", enquiries: 140, volumeCr: 49.2 },
  { day: "Oct 31", enquiries: 173, volumeCr: 61.0 },
];

export function WeeklyConversionChart() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "cumulative">("daily");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Loading pipeline analytics...
      </div>
    );
  }

  const activeData = viewMode === "daily" ? dailyData : cumulativeData;

  return (
    <div className="space-y-4">
      {/* Top Segmented Controls & Annotation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Floating Event Tag from reference image */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EE6427] animate-pulse" />
          <span className="font-semibold">DHA Phase 2 Launch</span>
          <span className="text-amber-400 dark:text-amber-600">•</span>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80">Oct 18–20 • Peak Rs. 14.2 Cr</span>
        </div>

        {/* [ Daily | Cumulative ] Segmented capsule button */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-black/[0.04] dark:border-white/[0.06] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "daily"
                ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cumulative")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "cumulative"
                ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={activeData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EE6427" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#EE6427" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={{ stroke: "#E2E8F0", strokeOpacity: 0.6 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F172A",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              }}
              formatter={(value: any, name: any) => [
                name === "volumeCr" ? `Rs. ${value} Crore` : `${value} enquiries`,
                name === "volumeCr" ? "Deal Volume" : "Incoming Leads",
              ]}
            />
            <Area
              type="monotone"
              dataKey="enquiries"
              name="enquiries"
              stroke="#EE6427"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorOrange)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
