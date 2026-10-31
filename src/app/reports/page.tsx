"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import { formatPKR } from "@/lib/formatters";
import api from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  Loader2,
  Zap,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const funnelData = [
  { stage: "1. Enquiries Inflow", count: 120, pct: "100%" },
  { stage: "2. Contacted & Qualified", count: 94, pct: "78%" },
  { stage: "3. Site Visit Completed", count: 54, pct: "45%" },
  { stage: "4. Token / Under Negotiation", count: 28, pct: "23%" },
  { stage: "5. Deal Closed (Won)", count: 18, pct: "15%" },
];

const societyVolumeData = [
  { name: "DHA Islamabad", volume: 165_000_000, color: "#1D4ED8" },
  { name: "Gulberg Greens", volume: 155_000_000, color: "#059669" },
  { name: "Bahria Town RWP", volume: 88_000_000, color: "#7C3AED" },
  { name: "DHA Lahore", volume: 98_000_000, color: "#EA580C" },
  { name: "Blue Area ISB", volume: 62_000_000, color: "#0284C7" },
  { name: "Eighteen ISB", volume: 85_000_000, color: "#DB2777" },
];

const sourceRoiData = [
  { source: "Facebook Ads", leads: 48, cpl: "PKR 1,200", revenue: 140_000_000 },
  { source: "Zameen.com", leads: 32, cpl: "PKR 3,500", revenue: 185_000_000 },
  { source: "WhatsApp", leads: 24, cpl: "PKR 450", revenue: 95_000_000 },
  { source: "Referrals", leads: 14, cpl: "PKR 0", revenue: 120_000_000 },
];

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsContent />
    </AppShell>
  );
}

function ReportsContent() {
  const { agents, settings, showToast } = useCRM();
  const [timeRange, setTimeRange] = useState("Q3 - 2026");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics
      .getReports()
      .then((data) => setReportData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Multiplier according to selected time frame
  const multiplier = timeRange === "This Month" ? 0.35 : timeRange === "Full Year 2026" ? 3.6 : 1;

  const totalClosedVolume = Math.round(
    agents.reduce((acc, curr) => acc + curr.totalSalesVolumePKR, 0) * multiplier
  );

  const activeFunnel = (reportData?.funnel && reportData.funnel.length > 0)
    ? reportData.funnel.map((f: any) => ({
        stage: f.stage,
        count: Math.round(f.count * multiplier),
        pct: `${f.conversion_rate}%`,
      }))
    : funnelData.map((f) => ({
        ...f,
        count: Math.round(f.count * multiplier),
      }));

  const activeSocieties = (reportData?.top_societies && reportData.top_societies.length > 0)
    ? reportData.top_societies.map((s: any, idx: number) => ({
        name: s.society,
        volume: Math.round(Number(s.volume_pkr || 50000000) * multiplier),
        color: ["#1D4ED8", "#059669", "#7C3AED", "#EA580C", "#0284C7"][idx % 5],
      }))
    : societyVolumeData.map((s) => ({
        ...s,
        volume: Math.round(s.volume * multiplier),
      }));

  const activeChannelRoi = (reportData?.channel_roi && reportData.channel_roi.length > 0)
    ? reportData.channel_roi.map((r: any) => ({
        source: r.channel,
        leads: Math.round(r.leads * multiplier),
        cpl: `PKR ${Number(r.cpl_pkr).toLocaleString("en-PK")}`,
        revenue: Math.round(Number(r.revenue_pkr) * multiplier),
      }))
    : sourceRoiData.map((r) => ({
        ...r,
        leads: Math.round(r.leads * multiplier),
        revenue: Math.round(r.revenue * multiplier),
      }));

  const handleExportReport = () => {
    const headers = ["Category", "Metric", "Value", "Notes"];
    const rows = [
      ["Executive Summary", "Total Closed Volume", formatPKR(totalClosedVolume, false), `Timeframe: ${timeRange}`],
      ["Executive Summary", "Average Deal Size", "Rs. 5.2 Crore", "1 Kanal villas & Gulberg Greens farmhouses"],
      ["Executive Summary", "Average Closing Velocity", "16.4 Days", "Measured from enquiry to token"],
      ["Executive Summary", "Conversion Rate", "15.0%", "Inflow to closed token"],
      ...activeFunnel.map((f: any) => ["Conversion Funnel", f.stage, `${f.count} leads`, f.pct]),
      ...activeSocieties.map((s: any) => ["Society Volume", s.name, formatPKR(s.volume, false), "Closed transaction volume"]),
      ...activeChannelRoi.map((r: any) => ["Channel ROI", r.source, formatPKR(r.revenue, false), `CPL: ${r.cpl}`]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((v: any) => `"${v}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PropStackly_Executive_Report_${timeRange.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${timeRange} executive report to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Executive Intelligence</span>
            <span>•</span>
            <span className="text-[#EE6427] font-bold">Q3 Real Estate Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-slate-100 tracking-tight">
            Agency Performance & Pipeline Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conversion funnel, society deal volumes, and sales marketing attribution
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 shadow-2xs cursor-pointer"
          >
            <option value="This Month">This Month (October 2026)</option>
            <option value="Q3 - 2026">Quarter 3 (Jul - Sep 2026)</option>
            <option value="Full Year 2026">Fiscal Year 2026</option>
          </select>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Export Report (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Closed Deals Volume
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {formatPKR(totalClosedVolume)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            +22.4% vs previous quarter
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Deal Size
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">PKR 5.2 Cr</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Driven by 1 Kanal Villas & Farmhouses</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Closing Velocity
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">16.4 Days</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">4 days faster with WhatsApp</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Overall Funnel Conversion
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">15.0%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Benchmark: 8 - 12% in Pakistan</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Lead Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drop-off rate from initial online enquiry to final property token & registration
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {activeFunnel.map((item: any, idx: number) => {
              const widthPct = parseInt(item.pct, 10) || 0;
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.stage}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      {item.count} leads ({item.pct})
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        idx === 0
                          ? "bg-[#EE6427]"
                          : idx === 1
                          ? "bg-sky-500"
                          : idx === 2
                          ? "bg-indigo-500"
                          : idx === 3
                          ? "bg-purple-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.max(widthPct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volume by Society */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Closed Volume by Society / Area
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total PKR transaction value closed in Islamabad, Rawalpindi & Lahore
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeSocieties}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [formatPKR(val), "Volume"]}
                />
                <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={16}>
                  {activeSocieties.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Marketing ROI Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Marketing Channel ROI Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cost per lead (CPL) and gross transaction volume driven per channel
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Channel / Source</th>
                <th className="py-3 px-4">Enquiries Captured</th>
                <th className="py-3 px-4">Est. Cost Per Lead</th>
                <th className="py-3 px-4">Closed Pipeline (PKR)</th>
                <th className="py-3 px-4">Channel Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeChannelRoi.map((row: any) => (
                <tr key={row.source} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{row.source}</td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{row.leads}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{row.cpl}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatPKR(row.revenue)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      High Return
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Speed-to-Lead SLA Performance Banner */}
      <div className="p-5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-xl border border-orange-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EE6427] text-white flex items-center justify-center font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Speed-to-Lead SLA Response-Time Intelligence</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EE6427] text-white font-mono">
                5m SLA Target
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Review agent response rankings, lead channel speed-to-contact, and auto-escalation logs.
            </p>
          </div>
        </div>

        <Link
          href="/speed-to-lead"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white shadow-xs transition-colors shrink-0"
        >
          <span>Open Speed-to-Lead Hub</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
