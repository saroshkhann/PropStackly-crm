"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Handshake,
  FileCheck,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Banknote,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatPKR } from "@/lib/formatters";
import api, {
  BackendDeal,
  PakistaniDealStage,
  TokenType,
  CommissionSide,
} from "@/lib/api";
import { useCRM } from "@/context/CRMContext";

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (deal: BackendDeal) => void;
  dealToEdit?: BackendDeal | null;
  defaultLeadId?: string;
  defaultPropertyId?: string;
}

const AUTHORITIES = [
  "DHA Islamabad / Rawalpindi",
  "DHA Lahore",
  "Bahria Town Islamabad / Rawalpindi",
  "Bahria Town Lahore",
  "CDA (Capital Development Authority) Islamabad",
  "RDA (Rawalpindi Development Authority)",
  "LDA (Lahore Development Authority)",
  "Gulberg Greens Islamabad",
  "Sub-Registrar District Court Registry",
  "Other Housing Society Office",
];

export function DealModal({
  isOpen,
  onClose,
  onSaved,
  dealToEdit,
  defaultLeadId,
  defaultPropertyId,
}: DealModalProps) {
  const { leads, properties, agents, isAgent, currentAgent } = useCRM();

  const [leadId, setLeadId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [stage, setStage] = useState<PakistaniDealStage>("token");
  const [dealValuePKR, setDealValuePKR] = useState<number>(0);

  // Stage 1: Token
  const [tokenAmountPKR, setTokenAmountPKR] = useState<number>(0);
  const [tokenDate, setTokenDate] = useState<string>("");
  const [tokenType, setTokenType] = useState<TokenType>("pakka_token");

  // Stage 2: Bayana
  const [bayanaAmountPKR, setBayanaAmountPKR] = useState<number>(0);
  const [bayanaDate, setBayanaDate] = useState<string>("");
  const [iqrarnamaNumber, setIqrarnamaNumber] = useState<string>("");

  // Stage 3: NOC & Clearance
  const [nocAuthority, setNocAuthority] = useState<string>("DHA Islamabad / Rawalpindi");
  const [ndcCleared, setNdcCleared] = useState<boolean>(false);

  // Stage 4: Transfer & Registry
  const [transferDate, setTransferDate] = useState<string>("");
  const [registryNumber, setRegistryNumber] = useState<string>("");

  // Commission & Splits
  const [commissionSide, setCommissionSide] = useState<CommissionSide>("both_sides_2pct");
  const [customPct, setCustomPct] = useState<number>(2.0);
  const [agencySplit, setAgencySplit] = useState<number>(50);
  const [settlementStatus, setSettlementStatus] = useState<string>("pending");
  const [expectedCloseDate, setExpectedCloseDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDealsByLead, setActiveDealsByLead] = useState<Record<string, BackendDeal>>({});

  useEffect(() => {
    if (isOpen) {
      api.deals
        .getAll()
        .then((allDeals) => {
          const map: Record<string, BackendDeal> = {};
          allDeals.forEach((d) => {
            if (d.stage !== "cancelled" && (!dealToEdit || d.id !== dealToEdit.id)) {
              map[d.lead_id] = d;
            }
          });
          setActiveDealsByLead(map);
        })
        .catch(() => {});
    }
  }, [isOpen, dealToEdit]);

  useEffect(() => {
    if (dealToEdit) {
      setLeadId(dealToEdit.lead_id || "");
      setPropertyId(dealToEdit.property_id || "");
      setAgentId(dealToEdit.agent_id || "");
      setTitle(dealToEdit.title || "");
      setStage(dealToEdit.stage || "token");
      setDealValuePKR(Number(dealToEdit.deal_value_pkr) || 0);

      setTokenAmountPKR(Number(dealToEdit.token_amount_pkr) || 0);
      setTokenDate(dealToEdit.token_date || "");
      setTokenType(dealToEdit.token_type || "pakka_token");

      setBayanaAmountPKR(Number(dealToEdit.bayana_amount_pkr) || 0);
      setBayanaDate(dealToEdit.bayana_date || "");
      setIqrarnamaNumber(dealToEdit.iqrarnama_number || "");

      setNocAuthority(dealToEdit.noc_authority || "DHA Islamabad / Rawalpindi");
      setNdcCleared(!!dealToEdit.ndc_cleared);

      setTransferDate(dealToEdit.transfer_date || "");
      setRegistryNumber(dealToEdit.registry_number || "");

      setCommissionSide(dealToEdit.commission_side || "both_sides_2pct");
      setCustomPct(Number(dealToEdit.commission_percentage) || 2.0);
      setAgencySplit(Number(dealToEdit.agency_split_percentage) || 50);
      setSettlementStatus(dealToEdit.settlement_status || "pending");
      setExpectedCloseDate(dealToEdit.expected_close_date || "");
      setNotes(dealToEdit.notes || "");
    } else {
      // Default new deal
      const lid = defaultLeadId || (leads[0]?.id || "");
      setLeadId(lid);
      const pid = defaultPropertyId || "";
      setPropertyId(pid);

      const selLead = leads.find((l) => l.id === lid);
      // Auto-assign to lead's assigned agent, or fallback to current agent
      setAgentId(selLead?.assignedAgentId || (isAgent ? currentAgent?.id : "") || "");

      setStage("token");
      setTokenDate(new Date().toISOString().split("T")[0]);
      setTokenType("pakka_token");
      setNocAuthority("DHA Islamabad / Rawalpindi");
      setNdcCleared(false);
      setCommissionSide("both_sides_2pct");
      setAgencySplit(50);
      setSettlementStatus("pending");

      // Auto-set title & price if lead & property available
      const selProp = properties.find((p) => p.id === pid);
      if (selProp) {
        setTitle(`${selProp.title} - ${selLead?.fullName || (selLead as any)?.name || "Client"} Deal`);
        setDealValuePKR(Number(selProp.pricePKR) || 0);
        setTokenAmountPKR(Math.round((Number(selProp.pricePKR) || 0) * 0.02)); // 2% token standard
      } else if (selLead) {
        setTitle(`${selLead.fullName || (selLead as any)?.name} - Property Purchase`);
        setDealValuePKR(Number(selLead.budgetPKR) || 0);
        setTokenAmountPKR(Math.round((Number(selLead.budgetPKR) || 0) * 0.02));
      } else {
        setTitle("New Deal");
        setDealValuePKR(50_000_000);
        setTokenAmountPKR(1_000_000);
      }
    }
    setError(null);
  }, [dealToEdit, defaultLeadId, defaultPropertyId, isOpen, leads, properties]);

  if (!isOpen) return null;

  // Recalculate token/bayana when deal price changes if user hasn't edited
  const handlePropertyChange = (newPropId: string) => {
    setPropertyId(newPropId);
    const p = properties.find((item) => item.id === newPropId);
    if (p) {
      const price = Number(p.pricePKR) || 0;
      setDealValuePKR(price);
      if (!dealToEdit) {
        setTokenAmountPKR(Math.round(price * 0.02)); // standard 2% token advance
        setBayanaAmountPKR(Math.round(price * 0.15)); // standard 15% bayana
        const selLead = leads.find((l) => l.id === leadId);
        setTitle(`${p.title} - ${selLead?.fullName || (selLead as any)?.name || "Client"} Deal`);
      }
    }
  };

  const handleLeadChange = (newLeadId: string) => {
    setLeadId(newLeadId);
    const sel = leads.find((l) => l.id === newLeadId);
    if (sel?.assignedAgentId && !dealToEdit) {
      setAgentId(sel.assignedAgentId);
    }
    if (sel && !propertyId && !dealToEdit) {
      setTitle(`${sel.fullName || (sel as any)?.name} - Property Purchase`);
      setDealValuePKR(Number(sel.budgetPKR) || 0);
      setTokenAmountPKR(Math.round((Number(sel.budgetPKR) || 0) * 0.02));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      setError("Please select a Lead to attach this deal to.");
      return;
    }
    const selectedLeadActiveDeal = !dealToEdit && leadId ? activeDealsByLead[leadId] : null;
    if (selectedLeadActiveDeal) {
      setError(`An active deal '${selectedLeadActiveDeal.title}' already exists for this client in ${selectedLeadActiveDeal.stage.toUpperCase()} stage.`);
      return;
    }
    if (!title.trim()) {
      setError("Please enter a Deal Title.");
      return;
    }
    if (dealValuePKR <= 0) {
      setError("Please specify a valid property transaction value.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const agentSplit = 100 - agencySplit;
      let effectivePct = 2.0;
      if (commissionSide === "both_sides_2pct") effectivePct = 2.0;
      else if (commissionSide === "buyer_side_1pct" || commissionSide === "seller_side_1pct") effectivePct = 1.0;
      else if (commissionSide === "custom") effectivePct = Number(customPct) || 2.0;

      const payload: Partial<BackendDeal> = {
        lead_id: leadId,
        property_id: propertyId || undefined,
        agent_id: agentId || undefined,
        title: title.trim(),
        stage,
        deal_value_pkr: dealValuePKR,
        token_amount_pkr: tokenAmountPKR,
        token_date: tokenDate || undefined,
        token_type: tokenType,
        bayana_amount_pkr: bayanaAmountPKR,
        bayana_date: bayanaDate || undefined,
        iqrarnama_number: iqrarnamaNumber.trim() || undefined,
        noc_authority: nocAuthority,
        ndc_cleared: ndcCleared,
        transfer_date: transferDate || undefined,
        registry_number: registryNumber.trim() || undefined,
        commission_side: commissionSide,
        commission_percentage: effectivePct,
        agency_split_percentage: agencySplit,
        agent_split_percentage: agentSplit,
        settlement_status: settlementStatus,
        expected_close_date: expectedCloseDate || undefined,
        notes: notes.trim() || undefined,
      };

      let result: BackendDeal;
      if (dealToEdit) {
        result = await api.deals.update(dealToEdit.id, payload);
      } else {
        result = await api.deals.create(payload);
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      console.error("Failed to save deal:", err);
      setError(err.message || "Failed to save deal. Please check required fields.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {dealToEdit ? "Edit Pakistani Deal" : "Initiate Pakistani Real Estate Deal"}
              </h2>
              <p className="text-xs text-slate-300">
                Milestone flow: Token (Advance) → Bayana (Iqrarnama) → NOC Clearance → Final Transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Deal Stage Selection Ribbon */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Current Pakistani Deal Stage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: "token", label: "1. Token", sub: "Holding Advance" },
                { id: "bayana", label: "2. Bayana", sub: "Legal Iqrarnama" },
                { id: "noc_verification", label: "3. NOC / NDC", sub: "Society Clearance" },
                { id: "final_transfer", label: "4. Transfer", sub: "Registry & Balance" },
                { id: "completed", label: "5. Completed", sub: "Commission Settled" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id as PakistaniDealStage)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    stage === s.id
                      ? "border-[#EE6427] bg-orange-50 dark:bg-orange-950/40 ring-2 ring-[#EE6427]/20 text-slate-900 dark:text-white"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
                  }`}
                >
                  <div className="text-xs font-bold text-orange-950 dark:text-orange-200">{s.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Lead & Property Association */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Client / Lead *
              </label>
              <select
                value={leadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-none"
              >
                <option value="">-- Select Buyer Lead --</option>
                {leads.map((l) => {
                  const hasActive = !dealToEdit && activeDealsByLead[l.id];
                  return (
                    <option key={l.id} value={l.id}>
                      {l.fullName || (l as any).name} ({l.phone}) - {formatPKR(l.budgetPKR)} {hasActive ? "⚠️ (Deal in Pipeline)" : ""}
                    </option>
                  );
                })}
              </select>
              {!dealToEdit && leadId && activeDealsByLead[leadId] && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Deal Already In Progress:</span> This client already has an active deal (
                    <strong>{activeDealsByLead[leadId].title}</strong> in <strong>{activeDealsByLead[leadId].stage.toUpperCase()}</strong> stage).
                    Duplicate deals are locked.
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Consultant
              </label>
              {isAgent ? (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold truncate">
                  {currentAgent?.name || "Assigned Consultant"}
                </div>
              ) : (
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-none"
                >
                  <option value="">-- Lead&apos;s Assigned Consultant --</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.role || "Consultant"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Property Inventory (Optional)
              </label>
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-none"
              >
                <option value="">-- No specific inventory linked --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.society}) - {formatPKR(p.pricePKR)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Valuation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. 1 Kanal DHA Phase 2 Villa Deal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deal Price (PKR) *
                </label>
                <span className="text-xs font-bold text-[#EE6427] dark:text-orange-400 font-mono">
                  {formatPKR(dealValuePKR)}
                </span>
              </div>
              <input
                type="number"
                min={0}
                step="any"
                value={dealValuePKR || ""}
                onChange={(e) => setDealValuePKR(Number(e.target.value) || 0)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-semibold focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-none"
                placeholder="85000000"
              />
            </div>
          </div>

          {/* CONDITIONAL STAGE SPECIFICS */}

          {/* Stage 1: Token Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950 dark:text-orange-200 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-[#EE6427]" /> Stage 1: Token Advance
                (Booking Lock)
              </span>
              <span className="text-xs font-mono font-bold text-[#EE6427] dark:text-orange-400">
                {formatPKR(tokenAmountPKR)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Token Amount (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={tokenAmountPKR || ""}
                  onChange={(e) => setTokenAmountPKR(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. 1000000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Token Paid Date
                </label>
                <input
                  type="date"
                  value={tokenDate}
                  onChange={(e) => setTokenDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Token Legal Nature
                </label>
                <select
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value as TokenType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pakka_token">Pakka Token (Legally Binding Advance)</option>
                  <option value="kacha_token">Kacha Token (Conditional Holding Lock)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stage 2: Bayana Details */}
          {(stage === "bayana" ||
            stage === "noc_verification" ||
            stage === "final_transfer" ||
            stage === "completed") && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" /> Stage 2: Bayana (Formal Agreement & Iqrarnama)
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                  {formatPKR(bayanaAmountPKR)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Bayana Paid Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={bayanaAmountPKR || ""}
                    onChange={(e) => setBayanaAmountPKR(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 text-xs font-mono font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. 15000000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Iqrarnama / Stamp Paper #
                  </label>
                  <input
                    type="text"
                    value={iqrarnamaNumber}
                    onChange={(e) => setIqrarnamaNumber(e.target.value)}
                    placeholder="e.g. STAMP-ISB-2026-9812"
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                    Bayana Execution Date
                  </label>
                  <input
                    type="date"
                    value={bayanaDate}
                    onChange={(e) => setBayanaDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: NOC & Clearance Details */}
          {(stage === "noc_verification" ||
            stage === "final_transfer" ||
            stage === "completed") && (
            <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-950 dark:text-orange-100 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#DE5518] dark:text-orange-400" /> Stage 3: Society NOC & Tax Verification
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    ndcCleared
                      ? "bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 border border-orange-300 dark:border-orange-800"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {ndcCleared ? "NDC Cleared" : "NDC In Progress"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-orange-950 dark:text-orange-100 mb-1">
                    Development Authority / Society Office
                  </label>
                  <select
                    value={nocAuthority}
                    onChange={(e) => setNocAuthority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-orange-300 dark:border-orange-800 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {AUTHORITIES.map((auth) => (
                      <option key={auth} value={auth}>
                        {auth}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ndcCleared}
                      onChange={(e) => setNdcCleared(e.target.checked)}
                      className="w-4 h-4 rounded text-[#EE6427] focus:ring-[#EE6427]/60 border-slate-300 accent-[#EE6427]"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      NDC (No Demand Certificate) & Dues Cleared
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Stage 4: Final Transfer Details */}
          {(stage === "final_transfer" || stage === "completed") && (
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-3">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-700 dark:text-purple-400" /> Stage 4: Society Transfer / Sub-Registrar
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-purple-900 dark:text-purple-200 mb-1">
                    Society Transfer / Registry Number
                  </label>
                  <input
                    type="text"
                    value={registryNumber}
                    onChange={(e) => setRegistryNumber(e.target.value)}
                    placeholder="e.g. DHA-TRF-2026-4491"
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-800 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-purple-900 dark:text-purple-200 mb-1">
                    Biometric Transfer Date
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-800 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Commission Settlement & Splits Architecture */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-[#EE6427]" /> Commission Split Settlement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Commission Side
                </label>
                <select
                  value={commissionSide}
                  onChange={(e) => setCommissionSide(e.target.value as CommissionSide)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="both_sides_2pct">Both Sides (1% Buyer + 1% Seller = 2%)</option>
                  <option value="buyer_side_1pct">Buyer Side Only (1%)</option>
                  <option value="seller_side_1pct">Seller Side Only (1%)</option>
                  <option value="custom">Custom Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Agency vs Agent Split
                </label>
                <select
                  value={agencySplit}
                  onChange={(e) => setAgencySplit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={50}>50% Agency / 50% Agent (Standard)</option>
                  <option value={60}>60% Agency / 40% Agent</option>
                  <option value={70}>70% Agency / 30% Agent</option>
                  <option value={40}>40% Agency / 60% Top Performer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Settlement Status
                </label>
                <select
                  value={settlementStatus}
                  onChange={(e) => setSettlementStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pending">Pending Settlement</option>
                  <option value="advance_released">Advance Split Released</option>
                  <option value="fully_settled">Fully Settled & Disbursed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes & Forfeiture Terms */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deal Notes, Payment Schedule, or Forfeiture Terms
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Remaining balance of Rs. 6.9 Crore payable via 2 Pay Orders to seller at DHA transfer appointment. Seller bears society transfer fee."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!dealToEdit && !!leadId && !!activeDealsByLead[leadId])}
              className="px-6 py-2.5 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-[#EE6427]/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>Saving Deal Record...</>
              ) : (
                <>
                  <Handshake className="w-4 h-4" />
                  {dealToEdit ? "Update Deal" : "Save Deal Milestone"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
