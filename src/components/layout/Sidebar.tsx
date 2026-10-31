"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Compass,
  Award,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Handshake,
  X,
  Calculator,
  Map,
  Calendar,
  Key,
  Wallet,
  Zap,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { cn } from "@/lib/utils";
import PropStacklyLogo from "@/components/common/PropStacklyLogo";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { leads, followUps, properties, currentAgent, currentUser, isOwner, isManager, isAgent, logout } = useCRM();

  const newLeadsCount = leads.filter((l) => l.status === "new").length;
  const pendingFollowUps = followUps.filter((f) => !f.completed).length;

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: Users,
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
      badgeColor: "bg-[#EE6427] text-white",
    },
    {
      label: "Speed-to-Lead SLA",
      href: "/speed-to-lead",
      icon: Zap,
      badge: "5m SLA",
      badgeColor: "bg-[#EE6427] text-white text-[9px] px-1.5 py-0.5 font-bold",
    },
    {
      label: "Properties",
      href: "/properties",
      icon: Building2,
      badge: properties.length,
      badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    },
    {
      label: "Society Plot Maps",
      href: "/plot-maps",
      icon: Map,
      badge: "DHA/Bahria",
      badgeColor: "bg-[#EE6427] text-white text-[9px] px-1.5 py-0.5 font-bold",
    },
    {
      label: "Deals & Pipeline",
      href: "/deals",
      icon: Handshake,
      badge: "Deal Flow",
      badgeColor: "bg-emerald-600 text-white text-[10px] px-1.5 py-0.5",
    },
    {
      label: "Installment Plans",
      href: "/installment-plans",
      icon: Calendar,
      badge: "Recovery",
      badgeColor: "bg-purple-600 text-white text-[9px] px-1.5 py-0.5 font-bold",
    },
    {
      label: "Rentals & Leases",
      href: "/rentals",
      icon: Key,
      badge: "Rent Roll",
      badgeColor: "bg-blue-600 text-white text-[9px] px-1.5 py-0.5 font-bold",
    },
    {
      label: "Commission & Payouts",
      href: "/commissions",
      icon: Wallet,
      badge: "Hisab",
      badgeColor: "bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 font-bold",
    },
    {
      label: "Tax & Transfer Calc",
      href: "/tax-calculator",
      icon: Calculator,
      badge: "FBR 236",
      badgeColor: "bg-[#EE6427] text-white text-[9px] px-1.5 py-0.5",
    },
    {
      label: "Follow-ups",
      href: "/follow-ups",
      icon: CalendarCheck,
      badge: pendingFollowUps > 0 ? pendingFollowUps : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      label: "Site Visits",
      href: "/site-visits",
      icon: Compass,
    },
    {
      label: "Team & Agents",
      href: "/team",
      icon: Award,
    },
    {
      label: "Reports & Analytics",
      href: "/reports",
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:static shrink-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden group focus:outline-hidden"
          >
            <PropStacklyLogo
              size={36}
              priority
              showText={!collapsed}
              textClassName="text-lg text-white"
              subtitle="Real Estate Suite"
            />
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Live Market Badge */}
        {!collapsed && (
          <div className="mx-3 my-2.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800/90 text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PK Market Live
            </span>
            <span className="text-slate-400 font-mono text-[10px]">ISB / LHR / RWP</span>
          </div>
        )}

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-[#EE6427] text-white shadow-md shadow-[#EE6427]/25 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate tracking-tight">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ml-auto",
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Current Agent Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser?.avatar_url || currentAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={currentUser?.full_name || currentAgent?.name || "Agent"}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#EE6427]/40 shrink-0"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">
                  {currentUser?.full_name || currentAgent?.name || "Hamza Malik"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isOwner ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-800/80 px-1.5 py-0.2 rounded-xs">
                      Owner
                    </span>
                  ) : isManager ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.2 rounded-xs">
                      Manager
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.2 rounded-xs">
                      Sales Agent
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 truncate">
                    {currentUser?.role_title || currentAgent?.role || "Consultant"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Live RBAC
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
