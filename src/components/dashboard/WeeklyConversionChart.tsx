"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { day: "Mon", enquiries: 14, siteVisits: 3, dealsClosed: 1 },
  { day: "Tue", enquiries: 19, siteVisits: 5, dealsClosed: 2 },
  { day: "Wed", enquiries: 22, siteVisits: 6, dealsClosed: 1 },
  { day: "Thu", enquiries: 18, siteVisits: 4, dealsClosed: 3 },
  { day: "Fri", enquiries: 27, siteVisits: 8, dealsClosed: 2 },
  { day: "Sat", enquiries: 34, siteVisits: 12, dealsClosed: 4 },
  { day: "Sun", enquiries: 29, siteVisits: 11, dealsClosed: 3 },
];

export function WeeklyConversionChart() {
  const [mounted, setMounted] = useState(false);

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

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="day"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={{ stroke: "#E2E8F0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="enquiries"
            name="New Enquiries"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEnquiries)"
          />
          <Area
            type="monotone"
            dataKey="siteVisits"
            name="Site Visits"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVisits)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
