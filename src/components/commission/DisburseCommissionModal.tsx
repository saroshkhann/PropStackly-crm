"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  User,
  CreditCard,
  Building2,
  FileCheck2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  AgentWallet,
  DealCommissionItem,
  CommissionDeduction,
  CommissionPayoutVoucher,
} from "@/types/commissionLedger";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface DisburseCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentWallet[];
  dealCommissions: DealCommissionItem[];
  preselectedAgentId?: string;
  onDisburseSuccess: (
    voucher: CommissionPayoutVoucher,
    settledDealIds: string[],
    advanceRecoveredAmount: number
  ) => void;
}

export function DisburseCommissionModal({
  isOpen,
  onClose,
  agents,
  dealCommissions,
  preselectedAgentId,
  onDisburseSuccess,
}: DisburseCommissionModalProps) {
  const { settings, currentAgent } = useCRM();

  // Selected agent
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    preselectedAgentId || agents[0]?.agentId || ""
  );

  useEffect(() => {
    if (preselectedAgentId) {
      setSelectedAgentId(preselectedAgentId);
    } else if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].agentId);
    }
  }, [preselectedAgentId, agents, selectedAgentId]);

  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId);

  // Available unsettled deals for this agent
  const agentDeals = dealCommissions.filter(
    (d) => d.agentId === selectedAgentId && d.commissionStatus !== "settled"
  );

  // Selected deal IDs to include in this payout
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Reset selected deals when agent changes
  useEffect(() => {
    if (agentDeals.length > 0) {
      setSelectedDealIds(agentDeals.map((d) => d.id));
    } else {
      setSelectedDealIds([]);
    }
  }, [selectedAgentId, dealCommissions]);

  // Deductions state
  const [deductions, setDeductions] = useState<
    { id: string; type: any; description: string; amountPKR: number }[]
  >([]);

  // Advance loan deduction
  const [recoverAdvanceAmount, setRecoverAdvanceAmount] = useState<number>(0);

  useEffect(() => {
    if (selectedAgent && selectedAgent.advanceBalancePKR > 0) {
      // suggest up to available advance or deal earnings
      setRecoverAdvanceAmount(Math.min(selectedAgent.advanceBalancePKR, 50_000));
    } else {
      setRecoverAdvanceAmount(0);
    }
  }, [selectedAgent]);

  // Tax withholding
  const [applyWhtTax, setApplyWhtTax] = useState<boolean>(true);
  const whtTaxRate = 0.12; // 12% FBR Section 233

  // Payment details
  const [paymentMode, setPaymentMode] = useState<"IBFT_Bank_Transfer" | "Cross_Cheque" | "Cash">(
    "IBFT_Bank_Transfer"
  );
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    // Generate dummy ref
    if (paymentMode === "IBFT_Bank_Transfer") {
      setTransactionRef(`IBFT-${Math.floor(1000000 + Math.random() * 9000000)}`);
    } else if (paymentMode === "Cross_Cheque") {
      setTransactionRef(`CHQ-${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      setTransactionRef("CASH-IN-HAND");
    }
  }, [paymentMode]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Calculations
  const dealsIncluded = agentDeals.filter((d) => selectedDealIds.includes(d.id));
  const grossCommission = dealsIncluded.reduce((sum, d) => sum + d.agentSharePKR, 0);

  const customDeductionsTotal = deductions.reduce((sum, d) => sum + Number(d.amountPKR || 0), 0);
  const totalDeductions = customDeductionsTotal + Number(recoverAdvanceAmount || 0);

  const baseForTax = Math.max(0, grossCommission - totalDeductions);
  const taxAmount = applyWhtTax ? Math.round(baseForTax * whtTaxRate) : 0;
  const netPayable = Math.max(0, grossCommission - totalDeductions - taxAmount);

  // Toggle deal selection
  const toggleDeal = (dealId: string) => {
    setSelectedDealIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  };

  // Add custom deduction row
  const addDeductionRow = (type: any, desc: string, amt: number) => {
    setDeductions((prev) => [
      ...prev,
      {
        id: `ded-${Date.now()}-${Math.random()}`,
        type,
        description: desc,
        amountPKR: amt,
      },
    ]);
  };

  const removeDeductionRow = (id: string) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (dealsIncluded.length === 0) {
      alert("Please select at least one deal to disburse commission.");
      return;
    }

    if (netPayable <= 0 && totalDeductions === 0) {
      alert("Total commission payable must be greater than zero.");
      return;
    }

    const allDeductions: CommissionDeduction[] = [...deductions];
    if (recoverAdvanceAmount > 0) {
      allDeductions.push({
        id: `adv-rec-${Date.now()}`,
        type: "advance_recovery",
        description: `Deduction against active cash advance loan (Bal: ${formatPKR(selectedAgent?.advanceBalancePKR || 0)})`,
        amountPKR: recoverAdvanceAmount,
      });
    }

    const newVoucher: CommissionPayoutVoucher = {
      id: `vch-${Date.now()}`,
      voucherNumber: `VCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      payoutDate: new Date().toISOString().split("T")[0],
      agentId: selectedAgent?.agentId || "",
      agentName: selectedAgent?.agentName || "",
      agentCnic: selectedAgent?.cnic || "",
      agentPhone: selectedAgent?.phone || "",
      bankName: selectedAgent?.bankName || "",
      iban: selectedAgent?.iban || "",
      accountTitle: selectedAgent?.accountTitle || "",
      deals: dealsIncluded.map((d) => ({
        dealNumber: d.dealNumber,
        dealTitle: d.dealTitle,
        society: d.society,
        dealValuePKR: d.dealValuePKR,
        grossCommissionPKR: d.grossCommissionPKR,
        agentSplitPct: d.agentSplitPct,
        agentSharePKR: d.agentSharePKR,
      })),
      grossEarnedPKR: grossCommission,
      deductions: allDeductions,
      totalDeductionsPKR: totalDeductions,
      whtTaxPct: applyWhtTax ? 12 : 0,
      whtTaxAmountPKR: taxAmount,
      netDisbursedPKR: netPayable,
      paymentMode,
      transactionRef: transactionRef || "COMPLETED-CASH",
      approvedBy: currentAgent?.name ? `${currentAgent.name} (Authorized)` : "CEO - PropStackly Realty",
      notes: notes || "Commission settled successfully through PropStackly Hisab-Kitab.",
      createdAt: new Date().toISOString(),
    };

    onDisburseSuccess(newVoucher, selectedDealIds, recoverAdvanceAmount);
    onClose();
  };

  if (!isOpen || !selectedAgent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Cross Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-300/80 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 group"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 pr-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Disburse Agent Commission (کمیشن ادائیگی)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Settle closed deal commission, deduct marketing/advances, and generate official voucher
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Agent Selection & Wallet Profile */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Select Sales Agent / Broker</span>
              <span className="text-[11px] font-normal text-slate-500">
                Tier & Commission Agreement
              </span>
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
            >
              {agents.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.agentName} ({agent.role}) - {agent.tier} - Unsettled Balance: {formatPKR(agent.netAvailablePKR)}
                </option>
              ))}
            </select>

            {/* Agent Info Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <p className="text-[11px] text-slate-500">Commission Tier</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedAgent.tier}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Beneficiary Bank</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                  {selectedAgent.bankName}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Active Advance Loan</p>
                <p className={`font-bold mt-0.5 ${selectedAgent.advanceBalancePKR > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                  {formatPKR(selectedAgent.advanceBalancePKR)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Total Deals Closed</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedAgent.dealsClosedCount} Deals
                </p>
              </div>
            </div>
          </div>

          {/* Deals Included Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Select Completed Deals to Settle ({dealsIncluded.length} selected)
              </label>
              <span className="text-xs font-bold text-[#EE6427]">
                Gross Share: {formatPKR(grossCommission)}
              </span>
            </div>

            {agentDeals.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                No unsettled closed deals found for {selectedAgent.agentName}. All deals are paid or in pipeline.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {agentDeals.map((deal) => {
                  const isChecked = selectedDealIds.includes(deal.id);
                  return (
                    <label
                      key={deal.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-orange-50/70 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800"
                          : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDeal(deal.id)}
                          className="w-4 h-4 rounded text-[#EE6427] focus:ring-[#EE6427] border-slate-300"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {deal.dealNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {deal.society}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {deal.dealTitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {formatPKR(deal.agentSharePKR)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {deal.agentSplitPct}% of {formatPKR(deal.grossCommissionPKR)}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deductions & Advance Recovery Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Deductions, Marketing Costs & Loan Recoveries
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addDeductionRow("portal_marketing", "Zameen Featured Listing Fee", 8500)}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  + Zameen Ad
                </button>
                <button
                  type="button"
                  onClick={() => addDeductionRow("fuel_travel", "Site Visit Fuel & Car Allowance", 5000)}
                  className="px-2 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  + Fuel
                </button>
              </div>
            </div>

            {/* Advance Loan Deduction Slider/Input */}
            {selectedAgent.advanceBalancePKR > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-950 dark:text-rose-300">
                    Recover Against Outstanding Advance Loan (Active: {formatPKR(selectedAgent.advanceBalancePKR)})
                  </span>
                  <span className="font-bold font-mono text-rose-700 dark:text-rose-400">
                    - {formatPKR(recoverAdvanceAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={Math.min(selectedAgent.advanceBalancePKR, grossCommission)}
                    step={5000}
                    value={recoverAdvanceAmount}
                    onChange={(e) => setRecoverAdvanceAmount(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                  <input
                    type="number"
                    value={recoverAdvanceAmount}
                    onChange={(e) => setRecoverAdvanceAmount(Number(e.target.value))}
                    className="w-28 px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Custom Deduction Rows */}
            {deductions.map((ded) => (
              <div
                key={ded.id}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs"
              >
                <select
                  value={ded.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDeductions((prev) =>
                      prev.map((item) => (item.id === ded.id ? { ...item, type: val } : item))
                    );
                  }}
                  className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="portal_marketing">Portal / Ads (Zameen/Graana)</option>
                  <option value="fuel_travel">Fuel & Travel</option>
                  <option value="client_entertainment">Client Entertainment</option>
                  <option value="office_admin_fee">Office Admin / Legal Fee</option>
                  <option value="other">Other Offset</option>
                </select>

                <input
                  type="text"
                  placeholder="Reason / Note"
                  value={ded.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDeductions((prev) =>
                      prev.map((item) => (item.id === ded.id ? { ...item, description: val } : item))
                    );
                  }}
                  className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />

                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Rs.</span>
                  <input
                    type="number"
                    value={ded.amountPKR}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDeductions((prev) =>
                        prev.map((item) => (item.id === ded.id ? { ...item, amountPKR: val } : item))
                      );
                    }}
                    className="w-24 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeDeductionRow(ded.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* FBR Section 233 Tax Withholding */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWhtTax}
                  onChange={(e) => setApplyWhtTax(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                />
                <span className="font-bold text-amber-950 dark:text-amber-300">
                  Withhold FBR Section 233 Tax (12% Filer Rate)
                </span>
              </label>
              {applyWhtTax && (
                <span className="font-bold font-mono text-rose-700 dark:text-rose-400">
                  - {formatPKR(taxAmount)}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-400 pl-6">
              Official FBR rate on real estate brokerage commission. Will appear on the agent payout voucher.
            </p>
          </div>

          {/* Payment Method & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="IBFT_Bank_Transfer">IBFT Online Bank Transfer</option>
                <option value="Cross_Cheque">Bank Cross Cheque</option>
                <option value="Cash">Cash in Hand</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Transaction / Cheque Reference #
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. IBFT-881923 or CHQ-091283"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Internal Hisab-Kitab Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Settled after DHA Sector J closing and Rs. 50k loan adjustment"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Net Calculation Summary Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Gross Commission:</span>
              <span className="font-semibold text-white">{formatPKR(grossCommission)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Marketing, Fuel & Advance Loan Recovered:</span>
              <span className="font-semibold text-rose-400">- {formatPKR(totalDeductions)}</span>
            </div>
            {applyWhtTax && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>FBR Section 233 WHT (12%):</span>
                <span className="font-semibold text-rose-400">- {formatPKR(taxAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-orange-400 font-bold">
                  Net Disbursed to Agent
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {pkrToEnglishWords(netPayable)}
                </p>
              </div>
              <div className="text-2xl font-black text-[#EE6427]">
                {formatPKR(netPayable)}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={dealsIncluded.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#d9551c] disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Confirm & Generate Payment Voucher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
