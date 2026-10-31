"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
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
}

export function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  iconColor = "text-[#EE6427]",
  iconBg = "bg-orange-50 dark:bg-orange-950/40",
}: MetricCardProps) {
  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
            {value}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0", iconBg, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
        )}
        {subtitle && <span className="text-slate-400 dark:text-slate-500 truncate ml-2">{subtitle}</span>}
      </div>
    </div>
  );
}
