"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Handshake,
  Plus,
  Calculator,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building,
  User,
  Phone,
  Banknote,
  FileCheck,
  ShieldCheck,
  Calendar,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Edit,
  Scale,
} from "lucide-react";
import { formatPKR } from "@/lib/formatters";
import api, { BackendDeal, PakistaniDealStage } from "@/lib/api";
import { useCRM } from "@/context/CRMContext";
import { AppShell } from "@/components/layout/AppShell";
import { CommissionCalculatorModal } from "@/components/deals/CommissionCalculatorModal";
import { DealModal } from "@/components/deals/DealModal";
import { AdvanceMilestoneModal } from "@/components/deals/AdvanceMilestoneModal";
import LegalDocumentsModal from "@/components/deals/LegalDocumentsModal";

interface StageConfig {
  id: PakistaniDealStage;
  label: string;
  sublabel: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  icon: any;
}

const STAGES: StageConfig[] = [
  {
    id: "token",
    label: "Token Stage",
    sublabel: "Initial Holding Advance",
    badgeBg: "bg-orange-50 dark:bg-orange-950/40 text-[#DE5518] dark:text-orange-400",
    textColor: "text-[#DE5518] dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-900/60",
    icon: Banknote,
  },
  {
    id: "bayana",
    label: "Bayana Stage",
    sublabel: "Signed Iqrarnama / Stamp Paper",
    badgeBg: "bg-amber-50 text-amber-700",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    icon: FileCheck,
  },
  {
    id: "noc_verification",
    label: "NOC & Verification",
    sublabel: "DHA / Society NDC Clearance",
    badgeBg: "bg-cyan-50 text-cyan-700",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
    icon: ShieldCheck,
  },
  {
    id: "final_transfer",
    label: "Final Transfer",
    sublabel: "Registry & Balance Settlement",
    badgeBg: "bg-purple-50 text-purple-700",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    icon: Building,
  },
  {
    id: "completed",
    label: "Completed & Settled",
    sublabel: "Commission Disbursed",
    badgeBg: "bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] dark:text-orange-400",
    textColor: "text-[#EE6427] dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-900/60",
    icon: CheckCircle2,
  },
];

export default function DealsPage() {
  return (
    <AppShell>
      <DealsContent />
    </AppShell>
  );
}

function DealsContent() {
  const { isAgent } = useCRM();
  const [deals, setDeals] = useState<BackendDeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Modals state
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);
  const [calculatorPrice, setCalculatorPrice] = useState<number>(50_000_000);
  const [dealModalOpen, setDealModalOpen] = useState<boolean>(false);
  const [selectedDealToEdit, setSelectedDealToEdit] = useState<BackendDeal | null>(null);
  const [advanceModalOpen, setAdvanceModalOpen] = useState<boolean>(false);
  const [selectedDealForAdvance, setSelectedDealForAdvance] = useState<BackendDeal | null>(null);
  const [advanceTargetStage, setAdvanceTargetStage] = useState<PakistaniDealStage | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState<boolean>(false);
  const [selectedDealForLegal, setSelectedDealForLegal] = useState<BackendDeal | null>(null);

  const handleOpenLegalDocs = (deal: BackendDeal) => {
    setSelectedDealForLegal(deal);
    setLegalModalOpen(true);
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const data = await api.deals.getAll();
      setDeals(data);
    } catch (err) {
      console.error("Failed to load deals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleAdvanceStage = (deal: BackendDeal) => {
    const nextStages: Record<string, PakistaniDealStage> = {
      token: "bayana",
      bayana: "noc_verification",
      noc_verification: "final_transfer",
      final_transfer: "completed",
    };

    const next = nextStages[deal.stage];
    if (!next) return;

    setSelectedDealForAdvance(deal);
    setAdvanceTargetStage(next);
    setAdvanceModalOpen(true);
  };

  const handleConfirmAdvance = async (payload: Partial<BackendDeal>) => {
    if (!selectedDealForAdvance || !advanceTargetStage) return;

    try {
      const updated = await api.deals.update(selectedDealForAdvance.id, {
        stage: advanceTargetStage,
        settlement_status:
          advanceTargetStage === "completed"
            ? "fully_settled"
            : selectedDealForAdvance.settlement_status,
        ...payload,
      });
      setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setAdvanceModalOpen(false);
      setSelectedDealForAdvance(null);
      setAdvanceTargetStage(null);
    } catch (err: any) {
      console.error("Failed to advance stage:", err);
      alert(`Could not advance stage: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to remove this deal?")) return;
    try {
      await api.deals.delete(dealId);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
    } catch (err: any) {
      alert(`Could not delete deal: ${err.message}`);
    }
  };

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = d.title?.toLowerCase().includes(q);
        const matchLead = d.lead_name?.toLowerCase().includes(q);
        const matchProp = d.property_title?.toLowerCase().includes(q);
        const matchIqrarnama = d.iqrarnama_number?.toLowerCase().includes(q);
        const matchReg = d.registry_number?.toLowerCase().includes(q);
        const matchAuth = d.noc_authority?.toLowerCase().includes(q);
        if (!matchTitle && !matchLead && !matchProp && !matchIqrarnama && !matchReg && !matchAuth) {
          return false;
        }
      }
      return true;
    });
  }, [deals, search, stageFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalDealValue = 0;
    let totalTokens = 0;
    let totalBayana = 0;
    let totalCommission = 0;
    let closedCommission = 0;

    deals.forEach((d) => {
      const val = Number(d.deal_value_pkr) || 0;
      const tok = Number(d.token_amount_pkr) || 0;
      const bay = Number(d.bayana_amount_pkr) || 0;
      const comm = Number(d.commission_pkr) || 0;

      if (d.stage !== "cancelled") {
        totalDealValue += val;
        totalTokens += tok;
        totalBayana += bay;
        totalCommission += comm;
      }
      if (d.stage === "completed") {
        closedCommission += comm;
      }
    });

    return {
      totalDealValue,
      totalTokens,
      totalBayana,
      totalCommission,
      closedCommission,
    };
  }, [deals]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 border border-orange-300 dark:border-orange-800">
              Pakistani Deal Flow Architecture
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Handshake className="w-7 h-7 text-[#EE6427]" />
            Deals & Commission Settlement Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Specialized Pakistani transaction stages: <strong>Token</strong> (Holding Advance) →{" "}
            <strong>Bayana</strong> (Iqrarnama) → <strong>NOC & NDC</strong> →{" "}
            <strong>Final Society Transfer & 50/50 Splits</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setCalculatorPrice(50_000_000);
              setCalculatorOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all"
          >
            <Calculator className="w-4 h-4 text-[#EE6427]" />
            Commission Calculator
          </button>

          <button
            onClick={() => {
              if (deals.length > 0) {
                handleOpenLegalDocs(deals[0]);
              } else {
                setSelectedDealForLegal(null);
                setLegalModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-sm transition-all"
          >
            <Scale className="w-4 h-4 text-[#EE6427]" />
            Legal Suite & Iqrarnama
          </button>

          <button
            onClick={() => {
              setSelectedDealToEdit(null);
              setDealModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold shadow-md shadow-md shadow-[#EE6427]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Initiate Deal / Token
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Pipeline Value */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Active Deal Volume
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatPKR(metrics.totalDealValue)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{deals.filter((d) => d.stage !== "completed" && d.stage !== "cancelled").length} active deal milestones</span>
          </div>
          <div className="absolute right-3 top-3 p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#EE6427]">
            <Handshake className="w-5 h-5" />
          </div>
        </div>

        {/* Token Money Secured */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Token Advance Secured
          </div>
          <div className="text-2xl font-black text-[#DE5518] dark:text-orange-400 font-mono">
            {formatPKR(metrics.totalTokens)}
          </div>
          <div className="text-xs text-[#EE6427] font-medium mt-1">
            Holding advances & booking locks
          </div>
          <div className="absolute right-3 top-3 p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#EE6427]">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* Projected 2% Brokerage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Total Pipeline Brokerage (2%)
          </div>
          <div className="text-2xl font-black text-[#EE6427] dark:text-orange-400 font-mono">
            {formatPKR(metrics.totalCommission)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            50% Agency / 50% Consultant Split
          </div>
          <div className="absolute right-3 top-3 p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#EE6427]">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        {/* Settled Commission */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Realized Closed Brokerage
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono">
            {formatPKR(metrics.closedCommission)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            Society transfers completed
          </div>
          <div className="absolute right-3 top-3 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, title, stamp #, NDC authority..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-[#EE6427]/60"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none"
          >
            <option value="all">All Deal Stages ({deals.length})</option>
            <option value="token">Stage 1: Token</option>
            <option value="bayana">Stage 2: Bayana (Iqrarnama)</option>
            <option value="noc_verification">Stage 3: NOC & NDC</option>
            <option value="final_transfer">Stage 4: Final Transfer</option>
            <option value="completed">Stage 5: Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 p-1 rounded-xl bg-slate-50 dark:bg-slate-800">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            Detailed Table
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
          Loading Pakistani deal pipeline...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] flex items-center justify-center mx-auto mb-3">
            <Handshake className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No deals found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Lock your first property deal at Token advance stage or calculate commission splits.
          </p>
          <button
            onClick={() => {
              setSelectedDealToEdit(null);
              setDealModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold transition-colors"
          >
            Initiate Deal / Token
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {STAGES.map((col) => {
            const colDeals = filteredDeals.filter((d) => d.stage === col.id);
            const colVolume = colDeals.reduce(
              (sum, d) => sum + (Number(d.deal_value_pkr) || 0),
              0
            );

            return (
              <div
                key={col.id}
                className="bg-slate-50/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-lg ${col.badgeBg}`}>
                      <col.icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white">{col.label}</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{col.sublabel}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs">
                    {colDeals.length}
                  </span>
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between">
                  <span>Total Volume:</span>
                  <span className="text-[#EE6427] dark:text-orange-400">{formatPKR(colVolume)}</span>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2.5">
                  {colDeals.map((deal) => {
                    const price = Number(deal.deal_value_pkr) || 0;
                    const comm = Number(deal.commission_pkr) || 0;
                    const agencyComm = Number(deal.agency_commission_pkr) || 0;
                    const agentComm = Number(deal.agent_commission_pkr) || 0;

                    return (
                      <div
                        key={deal.id}
                        className="p-3.5 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 shadow-sm hover:shadow-md transition-all space-y-2.5 text-left group"
                      >
                        {/* Title & Valuation */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427] transition-colors line-clamp-1">
                              {deal.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedDealToEdit(deal);
                                  setDealModalOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Edit Deal"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm font-black font-mono text-[#EE6427] dark:text-orange-400 mt-0.5">
                            {formatPKR(price)}
                          </div>
                        </div>

                        {/* Lead / Buyer Information */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-100 dark:border-slate-750">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{deal.lead_name || "Client"}</span>
                          </div>
                          {deal.property_title && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.property_title}</span>
                            </div>
                          )}
                        </div>

                        {/* STAGE SPECIFIC HIGHLIGHTS */}
                        {col.id === "token" && (
                          <div className="p-2 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/40 text-[10px] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-orange-950 dark:text-orange-200 font-bold">Token Advance:</span>
                              <span className="font-mono font-bold text-orange-950 dark:text-orange-100">
                                {formatPKR(Number(deal.token_amount_pkr) || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                              <span>Nature:</span>
                              <span className="capitalize font-semibold text-orange-950 dark:text-orange-200">
                                {deal.token_type?.replace("_", " ") || "Pakka Token"}
                              </span>
                            </div>
                          </div>
                        )}

                        {col.id === "bayana" && (
                          <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-[10px] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-amber-800 dark:text-amber-200 font-bold">Bayana Deposit:</span>
                              <span className="font-mono font-bold text-amber-900 dark:text-amber-100">
                                {formatPKR(Number(deal.bayana_amount_pkr) || 0)}
                              </span>
                            </div>
                            {deal.iqrarnama_number && (
                              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Iqrarnama:</span>
                                <span className="font-mono font-semibold text-amber-900 dark:text-amber-200 truncate max-w-[110px]">
                                  {deal.iqrarnama_number}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {col.id === "noc_verification" && (
                          <div className="p-2 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900/40 text-[10px] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-cyan-900 dark:text-cyan-200 font-bold truncate">
                                {deal.noc_authority || "Society Office"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>NDC Status:</span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold ${
                                  deal.ndc_cleared
                                    ? "bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200"
                                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                }`}
                              >
                                {deal.ndc_cleared ? "Cleared" : "Pending"}
                              </span>
                            </div>
                          </div>
                        )}

                        {col.id === "final_transfer" && (
                          <div className="p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 text-[10px] space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-purple-900 dark:text-purple-200 font-bold">Transfer / Reg #:</span>
                              <span className="font-mono font-bold text-purple-900 dark:text-purple-100 truncate max-w-[90px]">
                                {deal.registry_number || "In Office"}
                              </span>
                            </div>
                            {deal.transfer_date && (
                              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>Date:</span>
                                <span className="font-mono">{deal.transfer_date}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {col.id === "completed" && (
                          <div className="p-2 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/40 text-[10px] space-y-1">
                            <div className="flex justify-between items-center text-orange-950 dark:text-orange-100 font-bold">
                              <span>Gross Commission:</span>
                              <span className="font-mono">{formatPKR(comm)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-300 border-t border-orange-200/50 dark:border-orange-900/30 pt-0.5">
                              <span>Agency ({deal.agency_split_percentage}%):</span>
                              <span className="font-mono font-semibold">{formatPKR(agencyComm)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-300">
                              <span>Agent ({deal.agent_split_percentage}%):</span>
                              <span className="font-mono font-semibold text-[#EE6427] dark:text-orange-400">
                                {formatPKR(agentComm)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Advance Action & Legal Suite */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {col.id !== "completed" && (
                            <button
                              onClick={() => handleAdvanceStage(deal)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-900 hover:bg-[#EE6427] text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <span>
                                {col.id === "token" && "Advance to Bayana →"}
                                {col.id === "bayana" && "Advance to NOC Clearance →"}
                                {col.id === "noc_verification" && "Advance to Society Transfer →"}
                                {col.id === "final_transfer" && "Complete & Settle Split →"}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenLegalDocs(deal)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                            title="Generate Urdu/English Bayana Iqrarnama, Token Receipt, and FBR Tax Challan Slip"
                          >
                            <Scale className="w-3.5 h-3.5 text-[#EE6427]" />
                            <span>Legal Docs</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Deal Title & Buyer</th>
                  <th className="py-3 px-4">Milestone Stage</th>
                  <th className="py-3 px-4">Transaction Price</th>
                  <th className="py-3 px-4">Milestone Details</th>
                  <th className="py-3 px-4">Commission Split</th>
                  <th className="py-3 px-4">Settlement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDeals.map((deal) => {
                  const stageObj = STAGES.find((s) => s.id === deal.stage);
                  const price = Number(deal.deal_value_pkr) || 0;
                  const comm = Number(deal.commission_pkr) || 0;
                  const agencyComm = Number(deal.agency_commission_pkr) || 0;
                  const agentComm = Number(deal.agent_commission_pkr) || 0;

                  return (
                    <tr key={deal.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{deal.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {deal.lead_name || "Client"}
                          {deal.lead_phone && ` (${deal.lead_phone})`}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            stageObj?.badgeBg || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {stageObj?.label || deal.stage}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#EE6427] dark:text-orange-400">
                        {formatPKR(price)}
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        {deal.stage === "token" && (
                          <div>
                            <span className="font-semibold text-orange-950 dark:text-orange-200">
                              Token: {formatPKR(Number(deal.token_amount_pkr) || 0)}
                            </span>{" "}
                            <span className="text-slate-400">({deal.token_type})</span>
                          </div>
                        )}
                        {deal.stage === "bayana" && (
                          <div>
                            <span className="font-semibold text-amber-800">
                              Bayana: {formatPKR(Number(deal.bayana_amount_pkr) || 0)}
                            </span>
                            {deal.iqrarnama_number && (
                              <div className="text-slate-400 font-mono text-[10px]">
                                Stamp #{deal.iqrarnama_number}
                              </div>
                            )}
                          </div>
                        )}
                        {deal.stage === "noc_verification" && (
                          <div>
                            <span className="font-semibold text-cyan-900">{deal.noc_authority}</span>
                            <div className="text-[10px] text-slate-500">
                              NDC: {deal.ndc_cleared ? "Cleared" : "Pending"}
                            </div>
                          </div>
                        )}
                        {deal.stage === "final_transfer" && (
                          <div>
                            <span className="font-semibold text-purple-900">
                              Reg #{deal.registry_number || "TBD"}
                            </span>
                            {deal.transfer_date && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                {deal.transfer_date}
                              </div>
                            )}
                          </div>
                        )}
                        {deal.stage === "completed" && (
                          <span className="text-[#EE6427] dark:text-orange-400 font-semibold">
                            Registry & Handover Done
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatPKR(comm)}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Agency: {formatPKR(agencyComm)} | Agent: {formatPKR(agentComm)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            deal.settlement_status === "fully_settled"
                              ? "bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200"
                              : deal.settlement_status === "advance_released"
                              ? "bg-orange-100 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {deal.settlement_status?.replace("_", " ") || "Pending"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {deal.stage !== "completed" && (
                            <button
                              onClick={() => handleAdvanceStage(deal)}
                              className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 font-bold text-[10px] transition-colors"
                            >
                              Advance →
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenLegalDocs(deal)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-200"
                            title="Generate Legal Documents & Bayana Iqrarnama"
                          >
                            <Scale className="w-3.5 h-3.5 text-[#EE6427]" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDealToEdit(deal);
                              setDealModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission Split Calculator Modal */}
      <CommissionCalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        initialValuePKR={calculatorPrice}
      />

      {/* Deal Create / Edit Modal */}
      <DealModal
        isOpen={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
        onSaved={(saved) => {
          setDeals((prev) => {
            const idx = prev.findIndex((d) => d.id === saved.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = saved;
              return updated;
            }
            return [saved, ...prev];
          });
        }}
        dealToEdit={selectedDealToEdit}
      />

      {/* Milestone Advance Modal */}
      <AdvanceMilestoneModal
        isOpen={advanceModalOpen}
        onClose={() => {
          setAdvanceModalOpen(false);
          setSelectedDealForAdvance(null);
          setAdvanceTargetStage(null);
        }}
        deal={selectedDealForAdvance}
        targetStage={advanceTargetStage}
        onConfirm={handleConfirmAdvance}
      />

      {/* Official Legal Documents & Bayana Iqrarnama Modal */}
      <LegalDocumentsModal
        isOpen={legalModalOpen}
        onClose={() => {
          setLegalModalOpen(false);
          setSelectedDealForLegal(null);
        }}
        deal={selectedDealForLegal}
      />
    </div>
  );
}
