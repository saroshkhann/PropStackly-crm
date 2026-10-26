"use client";

import React, { useState, useEffect } from "react";
import { X, HandCoins, AlertCircle, Building2, User } from "lucide-react";
import { AgentWallet, AgentAdvanceRecord } from "@/types/commissionLedger";
import { formatPKR } from "@/lib/formatters";
import { useCRM } from "@/context/CRMContext";

interface AdvanceLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentWallet[];
  preselectedAgentId?: string;
  onIssueAdvance: (newAdvance: AgentAdvanceRecord) => void;
}

export function AdvanceLoanModal({
  isOpen,
  onClose,
  agents,
  preselectedAgentId,
  onIssueAdvance,
}: AdvanceLoanModalProps) {
  const { currentAgent } = useCRM();

  const [agentId, setAgentId] = useState<string>(
    preselectedAgentId || agents[0]?.agentId || ""
  );
  const [amountPKR, setAmountPKR] = useState<number>(50_000);
  const [reason, setReason] = useState<string>("Fuel allowance & client site visit logistics");

  useEffect(() => {
    if (preselectedAgentId) {
      setAgentId(preselectedAgentId);
    } else if (agents.length > 0 && !agentId) {
      setAgentId(agents[0].agentId);
    }
  }, [preselectedAgentId, agents, agentId]);

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

  if (!isOpen) return null;

  const selectedAgent = agents.find((a) => a.agentId === agentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || amountPKR <= 0) return;

    const newRec: AgentAdvanceRecord = {
      id: `adv-${Date.now()}`,
      agentId: selectedAgent.agentId,
      agentName: selectedAgent.agentName,
      amountPKR,
      dateGiven: new Date().toISOString().split("T")[0],
      reason,
      recoveredPKR: 0,
      remainingPKR: amountPKR,
      status: "active",
      approvedBy: currentAgent?.name ? `${currentAgent.name} (CEO)` : "CEO - PropStackly",
    };

    onIssueAdvance(newRec);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
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
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Issue Agent Advance Loan (ایڈوانس کھاتہ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lend cash advance against future commissions with automatic recovery
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Agent
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {agents.map((a) => (
                <option key={a.agentId} value={a.agentId}>
                  {a.agentName} ({a.role}) - Current Loan: {formatPKR(a.advanceBalancePKR)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Advance Amount (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">Rs.</span>
              <input
                type="number"
                min={5000}
                step={5000}
                value={amountPKR}
                onChange={(e) => setAmountPKR(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 text-base font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex gap-2 mt-2">
              {[25000, 50000, 100000, 150000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountPKR(preset)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {formatPKR(preset)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Justification
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Fuel for client site visits to New City Paradise & medical aid"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-xl">
            <p className="text-[11px] text-purple-900 dark:text-purple-300">
              💡 <span className="font-semibold">Auto-Adjustment:</span> This advance will be automatically presented in the Commission Disburse modal whenever {selectedAgent?.agentName} closes a deal, allowing flexible full or partial recovery.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
            >
              Approve & Issue Advance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
