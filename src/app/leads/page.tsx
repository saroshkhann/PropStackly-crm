"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import {
  formatPKR,
  formatPhoneNumber,
  formatDate,
  getLeadStatusConfig,
  getPriorityConfig,
  getWhatsAppLink,
} from "@/lib/formatters";
import { Lead, LeadStatus, LeadSource, LeadPriority } from "@/types/crm";
import { EditLeadModal } from "@/components/leads/EditLeadModal";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import {
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  MapPin,
  Building,
  User,
  X,
  FileSpreadsheet,
  Archive,
  Zap,
  Clock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { SLACountdownBadge } from "@/components/sla/SLACountdownBadge";
import { QuickContactSLAModal } from "@/components/sla/QuickContactSLAModal";
import { computeLeadSLA } from "@/lib/slaEngine";
import { defaultSpeedToLeadConfig } from "@/data/slaPresets";
import { LeadSLAInfo } from "@/types/sla";

export default function LeadsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading leads pipeline...</div>}>
        <LeadsContent />
      </Suspense>
    </AppShell>
  );
}

function LeadsContent() {
  const { leads, agents, deleteLead, archiveLead, unarchiveLead, showToast, isManager, isOwner, isAgent } = useCRM();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">("active");

  // Modals & Selection
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [slaModalLead, setSlaModalLead] = useState<LeadSLAInfo | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    const list = leads.filter((lead) => {
      // Archive Filter
      if (archiveFilter === "active" && lead.isArchived) return false;
      if (archiveFilter === "archived" && !lead.isArchived) return false;

      // Search
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        lead.fullName.toLowerCase().includes(searchLower) ||
        lead.phone.includes(search) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        lead.preferredLocations.some((loc) => loc.toLowerCase().includes(searchLower)) ||
        lead.propertyTypeInterest.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status
      if (selectedStatus !== "all" && lead.status !== selectedStatus) return false;

      // Source
      if (selectedSource !== "all" && lead.source !== selectedSource) return false;

      // Agent
      if (selectedAgent !== "all" && lead.assignedAgentId !== selectedAgent) return false;

      // City
      if (selectedCity !== "all" && lead.city !== selectedCity) return false;

      // Priority
      if (selectedPriority !== "all" && lead.priority !== selectedPriority) return false;

      // Budget Range
      if (selectedBudgetRange === "under_2cr" && lead.budgetPKR >= 20_000_000) return false;
      if (
        selectedBudgetRange === "2cr_5cr" &&
        (lead.budgetPKR < 20_000_000 || lead.budgetPKR > 50_000_000)
      )
        return false;
      if (
        selectedBudgetRange === "5cr_10cr" &&
        (lead.budgetPKR < 50_000_000 || lead.budgetPKR > 100_000_000)
      )
        return false;
      if (selectedBudgetRange === "above_10cr" && lead.budgetPKR <= 100_000_000) return false;

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "budget_desc") {
        return b.budgetPKR - a.budgetPKR;
      }
      if (sortBy === "budget_asc") {
        return a.budgetPKR - b.budgetPKR;
      }
      if (sortBy === "name_asc") {
        return a.fullName.localeCompare(b.fullName);
      }
      return 0;
    });
  }, [
    leads,
    search,
    selectedStatus,
    selectedSource,
    selectedAgent,
    selectedCity,
    selectedPriority,
    selectedBudgetRange,
    sortBy,
    archiveFilter,
  ]);

  // Pagination slice
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Full Name",
      "Phone",
      "Email",
      "City",
      "Source",
      "Status",
      "Priority",
      "Budget (PKR)",
      "Property Interest",
      "Location",
      "Created At",
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.fullName}"`,
      `"${l.phone}"`,
      `"${l.email || ""}"`,
      `"${l.city}"`,
      `"${l.source}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      l.budgetPKR,
      `"${l.propertyTypeInterest}"`,
      `"${l.preferredLocations.join(", ")}"`,
      `"${l.createdAt}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PropStackly_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredLeads.length} leads to CSV.`);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setSelectedSource("all");
    setSelectedAgent("all");
    setSelectedCity("all");
    setSelectedPriority("all");
    setSelectedBudgetRange("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search ||
    selectedStatus !== "all" ||
    selectedSource !== "all" ||
    selectedAgent !== "all" ||
    selectedCity !== "all" ||
    selectedPriority !== "all" ||
    selectedBudgetRange !== "all" ||
    sortBy !== "newest";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Pipeline Management</span>
            <span>•</span>
            <span className="text-[#EE6427] font-bold">{leads.length} Total Leads</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Buyer & Investor Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and route enquiries from Facebook Ads, Zameen.com, and WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            + New Lead
          </button>
        </div>
      </div>

      {/* Speed-to-Lead SLA Alert Banner */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-[#EE6427]/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EE6427] text-white flex items-center justify-center font-bold shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Speed-to-Lead 5-Minute SLA Active</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#EE6427] text-white font-mono">
                391% Conversion Boost
              </span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Inquiries contacted within 5 minutes convert 21x faster. Auto-escalates to management if uncontacted.
            </p>
          </div>
        </div>

        <Link
          href="/speed-to-lead"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#EE6427] hover:bg-[#DE5518] text-white shadow-xs transition-colors shrink-0"
        >
          <span>SLA Radar & Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Pipeline Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 text-xs">
        <button
          onClick={() => {
            setArchiveFilter("active");
            setCurrentPage(1);
          }}
          className={`pb-2.5 px-3 font-semibold transition-all border-b-2 ${
            archiveFilter === "active"
              ? "border-[#EE6427] text-[#EE6427]"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Active Pipeline ({leads.filter((l) => !l.isArchived).length})
        </button>
        <button
          onClick={() => {
            setArchiveFilter("archived");
            setCurrentPage(1);
          }}
          className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
            archiveFilter === "archived"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Archived Leads ({leads.filter((l) => l.isArchived).length})
        </button>
        <button
          onClick={() => {
            setArchiveFilter("all");
            setCurrentPage(1);
          }}
          className={`pb-2.5 px-3 font-semibold transition-all border-b-2 ${
            archiveFilter === "all"
              ? "border-[#EE6427] text-[#EE6427]"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          All Records ({leads.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, phone (+92...), DHA, Bahria..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Stages</option>
              <option value="new">New Enquiry</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="follow_up">Follow-up Due</option>
              <option value="site_visit_scheduled">Site Visit Scheduled</option>
              <option value="negotiation">Under Negotiation</option>
              <option value="won">Deal Closed (Won)</option>
              <option value="lost">Lost / Dropped</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 font-semibold text-orange-950 dark:text-orange-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="newest">Sort: Newest Enquiries First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="budget_desc">Sort: Budget (High to Low)</option>
              <option value="budget_asc">Sort: Budget (Low to High)</option>
              <option value="name_asc">Sort: Client Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Lead Sources</option>
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="Zameen.com">Zameen.com</option>
              <option value="WhatsApp">WhatsApp Direct</option>
              <option value="Phone Call">Phone Inbound</option>
              <option value="Graana">Graana</option>
              <option value="Website Form">Website Form</option>
              <option value="Walk-in">Walk-in Client</option>
              <option value="Referral">Client Referral</option>
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <select
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Sales Agents</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>

          {/* City / Market Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Cities / Markets</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Lahore">Lahore</option>
              <option value="Multan">Multan</option>
              <option value="Overseas">Overseas (UK / UAE / US)</option>
            </select>
          </div>

          {/* Budget Range Filter */}
          <div>
            <select
              value={selectedBudgetRange}
              onChange={(e) => {
                setSelectedBudgetRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Budget Ranges</option>
              <option value="under_2cr">Under Rs. 2 Crore</option>
              <option value="2cr_5cr">Rs. 2 Cr - 5 Crore</option>
              <option value="5cr_10cr">Rs. 5 Cr - 10 Crore</option>
              <option value="above_10cr">Above Rs. 10 Crore</option>
            </select>
          </div>
        </div>

        {/* Filter Badges & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-800 dark:text-white">{filteredLeads.length}</span>{" "}
              matching results
            </span>
            <button
              onClick={resetFilters}
              className="text-[#EE6427] hover:text-[#DE5518] font-medium hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {paginatedLeads.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No matching leads found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, status filter, or clearing the selected lead source.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Lead Name & Contact</th>
                  <th className="py-3.5 px-4">Requirements & Location</th>
                  <th className="py-3.5 px-4">Budget (PKR)</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4 text-center">Speed-to-Lead SLA</th>
                  <th className="py-3.5 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedLeads.map((lead) => {
                  const statusConfig = getLeadStatusConfig(lead.status);
                  const priorityConfig = getPriorityConfig(lead.priority);
                  const agent = agents.find((a) => a.id === lead.assignedAgentId);

                  const waText = `Assalam-o-Alaikum ${lead.fullName}, this is regarding your enquiry for ${lead.propertyTypeInterest} in ${lead.preferredLocations[0] || "Islamabad"}.`;
                  const waLink = getWhatsAppLink(lead.phone, waText);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427] flex items-center gap-1.5"
                        >
                          {lead.fullName}
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="font-mono text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {formatPhoneNumber(lead.phone)}
                        </p>
                        {lead.email && (
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] truncate max-w-[160px]">
                            {lead.email}
                          </p>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {lead.propertyTypeInterest}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {lead.preferredLocations.join(", ")}
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Purpose: {lead.purpose}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {formatPKR(lead.budgetPKR)}
                        </span>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-semibold border ${priorityConfig.bg}`}
                          >
                            {priorityConfig.label}
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                          {lead.source}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Assigned Agent */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={agent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={agent?.name || "Agent"}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-none">
                              {agent?.name.split(" ")[0]}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
                              {agent?.role.split(" ")[0]}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Speed-to-Lead SLA Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <SLACountdownBadge
                          sla={computeLeadSLA(
                            lead,
                            agent?.name || "Unassigned",
                            defaultSpeedToLeadConfig
                          )}
                          onClick={() =>
                            setSlaModalLead(
                              computeLeadSLA(
                                lead,
                                agent?.name || "Unassigned",
                                defaultSpeedToLeadConfig
                              )
                            )
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSlaModalLead(
                                computeLeadSLA(
                                  lead,
                                  agent?.name || "Unassigned",
                                  defaultSpeedToLeadConfig
                                )
                              )
                            }
                            className="p-1.5 text-orange-600 hover:text-white hover:bg-[#EE6427] dark:hover:bg-[#EE6427] rounded-md transition-colors cursor-pointer"
                            title="Log First Contact (Stop SLA Timer)"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-[#EE6427] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                            title="WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (lead.isArchived) {
                                unarchiveLead(lead.id);
                              } else {
                                archiveLead(lead.id);
                              }
                            }}
                            className={`p-1.5 rounded-md transition-colors ${
                              lead.isArchived
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                : "text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            title={lead.isArchived ? "Restore to Active Pipeline" : "Archive Lead"}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          {isManager && (
                            <button
                              onClick={() => setLeadToDelete(lead)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                              title="Delete Lead (Manager/Owner Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 dark:bg-slate-800/70 border-t border-slate-200/80 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-md font-semibold text-xs transition-colors ${
                  currentPage === i + 1
                    ? "bg-[#EE6427] text-white"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Contact & SLA Stop Modal */}
      <QuickContactSLAModal
        isOpen={!!slaModalLead}
        onClose={() => setSlaModalLead(null)}
        leadSla={slaModalLead}
        onLogContactSuccess={(leadId, contactType, notes, responseMinutes) => {
          showToast(`First response logged in ${responseMinutes.toFixed(1)}m via ${contactType.toUpperCase()}!`, "success");
          setSlaModalLead(null);
        }}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        lead={editingLead}
        isOpen={!!editingLead}
        onClose={() => setEditingLead(null)}
      />

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Lead Record?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the record for{" "}
              <strong className="text-slate-900 dark:text-white">{leadToDelete.fullName}</strong>? Associated
              follow-ups and site visits will also be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteLead(leadToDelete.id);
                  setLeadToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
