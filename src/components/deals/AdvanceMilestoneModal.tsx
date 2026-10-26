"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Handshake,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Building2,
  DollarSign,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { formatPKR } from "@/lib/formatters";
import { BackendDeal, PakistaniDealStage } from "@/lib/api";

interface AdvanceMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: BackendDeal | null;
  targetStage: PakistaniDealStage | null;
  onConfirm: (payload: Partial<BackendDeal>) => Promise<void>;
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

export function AdvanceMilestoneModal({
  isOpen,
  onClose,
  deal,
  targetStage,
  onConfirm,
}: AdvanceMilestoneModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage: Bayana state
  const [bayanaAmountPKR, setBayanaAmountPKR] = useState<number>(0);
  const [iqrarnamaNumber, setIqrarnamaNumber] = useState<string>("");
  const [bayanaDate, setBayanaDate] = useState<string>("");

  // Stage: NOC state
  const [nocAuthority, setNocAuthority] = useState<string>("DHA Islamabad / Rawalpindi");
  const [ndcCleared, setNdcCleared] = useState<boolean>(false);

  // Stage: Final Transfer state
  const [registryNumber, setRegistryNumber] = useState<string>("");
  const [transferDate, setTransferDate] = useState<string>("");

  // Stage: Completed state
  const [settlementStatus, setSettlementStatus] = useState<string>("fully_settled");

  useEffect(() => {
    if (!deal) return;
    setError(null);

    const todayStr = new Date().toISOString().split("T")[0];
    const price = Number(deal.deal_value_pkr) || 0;

    // Prefill Bayana fields
    const defaultBayana = Number(deal.bayana_amount_pkr) > 0
      ? Number(deal.bayana_amount_pkr)
      : Math.round(price * 0.15) || 1_500_000;

    setBayanaAmountPKR(defaultBayana);
    setIqrarnamaNumber(deal.iqrarnama_number || `IQR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setBayanaDate(deal.bayana_date || todayStr);

    // Prefill NOC fields
    setNocAuthority(deal.noc_authority || "DHA Islamabad / Rawalpindi");
    setNdcCleared(deal.ndc_cleared ?? true);

    // Prefill Transfer fields
    setRegistryNumber(deal.registry_number || `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setTransferDate(deal.transfer_date || todayStr);

    // Prefill Completed fields
    setSettlementStatus(deal.settlement_status || "fully_settled");
  }, [deal, targetStage]);

  if (!isOpen || !deal || !targetStage) return null;

  const dealValue = Number(deal.deal_value_pkr) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload: Partial<BackendDeal> = {};

      if (targetStage === "bayana") {
        if (bayanaAmountPKR <= 0) {
          setError("Please specify a valid Bayana deposit amount (greater than 0).");
          setSubmitting(false);
          return;
        }
        payload.bayana_amount_pkr = bayanaAmountPKR;
        payload.iqrarnama_number = iqrarnamaNumber.trim() || undefined;
        payload.bayana_date = bayanaDate || undefined;
      } else if (targetStage === "noc_verification") {
        payload.noc_authority = nocAuthority;
        payload.ndc_cleared = ndcCleared;
      } else if (targetStage === "final_transfer") {
        payload.registry_number = registryNumber.trim() || undefined;
        payload.transfer_date = transferDate || undefined;
      } else if (targetStage === "completed") {
        payload.settlement_status = settlementStatus;
      }

      await onConfirm(payload);
    } catch (err: any) {
      setError(err.message || "Failed to advance stage.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center shrink-0">
              {targetStage === "bayana" && <FileText className="w-5 h-5" />}
              {targetStage === "noc_verification" && <ShieldCheck className="w-5 h-5" />}
              {targetStage === "final_transfer" && <Building2 className="w-5 h-5" />}
              {targetStage === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {targetStage === "bayana" && "Advance to Bayana Stage"}
                {targetStage === "noc_verification" && "Advance to NOC Clearance"}
                {targetStage === "final_transfer" && "Advance to Society Transfer"}
                {targetStage === "completed" && "Complete Deal & Settle Commission"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                {deal.title} • {deal.lead_name || "Client"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Deal Value Pill */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
              Property Transaction Value:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
              {formatPKR(dealValue)}
            </span>
          </div>

          {/* TARGET: BAYANA FORM */}
          {targetStage === "bayana" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Bayana Deposit Amount (PKR) *
                  </label>
                  <span className="text-xs font-bold font-mono text-[#EE6427] dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800/60">
                    {formatPKR(bayanaAmountPKR)}
                  </span>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6427] focus-within:border-[#EE6427] transition-all">
                  <span className="px-3.5 py-2.5 bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] dark:text-orange-400 font-black text-xs border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                    PKR
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={bayanaAmountPKR || ""}
                    placeholder="e.g. 1500000"
                    onChange={(e) => setBayanaAmountPKR(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                  {[
                    { label: "10%", val: Math.round(dealValue * 0.1) },
                    { label: "15%", val: Math.round(dealValue * 0.15) },
                    { label: "20%", val: Math.round(dealValue * 0.2) },
                    { label: "15 Lakh", val: 1_500_000 },
                    { label: "25 Lakh", val: 2_500_000 },
                    { label: "50 Lakh", val: 5_000_000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBayanaAmountPKR(preset.val)}
                      className={`text-[10px] px-2 py-1 rounded-md border transition-all cursor-pointer font-semibold ${
                        bayanaAmountPKR === preset.val
                          ? "bg-[#EE6427] text-white border-[#EE6427]"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Iqrarnama & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Signed Iqrarnama / Stamp #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STAMP-ISB-2026-8812"
                    value={iqrarnamaNumber}
                    onChange={(e) => setIqrarnamaNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Official stamp paper identification</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bayana Agreement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bayanaDate}
                    onChange={(e) => setBayanaDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Execution / signing date</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Pakistani Real Estate Standard:</strong> Bayana represents earnest money agreement (typically 10%–20%) locking the property legally before NDC and housing society NOC verification.
              </div>
            </div>
          )}

          {/* TARGET: NOC VERIFICATION FORM */}
          {targetStage === "noc_verification" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Housing Society / Development Authority *
                </label>
                <select
                  value={nocAuthority}
                  onChange={(e) => setNocAuthority(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                >
                  {AUTHORITIES.map((auth) => (
                    <option key={auth} value={auth}>
                      {auth}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={ndcCleared}
                  onChange={(e) => setNdcCleared(e.target.checked)}
                  className="mt-0.5 rounded text-[#EE6427] focus:ring-[#EE6427]"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    NDC (No Demand Certificate) Cleared
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Confirm all outstanding society dues, utility bills, and transfer charges are cleared.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* TARGET: FINAL TRANSFER FORM */}
          {targetStage === "final_transfer" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Transfer / Registry Deed # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REG-ISB-2026-9912"
                    value={registryNumber}
                    onChange={(e) => setRegistryNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TARGET: COMPLETED FORM */}
          {targetStage === "completed" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-100">
                  <span>Gross Realized Commission (2%):</span>
                  <span className="font-mono text-sm">{formatPKR(Number(deal.commission_pkr) || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-200 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40">
                  <span>Agency Share ({deal.agency_split_percentage}%):</span>
                  <span className="font-mono font-semibold">{formatPKR(Number(deal.agency_commission_pkr) || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-200">
                  <span>Agent Payout ({deal.agent_split_percentage}%):</span>
                  <span className="font-mono font-semibold text-[#EE6427] dark:text-orange-400">
                    {formatPKR(Number(deal.agent_commission_pkr) || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Commission Settlement Status
                </label>
                <select
                  value={settlementStatus}
                  onChange={(e) => setSettlementStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                >
                  <option value="fully_settled">Fully Settled (Commission received & splits paid)</option>
                  <option value="pending">Pending (Awaiting pay-order or cheque clearance)</option>
                  <option value="partially_settled">Partially Settled</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 rounded-xl shadow-md shadow-[#EE6427]/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "Advancing..." : `Confirm & Advance →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
