"use client";

import React, { useState } from "react";
import {
  Menu,
  Search,
  Plus,
  Building,
  UserCheck,
  ChevronDown,
  Bell,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Volume2,
  Zap,
  Home,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { formatPKR, formatPhoneNumber } from "@/lib/formatters";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { TrialBadge } from "@/components/trial/TrialBadge";

function formatRelativeTime(isoString: string): string {
  try {
    if (!isoString) return "";
    let s = String(isoString).trim();
    if (s.includes("T") && !s.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
      s += "Z";
    }
    const diffMs = Date.now() - new Date(s).getTime();
    if (diffMs < 0) return "just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

interface TopbarProps {
  onMobileOpen: () => void;
  onOpenNewLeadModal: () => void;
}

export function Topbar({ onMobileOpen, onOpenNewLeadModal }: TopbarProps) {
  const pathname = usePathname();
  const {
    currentAgent,
    agents,
    setCurrentAgentId,
    leads,
    properties,
    settings,
    currentUser,
    isOwner,
    isManager,
    isAgent,
    logout,
    notifications,
    unreadNotificationsCount,
    realtimeConnected,
    triggerTestNotification,
    playNotificationChime,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    showToast,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"all" | "unread">("all");
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Derive current page title for breadcrumb capsule
  const getPageTitle = () => {
    if (pathname === "/dashboard" || pathname === "/") return "Overview";
    if (pathname.startsWith("/leads")) return "Leads";
    if (pathname.startsWith("/speed-to-lead")) return "Speed-to-Lead";
    if (pathname.startsWith("/properties")) return "Properties";
    if (pathname.startsWith("/plot-maps")) return "Plot Maps";
    if (pathname.startsWith("/deals")) return "Deals & Pipeline";
    if (pathname.startsWith("/installment-plans")) return "Installment Recovery";
    if (pathname.startsWith("/rentals")) return "Rentals & Leases";
    if (pathname.startsWith("/commissions")) return "Commissions";
    if (pathname.startsWith("/tax-calculator")) return "FBR Tax Calculator";
    if (pathname.startsWith("/follow-ups")) return "Follow-ups";
    if (pathname.startsWith("/site-visits")) return "Site Visits";
    if (pathname.startsWith("/team")) return "Team & Agents";
    if (pathname.startsWith("/reports")) return "Reports";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Workspace";
  };

  // Quick filter matching leads and properties for top search
  const filteredLeads = searchQuery.trim()
    ? leads
        .filter(
          (l) =>
            l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.phone.includes(searchQuery) ||
            l.preferredLocations.some((loc) =>
              loc.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        .slice(0, 4)
    : [];

  const filteredProperties = searchQuery.trim()
    ? properties
        .filter(
          (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.society.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 3)
    : [];

  const handleExportQuick = () => {
    showToast("Exporting pipeline snapshot (CSV)...");
    const headers = ["Entity", "Count", "Timestamp"];
    const rows = [
      ["Leads", leads.length, new Date().toISOString()],
      ["Properties", properties.length, new Date().toISOString()],
      ["Agency", settings?.agencyName || "Apex Properties", new Date().toISOString()],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PropStackly_Snapshot_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="h-14 bg-[#F7F7F5] dark:bg-[#0E1217] border-b border-[#E8E8E4] dark:border-[#222730] px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left Section: Mobile Menu & Breadcrumb Capsule */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onMobileOpen}
          className="lg:hidden p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumb Capsule [ 🏠 Overview ] matching reference image */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right Controls Area matching reference image */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search Input with ⌘K Badge */}
        <div className="relative hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-44 lg:w-56 pl-8 pr-10 py-1.5 text-xs bg-white dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:w-64 focus:outline-hidden transition-all"
            />
            <span className="absolute right-2 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-600 pointer-events-none">
              ⌘K
            </span>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-8 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowSearchDropdown(false)}
              />
              <div className="absolute left-0 right-0 mt-1.5 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-black/[0.08] dark:border-white/[0.08] z-40 max-h-80 overflow-y-auto">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Matching Leads
                </div>
                {filteredLeads.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 py-1">No leads found</p>
                ) : (
                  filteredLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#EE6427]">
                          {lead.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatPhoneNumber(lead.phone)}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {formatPKR(lead.budgetPKR)}
                      </span>
                    </Link>
                  ))
                )}

                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                  Matching Properties
                </div>
                {filteredProperties.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 py-1">No properties found</p>
                ) : (
                  filteredProperties.map((prop) => (
                    <Link
                      key={prop.id}
                      href={`/properties?search=${encodeURIComponent(prop.society)}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#EE6427] truncate">
                          {prop.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {prop.society}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {formatPKR(prop.pricePKR)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Currency Switcher */}
        <CurrencySelector compact className="hidden sm:inline-block" />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-bold text-white bg-[#EE6427] rounded-full border-2 border-[#F7F7F5] dark:border-[#0E1217]">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            ) : realtimeConnected ? (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            ) : null}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] z-40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {/* Real-time bar */}
                <div className="px-3.5 py-2 bg-orange-50/70 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-950/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        realtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    <span>{realtimeConnected ? "Push Engine Live" : "Push: Connecting..."}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playNotificationChime()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Volume2 className="w-3 h-3 text-[#EE6427]" />
                      Chime
                    </button>
                    <button
                      type="button"
                      disabled={isTestingPush}
                      onClick={async () => {
                        setIsTestingPush(true);
                        try {
                          await triggerTestNotification();
                        } finally {
                          setIsTestingPush(false);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-white bg-[#EE6427] hover:bg-[#d5541d] rounded-md transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      Test
                    </button>
                  </div>
                </div>

                {/* Header */}
                <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/70 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Notifications
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#EE6427] hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs flex items-start justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          !n.is_read ? "bg-orange-50/30 dark:bg-orange-950/10" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="text-[#EE6427] text-[10px] font-bold hover:underline shrink-0"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date Range Picker Pill (from reference image) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Oct 1 – Oct 31</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Export Button Pill (from reference image) */}
        <button
          onClick={handleExportQuick}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export</span>
        </button>

        {/* Solid Black Primary CTA Button (from reference image) */}
        <button
          onClick={onOpenNewLeadModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium rounded-xl text-xs shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Lead</span>
        </button>

        {/* User Profile / Switch Agent Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAgentMenu(!showAgentMenu)}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser?.avatar_url || currentAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={currentUser?.full_name || currentAgent?.name || "User"}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10"
            />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showAgentMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowAgentMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-black/[0.08] dark:border-white/[0.08] z-40 py-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-3.5 py-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {currentUser?.full_name || currentAgent?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {currentUser?.email || currentAgent?.email}
                  </p>
                </div>

                {!isAgent && agents.length > 1 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Agent View
                    </div>
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setCurrentAgentId(agent.id);
                          setShowAgentMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {agent.name}
                          </p>
                        </div>
                        {agent.id === currentAgent?.id && (
                          <UserCheck className="w-3.5 h-3.5 text-[#EE6427]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowAgentMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
