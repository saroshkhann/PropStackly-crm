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
  MoreHorizontal,
  Sun,
  Moon,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { leads, followUps, properties, currentAgent, currentUser, settings, isOwner, isManager, isAgent, logout } = useCRM();
  const { theme, toggleTheme } = useTheme();

  const newLeadsCount = leads.filter((l) => l.status === "new").length;
  const pendingFollowUps = followUps.filter((f) => !f.completed).length;

  const sections: NavSection[] = [
    {
      title: "APPLICATIONS",
      items: [
        {
          label: "Overview",
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
          label: "Speed-to-Lead",
          href: "/speed-to-lead",
          icon: Zap,
          badge: "5m SLA",
          badgeColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60",
        },
        {
          label: "Properties",
          href: "/properties",
          icon: Building2,
          badge: properties.length > 0 ? properties.length : undefined,
          badgeColor: "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
        },
        {
          label: "Society Plot Maps",
          href: "/plot-maps",
          icon: Map,
          badge: "Maps",
          badgeColor: "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
        },
      ],
    },
    {
      title: "TRANSACTIONS & SETTLEMENTS",
      items: [
        {
          label: "Deals & Pipeline",
          href: "/deals",
          icon: Handshake,
          badge: "Flow",
          badgeColor: "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
        },
        {
          label: "Installment Plans",
          href: "/installment-plans",
          icon: Calendar,
          badge: "Recovery",
          badgeColor: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
        },
        {
          label: "Rentals & Leases",
          href: "/rentals",
          icon: Key,
          badge: "Rent Roll",
          badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        },
        {
          label: "Commissions",
          href: "/commissions",
          icon: Wallet,
          badge: "Ledger",
          badgeColor: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        },
        {
          label: "Tax Calculator",
          href: "/tax-calculator",
          icon: Calculator,
          badge: "FBR 236",
          badgeColor: "bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] border border-orange-200 dark:border-orange-800",
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          label: "Follow-ups",
          href: "/follow-ups",
          icon: CalendarCheck,
          badge: pendingFollowUps > 0 ? pendingFollowUps : undefined,
          badgeColor: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
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
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#F3F3F0] dark:bg-[#12161D] text-slate-800 dark:text-slate-200 border-r border-[#E8E8E4] dark:border-[#222730] transition-all duration-300 ease-in-out lg:static shrink-0 select-none",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 px-4 pt-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group focus:outline-hidden"
          >
            {/* Black Squircle Logo from reference image */}
            <div className="w-7 h-7 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs tracking-tight shadow-2xs group-hover:scale-105 transition-transform">
              P
            </div>
            {!collapsed && (
              <span className="font-bold text-base text-slate-950 dark:text-white tracking-tight">
                PropStackly.
              </span>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Agency / Workspace Selector Pill (Kiln & Co. style from reference) */}
        {!collapsed && (
          <div className="mx-3 mt-2 mb-2 p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between group hover:border-black/[0.12] transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#EE6427] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {settings?.agencyName?.charAt(0) || "A"}
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[105px]">
                    {settings?.agencyName || "Apex Properties"}
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {isOwner ? "OWNER" : isManager ? "PRO" : "AGENT"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
                  {settings?.city || "Islamabad"} Head Office
                </p>
              </div>
            </div>
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto scrollbar-none">
          {sections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2.5 py-1">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
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
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs border border-black/[0.04] dark:border-white/[0.06] font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-slate-950 dark:text-white"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                      )}
                    />
                    {!collapsed && (
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-md text-[10px] font-semibold shrink-0 ml-auto",
                          item.badgeColor || "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar: Settings, Appearance, Invite, & User Profile */}
        <div className="p-3 border-t border-[#E8E8E4] dark:border-[#222730] space-y-2">
          {/* Settings link */}
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors",
              pathname === "/settings"
                ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            {!collapsed && <span className="flex-1">Settings</span>}
          </Link>

          {/* Appearance Toggle */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-slate-400" />
                ) : (
                  <Sun className="w-4 h-4 text-slate-500" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>
          )}

          {/* Invite Users Pill (From reference image) */}
          {!collapsed && (
            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Overlapping mini avatars */}
                <div className="flex -space-x-1.5 overflow-hidden">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border-2 border-white dark:border-slate-800 text-[9px] text-white flex items-center justify-center font-bold">
                    A
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-700 border-2 border-white dark:border-slate-800 text-[9px] text-white flex items-center justify-center font-bold">
                    B
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#EE6427] border-2 border-white dark:border-slate-800 text-[9px] text-white flex items-center justify-center font-bold">
                    H
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Invite team
                </span>
              </div>
              <Link
                href="/team"
                className="text-[11px] font-semibold text-[#EE6427] hover:underline"
              >
                + Invite
              </Link>
            </div>
          )}

          {/* User Profile Pill at very bottom */}
          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser?.avatar_url || currentAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={currentUser?.full_name || currentAgent?.name || "Agent"}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10 shrink-0"
              />
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.full_name || currentAgent?.name || "Hamza Malik"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none">
                    {currentUser?.role_title || currentAgent?.role || "Principal Broker"}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={() => logout()}
                title="Sign out"
                className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
