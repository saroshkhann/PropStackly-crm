"use client";

import React, { useState, useMemo, Suspense } from "react";
import {
  Wallet,
  DollarSign,
  HandCoins,
  FileCheck2,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  Copy,
  Check,
  TrendingUp,
  Receipt,
  Scale,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords } from "@/lib/pkrWords";
import {
  AgentWallet,
  DealCommissionItem,
  AgentAdvanceRecord,
  CommissionPayoutVoucher,
} from "@/types/commissionLedger";
import {
  initialAgentWallets,
  initialDealCommissions,
  initialAgentAdvances,
  initialPayoutVouchers,
} from "@/data/commissionPresets";
import { useCRM } from "@/context/CRMContext";
import { DisburseCommissionModal } from "@/components/commission/DisburseCommissionModal";
import { AdvanceLoanModal } from "@/components/commission/AdvanceLoanModal";
import { CommissionVoucherModal } from "@/components/commission/CommissionVoucherModal";

type ActiveTab = "wallets" | "pending_deals" | "vouchers" | "advances";

function CommissionsContent() {
  const { currentUser } = useCRM();
  const isDemo = currentUser?.email === "admin@propstackly.com";

  // Master state
  const [agents, setAgents] = useState<AgentWallet[]>(() => (isDemo ? initialAgentWallets : []));
  const [dealCommissions, setDealCommissions] = useState<DealCommissionItem[]>(() => (isDemo ? initialDealCommissions : []));
  const [advances, setAdvances] = useState<AgentAdvanceRecord[]>(() => (isDemo ? initialAgentAdvances : []));
  const [vouchers, setVouchers] = useState<CommissionPayoutVoucher[]>(() => (isDemo ? initialPayoutVouchers : []));

  // Tab & Search
  const [activeTab, setActiveTab] = useState<ActiveTab>("wallets");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<string | undefined>(undefined);

  const [activeVoucher, setActiveVoucher] = useState<CommissionPayoutVoucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Computed KPIs
  const totalPaidOut = useMemo(
    () => vouchers.reduce((sum, v) => sum + v.netDisbursedPKR, 0),
    [vouchers]
  );

  const pendingCommission = useMemo(
    () =>
      dealCommissions
        .filter((d) => d.commissionStatus !== "settled")
        .reduce((sum, d) => sum + d.agentSharePKR, 0),
    [dealCommissions]
  );

  const totalOutstandingAdvances = useMemo(
    () => agents.reduce((sum, a) => sum + a.advanceBalancePKR, 0),
    [agents]
  );

  // Handlers
  const handleOpenDisburse = (agentId?: string) => {
    setSelectedAgentForModal(agentId);
    setIsDisburseOpen(true);
  };

  const handleOpenAdvance = (agentId?: string) => {
    setSelectedAgentForModal(agentId);
    setIsAdvanceOpen(true);
  };

  const handleViewVoucher = (voucher: CommissionPayoutVoucher) => {
    setActiveVoucher(voucher);
    setIsVoucherModalOpen(true);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIban(id);
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const handleDisburseSuccess = (
    newVoucher: CommissionPayoutVoucher,
    settledDealIds: string[],
    advanceRecoveredAmount: number
  ) => {
    // 1. Mark deals as settled
    setDealCommissions((prev) =>
      prev.map((d) =>
        settledDealIds.includes(d.id) ? { ...d, commissionStatus: "settled" } : d
      )
    );

    // 2. Update agent wallet
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.agentId === newVoucher.agentId) {
          const newAdvance = Math.max(0, agent.advanceBalancePKR - advanceRecoveredAmount);
          const newDisbursed = agent.totalDisbursedPKR + newVoucher.netDisbursedPKR;
          return {
            ...agent,
            totalDisbursedPKR: newDisbursed,
            advanceBalancePKR: newAdvance,
            netAvailablePKR: Math.max(0, agent.netAvailablePKR - newVoucher.grossEarnedPKR),
            lastPayoutDate: newVoucher.payoutDate,
          };
        }
        return agent;
      })
    );

    // 3. Update advances if recovered
    if (advanceRecoveredAmount > 0) {
      setAdvances((prev) =>
        prev.map((adv) => {
          if (adv.agentId === newVoucher.agentId && adv.status === "active") {
            const newRecovered = adv.recoveredPKR + advanceRecoveredAmount;
            const newRem = Math.max(0, adv.amountPKR - newRecovered);
            return {
              ...adv,
              recoveredPKR: newRecovered,
              remainingPKR: newRem,
              status: newRem === 0 ? "fully_recovered" : "active",
            };
          }
          return adv;
        })
      );
    }

    // 4. Add voucher
    setVouchers((prev) => [newVoucher, ...prev]);

    // 5. Open voucher modal immediately for print/WhatsApp preview
    setActiveVoucher(newVoucher);
    setIsVoucherModalOpen(true);
  };

  const handleIssueAdvanceSuccess = (newAdvance: AgentAdvanceRecord) => {
    setAdvances((prev) => [newAdvance, ...prev]);
    setAgents((prev) =>
      prev.map((a) =>
        a.agentId === newAdvance.agentId
          ? {
              ...a,
              advanceBalancePKR: a.advanceBalancePKR + newAdvance.amountPKR,
            }
          : a
      )
    );
  };

  // Filtered lists based on search
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter(
      (a) =>
        a.agentName.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.bankName.toLowerCase().includes(q)
    );
  }, [agents, searchQuery]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return dealCommissions;
    const q = searchQuery.toLowerCase();
    return dealCommissions.filter(
      (d) =>
        d.dealTitle.toLowerCase().includes(q) ||
        d.society.toLowerCase().includes(q) ||
        d.agentName.toLowerCase().includes(q) ||
        d.dealNumber.toLowerCase().includes(q)
    );
  }, [dealCommissions, searchQuery]);

  const filteredVouchers = useMemo(() => {
    if (!searchQuery) return vouchers;
    const q = searchQuery.toLowerCase();
    return vouchers.filter(
      (v) =>
        v.voucherNumber.toLowerCase().includes(q) ||
        v.agentName.toLowerCase().includes(q) ||
        v.transactionRef.toLowerCase().includes(q)
    );
  }, [vouchers, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight font-normal">
            Commission Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Brokerage commission wallet & hisab-kitab</span>
            <span>•</span>
            <span>Deductions, advance loans & 1-click printable payout vouchers.</span>
            <span className="text-[#EE6427] font-bold">✨</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAdvance()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Issue Advance</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDisburse()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Disburse Payout</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disbursed */}
        <div className="ember-card p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Disbursed (Paid Out)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatPKR(totalPaidOut)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{vouchers.length} vouchers cleared</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Deal Commission */}
        <div className="ember-card p-5 rounded-[20px] bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Deal Commission</p>
            <p className="text-xl font-bold text-[#EE6427] mt-1">
              {formatPKR(pendingCommission)}
            </p>
            <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {dealCommissions.filter((d) => d.commissionStatus !== "settled").length} deals awaiting settlement
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#EE6427] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Advance Loans */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Outstanding Advances (قرضہ)</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatPKR(totalOutstandingAdvances)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Auto-recouped on next deal
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <HandCoins className="w-5 h-5" />
          </div>
        </div>

        {/* Sales Agents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Sales Agents</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {agents.length} Consultants
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              50/50 to 80/20 Commission Splits
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("wallets")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "wallets"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Agent Wallets ({agents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending_deals")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "pending_deals"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Pending Deals ({dealCommissions.filter((d) => d.commissionStatus !== "settled").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vouchers")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "vouchers"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Payout Vouchers ({vouchers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("advances")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "advances"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Advance Loan Ledger ({advances.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents, deals, IBAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
          />
        </div>
      </div>

      {/* TAB 1: AGENT WALLETS */}
      {activeTab === "wallets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <div
              key={agent.agentId}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={agent.avatar}
                      alt={agent.agentName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {agent.agentName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{agent.role}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] border border-orange-200 dark:border-orange-900/60">
                        {agent.tier}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {agent.dealsClosedCount} Deals
                  </span>
                </div>

                {/* Bank / IBAN details */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {agent.bankName}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(agent.iban, agent.agentId)}
                      className="text-[10px] text-slate-400 hover:text-[#EE6427] flex items-center gap-1 cursor-pointer"
                      title="Copy IBAN"
                    >
                      {copiedIban === agent.agentId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIban === agent.agentId ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-slate-500">{agent.iban}</p>
                </div>

                {/* Financial Balances Breakdown */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Lifetime Gross Commission:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatPKR(agent.totalEarnedPKR)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Disbursed (Paid Out):</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPKR(agent.totalDisbursedPKR)}
                    </span>
                  </div>

                  {agent.advanceBalancePKR > 0 && (
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                      <span className="font-medium">Active Advance Loan (قرضہ):</span>
                      <span className="font-bold font-mono">
                        - {formatPKR(agent.advanceBalancePKR)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Unsettled / Ready to Pay:</span>
                    <span className="font-bold text-base text-[#EE6427]">
                      {formatPKR(agent.netAvailablePKR)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAdvance(agent.agentId)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-center cursor-pointer"
                >
                  Issue Advance
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDisburse(agent.agentId)}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-xs transition-colors text-center cursor-pointer"
                >
                  Disburse Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PENDING DEAL COMMISSIONS */}
      {activeTab === "pending_deals" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Deal Reference</th>
                  <th className="py-3 px-4">Property & Society</th>
                  <th className="py-3 px-4 text-right">Deal Value</th>
                  <th className="py-3 px-4 text-right">Gross Comm (2%)</th>
                  <th className="py-3 px-4 text-center">Split %</th>
                  <th className="py-3 px-4 text-right">Agent Share</th>
                  <th className="py-3 px-4">Sales Agent</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {deal.dealNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-950 dark:text-white line-clamp-1">
                        {deal.dealTitle}
                      </p>
                      <p className="text-[11px] text-slate-500">{deal.society}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {formatPKR(deal.dealValuePKR)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {formatPKR(deal.grossCommissionPKR)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded font-bold bg-orange-50 dark:bg-orange-950/50 text-[#EE6427]">
                        {deal.agentSplitPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-sm text-slate-950 dark:text-white">
                      {formatPKR(deal.agentSharePKR)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {deal.agentName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          deal.commissionStatus === "settled"
                            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {deal.commissionStatus === "settled" ? "SETTLED / PAID" : "PENDING CLEARANCE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {deal.commissionStatus !== "settled" ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDisburse(deal.agentId)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-xs cursor-pointer"
                        >
                          Disburse
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYOUT VOUCHERS */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Agent Name & CNIC</th>
                    <th className="py-3 px-4 text-right">Gross Comm</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right">FBR WHT (12%)</th>
                    <th className="py-3 px-4 text-right">Net Disbursed</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {v.voucherNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{v.payoutDate}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-950 dark:text-white">{v.agentName}</p>
                        <p className="font-mono text-[11px] text-slate-500">{v.agentCnic}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">{formatPKR(v.grossEarnedPKR)}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                        - {formatPKR(v.totalDeductionsPKR)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-amber-600">
                        - {formatPKR(v.whtTaxAmountPKR)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-sm text-[#EE6427]">
                        {formatPKR(v.netDisbursedPKR)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-200">
                          {v.paymentMode.replace(/_/g, " ")}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500">{v.transactionRef}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewVoucher(v)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Voucher</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ADVANCE LOAN LEDGER */}
      {activeTab === "advances" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Reason / Purpose</th>
                  <th className="py-3 px-4 text-right">Amount Lent</th>
                  <th className="py-3 px-4 text-right">Recovered</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {advances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {adv.dateGiven}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {adv.agentName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                      {adv.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatPKR(adv.amountPKR)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatPKR(adv.recoveredPKR)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-rose-600">
                      {formatPKR(adv.remainingPKR)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          adv.status === "fully_recovered"
                            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {adv.status === "fully_recovered" ? "FULLY RECOVERED" : "ACTIVE LOAN"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{adv.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disburse Commission Modal */}
      <DisburseCommissionModal
        isOpen={isDisburseOpen}
        onClose={() => setIsDisburseOpen(false)}
        agents={agents}
        dealCommissions={dealCommissions}
        preselectedAgentId={selectedAgentForModal}
        onDisburseSuccess={handleDisburseSuccess}
      />

      {/* Advance Loan Modal */}
      <AdvanceLoanModal
        isOpen={isAdvanceOpen}
        onClose={() => setIsAdvanceOpen(false)}
        agents={agents}
        preselectedAgentId={selectedAgentForModal}
        onIssueAdvance={handleIssueAdvanceSuccess}
      />

      {/* Official Printable Commission Voucher Modal */}
      <CommissionVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        voucher={activeVoucher}
      />
    </div>
  );
}

export default function CommissionsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading commission ledger...</div>}>
        <CommissionsContent />
      </Suspense>
    </AppShell>
  );
}
