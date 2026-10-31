"use client";

import React, { useState } from "react";
import {
  Menu,
  Search,
  Plus,
  Building,
  UserCheck,
  ChevronDown,
  PhoneCall,
  Bell,
  Sparkles,
  X,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  CheckCheck,
  Trash2,
  AlertCircle,
  Volume2,
  Zap,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import Link from "next/link";
import { formatPKR, formatPhoneNumber } from "@/lib/formatters";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TrialBadge } from "@/components/trial/TrialBadge";

function formatRelativeTime(isoString: string): string {
  try {
    if (!isoString) return "";
    let s = String(isoString).trim();
    // If backend returns an ISO string without timezone indicator (e.g. SQLite naive UTC), append 'Z'
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
  } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"all" | "unread">("all");
  const [isTestingPush, setIsTestingPush] = useState(false);

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

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors duration-200">
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        {/* Mobile menu button */}
        <button
          onClick={onMobileOpen}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Agency Branch Info */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
          <Building className="w-3.5 h-3.5 text-[#EE6427] dark:text-orange-400" />
          <span className="font-semibold text-slate-900 dark:text-white">{settings.agencyName}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Blue Area, Islamabad</span>
        </div>

        {/* Search Bar with live preview */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search leads, phone (+92...), DHA, Bahria..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 focus:border-[#EE6427] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowSearchDropdown(false)}
              />
              <div className="absolute left-0 right-0 mt-1.5 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-40 max-h-96 overflow-y-auto">
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                  Matching Leads
                </div>
                {filteredLeads.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 py-1.5">No leads found</p>
                ) : (
                  filteredLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#EE6427] dark:group-hover:text-orange-400">
                          {lead.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatPhoneNumber(lead.phone)} • {lead.preferredLocations[0] || lead.city}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 shrink-0">
                        {formatPKR(lead.budgetPKR)}
                      </span>
                    </Link>
                  ))
                )}

                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-2.5 pb-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                  Matching Properties
                </div>
                {filteredProperties.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 py-1.5">No properties found</p>
                ) : (
                  filteredProperties.map((prop) => (
                    <Link
                      key={prop.id}
                      href={`/properties?search=${encodeURIComponent(prop.society)}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#EE6427] dark:group-hover:text-orange-400 truncate">
                          {prop.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {prop.location}, {prop.society}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {formatPKR(prop.pricePKR)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Action Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Multi-Currency Switcher */}
        <CurrencySelector compact className="hidden sm:inline-block" />

        {/* Dark / Light Mode Toggle */}
        <ThemeToggle />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Notifications"
            title={realtimeConnected ? "Notifications (Real-Time Push Active)" : "Notifications"}
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#EE6427] rounded-full border-2 border-white dark:border-slate-900 shadow-xs">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            ) : realtimeConnected ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            ) : null}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Real-Time Live Status & Actions Bar */}
                <div className="px-3.5 py-2 bg-orange-50/60 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        realtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    <span>{realtimeConnected ? "Real-Time Push: Live" : "Push: Connecting..."}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playNotificationChime()}
                      title="Test Audio Chime Sound"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
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
                      title="Trigger a simulated real-time lead assignment push"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-white bg-[#EE6427] hover:bg-[#d5541d] disabled:opacity-50 rounded-md transition-colors shadow-xs cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      {isTestingPush ? "Pushed..." : "Test Push"}
                    </button>
                  </div>
                </div>

                {/* Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 dark:bg-orange-950/80 text-[#EE6427] dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800">
                        {unreadNotificationsCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#EE6427] dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center px-3 pt-2 gap-2 text-xs border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setNotificationTab("all")}
                    className={`pb-2 px-1 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
                      notificationTab === "all"
                        ? "border-[#EE6427] text-[#EE6427] dark:border-orange-400 dark:text-orange-400"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotificationTab("unread")}
                    className={`pb-2 px-1 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
                      notificationTab === "unread"
                        ? "border-[#EE6427] text-[#EE6427] dark:border-orange-400 dark:text-orange-400"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    Unread ({unreadNotificationsCount})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications
                    .filter((n) => (notificationTab === "unread" ? !n.is_read : true))
                    .length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                        <Bell className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No notifications</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {notificationTab === "unread"
                          ? "You have caught up with all reminders!"
                          : "New lead assignments & follow-up reminders will appear here."}
                      </p>
                    </div>
                  ) : (
                    notifications
                      .filter((n) => (notificationTab === "unread" ? !n.is_read : true))
                      .map((notif) => {
                        const isUnread = !notif.is_read;
                        return (
                          <div
                            key={notif.id}
                            className={`p-3 transition-colors flex items-start gap-2.5 group hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                              isUnread ? "bg-orange-50/30 dark:bg-orange-950/20" : ""
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {notif.type === "lead_assigned" ? (
                                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center">
                                  <UserCheck className="w-4 h-4" />
                                </div>
                              ) : notif.type === "followup_overdue" ? (
                                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                              ) : notif.type === "followup_upcoming" ? (
                                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                  <Clock className="w-4 h-4" />
                                </div>
                              ) : notif.type === "whatsapp_sent" ? (
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                              ) : notif.type === "whatsapp_failed" ? (
                                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                  <Bell className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <Link
                                  href={notif.link_url || "/follow-ups"}
                                  onClick={() => {
                                    if (isUnread) markNotificationRead(notif.id);
                                    setShowNotifications(false);
                                  }}
                                  className="text-xs font-semibold text-slate-900 dark:text-white hover:text-[#EE6427] truncate"
                                >
                                  {notif.title}
                                </Link>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatRelativeTime(notif.created_at)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between mt-1 pt-1">
                                {isUnread && (
                                  <button
                                    onClick={() => markNotificationRead(notif.id)}
                                    className="text-[10px] font-semibold text-[#EE6427] hover:underline cursor-pointer"
                                  >
                                    Mark read
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notif.id)}
                                  className="ml-auto text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Dismiss notification"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/70 text-center border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href="/follow-ups"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#EE6427] transition-colors"
                  >
                    View All Follow-ups & Reminders →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3-Day Free Trial / Pro License Badge */}
        <TrialBadge />

        {/* Quick Add Lead Button */}
        <button
          onClick={onOpenNewLeadModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EE6427] hover:bg-[#DE5518] text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md shadow-[#EE6427]/25 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Lead</span>
        </button>

        {/* Switch Agent Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAgentMenu(!showAgentMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            title="User Profile & Roles"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser?.avatar_url || currentAgent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={currentUser?.full_name || currentAgent?.name || "User"}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[110px]">
                  {currentUser?.full_name || currentAgent?.name || "Hamza Malik"}
                </p>
                {isOwner ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-1 py-0.2 rounded-xs border border-purple-200 dark:border-purple-800">
                    Owner
                  </span>
                ) : isManager ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-1 py-0.2 rounded-xs border border-amber-200 dark:border-amber-800">
                    Manager
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-1 py-0.2 rounded-xs border border-emerald-200 dark:border-emerald-800">
                    Agent
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-none truncate max-w-[130px]">
                {currentUser?.email || currentAgent?.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showAgentMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowAgentMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-40 py-1.5 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.full_name || currentAgent?.name}
                    </p>
                    {isOwner ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-1.5 py-0.5 rounded-xs border border-purple-200 dark:border-purple-800">
                        Owner
                      </span>
                    ) : isManager ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.5 rounded-xs border border-amber-200 dark:border-amber-800">
                        Manager
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-xs border border-emerald-200 dark:border-emerald-800">
                        Sales Agent
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser?.email || currentAgent?.email}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Verified HttpOnly session
                  </p>
                </div>

                {!isAgent && agents.length > 1 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Switch Agent View (Manager Tool)
                    </div>
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setCurrentAgentId(agent.id);
                          setShowAgentMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-orange-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#EE6427] dark:group-hover:text-orange-400 leading-tight">
                              {agent.name}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">{agent.role}</p>
                          </div>
                        </div>
                        {agent.id === currentAgent?.id && (
                          <UserCheck className="w-3.5 h-3.5 text-[#EE6427] dark:text-orange-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAgentMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out Securely
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
