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
  "Facebook Ads": "#1877F2",
  "Zameen.com": "#00A859",
  "WhatsApp": "#25D366",
  "Phone Call": "#0284C7",
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
      color: SOURCE_COLORS[source] || "#3B82F6",
    }))
    .sort((a, b) => b.count - a.count);

  if (!mounted) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Loading source statistics...
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
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
            tick={{ fill: "#475569", fontSize: 11 }}
            width={95}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value: any) => [`${value} Leads`, "Volume"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
