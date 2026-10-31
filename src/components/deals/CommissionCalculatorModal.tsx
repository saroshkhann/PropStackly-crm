"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calculator,
  Percent,
  CheckCircle2,
  Copy,
  DollarSign,
  Building,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { formatPKR } from "@/lib/formatters";
import api, { CommissionSide } from "@/lib/api";

interface CommissionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValuePKR?: number;
}

export function CommissionCalculatorModal({
  isOpen,
  onClose,
  initialValuePKR = 50_000_000,
}: CommissionCalculatorModalProps) {
  const [dealValue, setDealValue] = useState<number>(initialValuePKR);
  const [commissionSide, setCommissionSide] = useState<CommissionSide>("both_sides_2pct");
  const [customPct, setCustomPct] = useState<number>(2.0);
  const [agencySplit, setAgencySplit] = useState<number>(50);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialValuePKR) {
      setDealValue(initialValuePKR);
    }
  }, [initialValuePKR]);

  if (!isOpen) return null;

  // Split calculation
  const agentSplit = 100 - agencySplit;

  let effectivePct = 2.0;
  if (commissionSide === "both_sides_2pct") effectivePct = 2.0;
  else if (commissionSide === "buyer_side_1pct" || commissionSide === "seller_side_1pct") effectivePct = 1.0;
  else if (commissionSide === "custom") effectivePct = Number(customPct) || 2.0;

  const totalCommissionPKR = (dealValue * effectivePct) / 100;
  const agencyCommissionPKR = (totalCommissionPKR * agencySplit) / 100;
  const agentCommissionPKR = (totalCommissionPKR * agentSplit) / 100;

  const handleCopyBreakdown = () => {
    const text =
      `*🏛️ PROPSTACKLY CRM — COMMISSION SETTLEMENT BREAKDOWN*\n` +
      `───────────────────────────────\n` +
      `💰 *Property Transaction Value*: ${formatPKR(dealValue)}\n` +
      `📑 *Brokerage Structure*: ${
        commissionSide === "both_sides_2pct"
          ? "Both Sides (Buyer 1% + Seller 1% = 2%)"
          : commissionSide === "buyer_side_1pct"
          ? "Buyer Side (1%)"
          : commissionSide === "seller_side_1pct"
          ? "Seller Side (1%)"
          : `Custom Brokerage (${effectivePct}%)`
      }\n` +
      `💵 *Gross Commission*: ${formatPKR(totalCommissionPKR)} (${effectivePct}%)\n` +
      `🏢 *Agency Share (${agencySplit}%)*: ${formatPKR(agencyCommissionPKR)}\n` +
      `👤 *Consultant / Agent Share (${agentSplit}%)*: ${formatPKR(agentCommissionPKR)}\n` +
      `───────────────────────────────\n` +
      `_Settlement upon Final Registry / Society Transfer._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const PRESETS = [
    { label: "Rs. 1.25 Crore", val: 12_500_000 },
    { label: "Rs. 3.5 Crore", val: 35_000_000 },
    { label: "Rs. 6.5 Crore", val: 65_000_000 },
    { label: "Rs. 12 Crore", val: 120_000_000 },
    { label: "Rs. 25 Crore", val: 250_000_000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pakistani Commission Split Calculator</h2>
              <p className="text-xs text-slate-300">
                Automated 1% Buyer + 1% Seller settlement & Agency vs Agent distribution
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Transaction Value Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Property Transaction Price (PKR)
              </label>
              <span className="text-base font-bold text-[#EE6427] bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/60">
                {formatPKR(dealValue)}
              </span>
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6427] focus-within:border-[#EE6427] transition-all">
              <span className="px-3.5 py-2.5 bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] dark:text-orange-400 font-black text-xs border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                PKR
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={dealValue || ""}
                onChange={(e) => setDealValue(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                placeholder="e.g. 85000000"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {PRESETS.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setDealValue(p.val)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    dealValue === p.val
                      ? "bg-[#EE6427] text-white border-[#EE6427]"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Commission Side Structure */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Market Commission Side
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCommissionSide("both_sides_2pct")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  commissionSide === "both_sides_2pct"
                    ? "border-[#EE6427] bg-orange-50/70 dark:bg-orange-950/30 ring-1 ring-[#EE6427] text-slate-900 dark:text-white"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                <div className="text-xs font-bold text-[#EE6427] dark:text-orange-400 mb-0.5">Standard 2.0%</div>
                <div className="text-xs font-semibold">Both Sides</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">1% Buyer + 1% Seller</div>
              </button>

              <button
                type="button"
                onClick={() => setCommissionSide("buyer_side_1pct")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  commissionSide === "buyer_side_1pct"
                    ? "border-[#EE6427] bg-orange-50/70 dark:bg-orange-950/30 ring-1 ring-[#EE6427] text-slate-900 dark:text-white"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                <div className="text-xs font-bold text-[#DE5518] dark:text-orange-400 mb-0.5">1.0% Single</div>
                <div className="text-xs font-semibold">Buyer Side</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Agency buyer brokerage</div>
              </button>

              <button
                type="button"
                onClick={() => setCommissionSide("seller_side_1pct")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  commissionSide === "seller_side_1pct"
                    ? "border-[#EE6427] bg-orange-50/70 dark:bg-orange-950/30 ring-1 ring-[#EE6427] text-slate-900 dark:text-white"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-0.5">1.0% Single</div>
                <div className="text-xs font-semibold">Seller Side</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Agency listing brokerage</div>
              </button>

              <button
                type="button"
                onClick={() => setCommissionSide("custom")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  commissionSide === "custom"
                    ? "border-[#EE6427] bg-orange-50/70 dark:bg-orange-950/30 ring-1 ring-[#EE6427] text-slate-900 dark:text-white"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">Custom %</div>
                <div className="text-xs font-semibold">Special Terms</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Commercial / Bulk</div>
              </button>
            </div>

            {commissionSide === "custom" && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1">
                  <label className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Custom Commission Rate (% of deal value)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={customPct}
                    onChange={(e) => setCustomPct(Number(e.target.value) || 1)}
                    className="mt-1 w-28 px-3 py-1 text-sm font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Agency vs Agent Split Distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Agency vs Agent Split Distribution
              </label>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                {agencySplit}% Agency / {agentSplit}% Agent
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              {[
                { label: "50 / 50 Standard", ag: 50 },
                { label: "60 / 40 Split", ag: 60 },
                { label: "70 / 30 Split", ag: 70 },
                { label: "40 / 60 Top Performer", ag: 40 },
              ].map((s) => (
                <button
                  key={s.ag}
                  type="button"
                  onClick={() => setAgencySplit(s.ag)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                    agencySplit === s.ag
                      ? "bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={agencySplit}
              onChange={(e) => setAgencySplit(Number(e.target.value))}
              className="w-full accent-[#EE6427] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>10% Agency</span>
              <span>50% Standard Cut</span>
              <span>90% Agency</span>
            </div>
          </div>

          {/* Settlement Result Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Brokerage Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#EE6427] to-[#DE5518] text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-semibold text-orange-100 mb-1">
                <span>Gross Brokerage</span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">
                  {effectivePct}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono tracking-tight">
                {formatPKR(totalCommissionPKR)}
              </div>
              <div className="text-[11px] text-orange-100/90 mt-1">
                PKR {totalCommissionPKR.toLocaleString("en-PK")}
              </div>
            </div>

            {/* Agency Share Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-orange-400" /> Agency Cut
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#EE6427]/20 text-orange-300 text-[10px]">
                  {agencySplit}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono tracking-tight text-white">
                {formatPKR(agencyCommissionPKR)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                PKR {agencyCommissionPKR.toLocaleString("en-PK")}
              </div>
            </div>

            {/* Agent Share Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-[#EE6427] shadow-md">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#EE6427]" /> Agent Payout
                </span>
                <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-950 dark:text-orange-200 text-[10px] font-bold">
                  {agentSplit}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono tracking-tight text-[#EE6427] dark:text-orange-400">
                {formatPKR(agentCommissionPKR)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                PKR {agentCommissionPKR.toLocaleString("en-PK")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Based on Pakistan real estate transaction standards.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyBreakdown}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                copied
                  ? "bg-[#EE6427] text-white"
                  : "bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Copied Voucher!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy WhatsApp Voucher
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
