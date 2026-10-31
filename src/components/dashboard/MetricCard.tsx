"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  velocityPercent?: number; // 0 to 100
  barColor?: "orange" | "emerald" | "slate" | "sky" | "purple";
  onMenuClick?: () => void;
}

export function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  iconColor = "text-slate-700 dark:text-slate-300",
  iconBg = "bg-slate-100 dark:bg-slate-800",
  velocityPercent = 68,
  barColor = "slate",
  onMenuClick,
}: MetricCardProps) {
  // 24 vertical dash ticks matching the Ember / Linear design reference
  const totalTicks = 24;
  const activeTicks = Math.max(1, Math.min(totalTicks, Math.round((velocityPercent / 100) * totalTicks)));

  const getTickColor = (index: number) => {
    if (index >= activeTicks) {
      return "bg-slate-100 dark:bg-slate-800/80";
    }
    switch (barColor) {
      case "orange":
        return "bg-[#EE6427]";
      case "emerald":
        return "bg-emerald-500";
      case "sky":
        return "bg-sky-500";
      case "purple":
        return "bg-purple-500";
      case "slate":
      default:
        return "bg-slate-900 dark:bg-slate-200";
    }
  };

  return (
    <div className="ember-card p-5 bg-white dark:bg-slate-900/90 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
      {/* Top row: Icon + Label on left, 3-dots on right */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("p-1.5 rounded-lg shrink-0 transition-colors", iconBg, iconColor)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate tracking-tight">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onMenuClick}
            className="text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 -mr-1 rounded-md"
            aria-label="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Big tabular bold value */}
        <div className="my-2.5">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white font-sans tabular-nums">
            {value}
          </p>
        </div>

        {/* Segmented Dotted / Dash Velocity Bar (Linear / Ember signature element) */}
        <div className="flex items-center gap-1 sm:gap-1.5 my-3 overflow-hidden" title={`Velocity: ${velocityPercent}%`}>
          {Array.from({ length: totalTicks }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-3.5 flex-1 rounded-full transition-all duration-300",
                getTickColor(idx),
                idx < activeTicks ? "opacity-90 hover:opacity-100" : "opacity-40"
              )}
            />
          ))}
        </div>
      </div>

      {/* Bottom row: Trend badge & subtitle */}
      <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100/80 dark:border-slate-800/80 mt-1">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-tight",
              isPositive
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            )}
            {change}
          </span>
        )}
        {subtitle && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate ml-2">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
