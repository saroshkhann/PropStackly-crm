"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Key,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  Building,
  Phone,
  MessageCircle,
  ChevronRight,
  ShieldCheck,
  FileText,
  Calendar,
  Sparkles,
  Users,
} from "lucide-react";
import { TenancyContract, RentPaymentMonth, RentPaymentStatus } from "@/types/rental";
import { INITIAL_TENANCIES } from "@/data/rentalPresets";
import { AddTenancyModal } from "@/components/rentals/AddTenancyModal";
import TenancyAgreementModal from "@/components/rentals/TenancyAgreementModal";
import { formatPKR } from "@/lib/formatters";
import { pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

export default function RentalsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold">Loading Rental Management...</div>}>
        <RentalsContent />
      </Suspense>
    </AppShell>
  );
}

function RentalsContent() {
  const { showToast, currentUser } = useCRM();
  const isDemo = currentUser?.email === "admin@propstackly.com";
  const storageKey = `propstackly_rentals_${currentUser?.agency_id || "demo"}`;

  // State
  const [tenancies, setTenancies] = useState<TenancyContract[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return isDemo ? INITIAL_TENANCIES : [];
  });
  const [selectedTenancyId, setSelectedTenancyId] = useState<string>(() => (isDemo ? INITIAL_TENANCIES[0]?.id || "" : ""));
  const [search, setSearch] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  useEffect(() => {
    if (typeof window !== "undefined" && currentUser?.agency_id) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(tenancies));
      } catch {}
    }
  }, [tenancies, storageKey, currentUser?.agency_id]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // Active selected tenancy
  const selectedTenancy = useMemo(() => {
    return tenancies.find((t) => t.id === selectedTenancyId) || tenancies[0] || null;
  }, [tenancies, selectedTenancyId]);

  // Overall Rental Analytics
  const metrics = useMemo(() => {
    let monthlyRentRollPKR = 0;
    let totalSecurityDepositPKR = 0;
    let totalOverdueRentPKR = 0;
    let totalAgencyCommissionPKR = 0;

    tenancies.forEach((t) => {
      monthlyRentRollPKR += t.monthlyRentPKR;
      totalSecurityDepositPKR += t.securityDepositPKR;
      totalAgencyCommissionPKR += t.agencyCommissionTenantPKR + t.agencyCommissionLandlordPKR;

      t.paymentLedger.forEach((p) => {
        if (p.status === "overdue") {
          totalOverdueRentPKR += p.rentAmountPKR;
        }
      });
    });

    return {
      monthlyRentRollPKR,
      totalSecurityDepositPKR,
      totalOverdueRentPKR,
      totalAgencyCommissionPKR,
      activeLeasesCount: tenancies.length,
    };
  }, [tenancies]);

  // Filtered tenancies
  const filteredTenancies = useMemo(() => {
    return tenancies.filter((t) => {
      if (selectedCity !== "all" && t.city !== selectedCity) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesAddress = t.address.toLowerCase().includes(q);
        const matchesTenant = t.tenantName.toLowerCase().includes(q);
        const matchesLandlord = t.landlordName.toLowerCase().includes(q);
        const matchesRef = t.agreementNumber.toLowerCase().includes(q);
        if (!matchesAddress && !matchesTenant && !matchesLandlord && !matchesRef) return false;
      }
      return true;
    });
  }, [tenancies, selectedCity, search]);

  // Mark Rent Month as Paid
  const handleMarkRentPaid = (tenancyId: string, paymentId: string) => {
    setTenancies((prev) =>
      prev.map((t) => {
        if (t.id !== tenancyId) return t;

        const updatedLedger = t.paymentLedger.map((p) => {
          if (p.id !== paymentId) return p;

          return {
            ...p,
            status: "paid" as RentPaymentStatus,
            paidDate: new Date().toISOString().split("T")[0],
            paidAmountPKR: p.rentAmountPKR,
            paymentMode: "Online Raast / IBFT" as const,
            instrumentReference: `RAAST-RENT-${Math.floor(100000 + Math.random() * 900000)}`,
            receiptNumber: `RCP-${Math.floor(1000 + Math.random() * 9000)}`,
          };
        });

        return { ...t, paymentLedger: updatedLedger, updatedAt: new Date().toISOString() };
      })
    );

    showToast("Rent marked as Paid! Receipt generated.", "success");
  };

  // WhatsApp Rent Reminder Generator
  const handleSendWhatsAppReminder = (tenancy: TenancyContract, payment: RentPaymentMonth) => {
    const isOverdue = payment.status === "overdue";
    const statusNote = isOverdue
      ? `⚠️ *Late Notice*: Your rent payment for ${payment.monthYear} is overdue. Kindly clear at your earliest convenience to avoid tenancy agreement breach.`
      : `Friendly reminder that rent for the month of *${payment.monthYear}* is due on *${payment.dueDate}*.`;

    const message =
      `Assalam-o-Alaikum *${tenancy.tenantName}* sb,\n\n` +
      `🏠 *Monthly Rent Reminder - ${tenancy.propertyTitle}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *Premises*: ${tenancy.address}, ${tenancy.city}\n` +
      `🗓️ *Billing Period*: ${payment.monthYear}\n` +
      `💰 *Rent Amount*: ${formatPKR(payment.rentAmountPKR)} (${pkrToUrduWords(payment.rentAmountPKR)})\n` +
      `📅 *Due Date*: ${payment.dueDate}\n\n` +
      `${statusNote}\n\n` +
      `🏦 *Landlord Bank Account for Direct Deposit*:\n` +
      `• Bank: ${tenancy.landlordBankName || "Designated Bank"}\n` +
      `• Account Title: ${tenancy.landlordAccountTitle || tenancy.landlordName}\n` +
      `• IBAN: ${tenancy.landlordIban || "Available on request"}\n\n` +
      `Please share your transaction screenshot or deposit receipt once transferred.\n\n` +
      `Warm regards,\n*${tenancy.assignedAgentName}* • PropStackly Prime Properties`;

    const encoded = encodeURIComponent(message);
    const phoneClean = tenancy.tenantPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phoneClean}?text=${encoded}`, "_blank");
  };

  const handleAddTenancy = (newContract: TenancyContract) => {
    setTenancies((prev) => [newContract, ...prev]);
    setSelectedTenancyId(newContract.id);
    showToast(`Tenancy agreement for ${newContract.propertyTitle} registered!`, "success");
  };

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EE6427]/10 text-[#EE6427] border border-[#EE6427]/20 uppercase font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EE6427] animate-pulse" />
              Pakistani Residential & Commercial Leasing
            </span>
            <span className="text-xs text-slate-400">
              Islamabad • Rawalpindi • Lahore • Karachi
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-[#EE6427]" />
            <span>House & Apartment Rent Management (کرایہ داری مینجمنٹ)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Legal Tenancy Agreements (کرایہ نامہ), monthly rent recovery ledger, Police verification forms, and WhatsApp reminders
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold shadow-md transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Tenancy Lease</span>
        </button>
      </div>

      {/* 2. RENTAL ROLL FINANCIAL KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Monthly Rent Roll
          </span>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white truncate">
            {formatPKR(metrics.monthlyRentRollPKR)}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Across {metrics.activeLeasesCount} Active Leases
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Security Deposits Held
          </span>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-800 dark:text-emerald-200 truncate">
            {formatPKR(metrics.totalSecurityDepositPKR)}
          </div>
          <span className="text-xs text-emerald-600 font-bold">
            Refundable Escrow
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
            Overdue Rent Alert
          </span>
          <div className="text-lg sm:text-xl font-black font-mono text-rose-800 dark:text-rose-200 truncate">
            {formatPKR(metrics.totalOverdueRentPKR)}
          </div>
          <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Action Required
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Agency Leasing Brokerage
          </span>
          <div className="text-lg sm:text-xl font-black font-mono text-[#EE6427] truncate">
            {formatPKR(metrics.totalAgencyCommissionPKR)}
          </div>
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Landlord + Tenant Fee
          </span>
        </div>
      </div>

      {/* 3. LEASE DIRECTORY & RENT RECOVERY SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ACTIVE TENANCIES LIST */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Leased Properties ({filteredTenancies.length})
              </h2>
              <span className="text-xs text-slate-400">Select to inspect</span>
            </div>

            {/* Search & City Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tenant, address, or ref..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="all">All Cities</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pt-1">
              {filteredTenancies.length === 0 ? (
                <div className="py-10 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  <Key className="w-7 h-7 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No leases found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add your agency&apos;s first tenancy lease.</p>
                </div>
              ) : (
                filteredTenancies.map((tenancy) => {
                  const isSelected = selectedTenancy && tenancy.id === selectedTenancy.id;
                  const hasOverdue = tenancy.paymentLedger.some((p) => p.status === "overdue");

                  return (
                    <div
                      key={tenancy.id}
                      onClick={() => setSelectedTenancyId(tenancy.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#EE6427] bg-orange-50/60 dark:bg-orange-950/30 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block truncate max-w-[190px]">
                            {tenancy.propertyTitle}
                          </span>
                          <span className="font-mono text-[11px] text-[#EE6427] font-semibold">
                            {tenancy.agreementNumber}
                          </span>
                        </div>

                        {hasOverdue ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 uppercase flex items-center gap-1 shrink-0">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase shrink-0">
                            Paid
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mb-1.5 truncate">
                        {tenancy.address}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                          Tenant: <strong>{tenancy.tenantName}</strong>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatPKR(tenancy.monthlyRentPKR)}/m
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED TENANCY CARD & RECOVERY MATRIX */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedTenancy ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
              <Key className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No tenancy lease registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Register a new tenant agreement to track rent recovery, issue police forms, and send WhatsApp reminders.
              </p>
              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  + New Tenancy Lease
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenancies(INITIAL_TENANCIES);
                    setSelectedTenancyId(INITIAL_TENANCIES[0].id);
                    showToast("Loaded sample Islamabad & Lahore rental agreements");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Load Sample Leases
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Lease Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EE6427]/10 text-[#EE6427] font-mono uppercase">
                    {selectedTenancy.agreementNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedTenancy.propertyType} • {selectedTenancy.city}
                  </span>
                  {selectedTenancy.policeVerificationSubmitted && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      Police Verified
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedTenancy.propertyTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedTenancy.address}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLegalModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Generate Legal Tenancy Agreement & Police Verification Form"
                >
                  <FileText className="w-4 h-4 text-[#EE6427]" />
                  <span>Legal کرایہ نامہ</span>
                </button>

                <div className="text-left sm:text-right pl-2 sm:border-l sm:border-slate-200 sm:dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Monthly Rent:
                  </span>
                  <span className="text-xl font-black font-mono text-[#EE6427]">
                    {formatPKR(selectedTenancy.monthlyRentPKR)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Deposit: {formatPKR(selectedTenancy.securityDepositPKR)}
                  </span>
                </div>
              </div>
            </div>

            {/* Landlord, Tenant & Utilities Particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#EE6427] block">Landlord (مالک مکان):</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedTenancy.landlordName}</p>
                <p className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{selectedTenancy.landlordPhone}</p>
                <p className="font-mono text-slate-500 text-[11px]">CNIC: {selectedTenancy.landlordCnic}</p>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:dark:border-slate-750 sm:pl-3">
                <span className="text-[10px] font-bold uppercase text-blue-600 block">Tenant (کرایہ دار):</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedTenancy.tenantName}</p>
                <p className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{selectedTenancy.tenantPhone}</p>
                <p className="text-slate-500 text-[11px] truncate">{selectedTenancy.tenantOccupation}</p>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:dark:border-slate-750 sm:pl-3">
                <span className="text-[10px] font-bold uppercase text-purple-600 block">Meter Readings at Handover:</span>
                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  ⚡ Elec: <strong>{selectedTenancy.electricityReadingStart}</strong>
                </p>
                <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  🔥 Gas: <strong>{selectedTenancy.gasReadingStart}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Water & Maint: {formatPKR(selectedTenancy.waterMaintenanceChargesPKR)}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Rent Collection Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Monthly Rent Collection Ledger (کرایہ ریکوری کھاتہ)
                </h3>
                <p className="text-xs text-slate-500">
                  Track monthly payments, mark rent paid with receipt reference, and dispatch WhatsApp reminders
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Month & Year</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Rent Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment Info</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedTenancy.paymentLedger.map((payment) => {
                    const isPaid = payment.status === "paid";
                    const isOverdue = payment.status === "overdue";
                    const isDueSoon = payment.status === "due_soon";

                    return (
                      <tr
                        key={payment.id}
                        className={`transition-colors ${
                          isOverdue
                            ? "bg-rose-50/40 dark:bg-rose-950/20"
                            : isDueSoon
                            ? "bg-amber-50/40 dark:bg-amber-950/20"
                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {payment.monthYear}
                        </td>
                        <td className="p-3 font-mono">
                          <span
                            className={
                              isOverdue
                                ? "text-rose-600 font-bold"
                                : isDueSoon
                                ? "text-amber-600 font-bold"
                                : "text-slate-700 dark:text-slate-300"
                            }
                          >
                            {payment.dueDate}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          {formatPKR(payment.rentAmountPKR)}
                        </td>
                        <td className="p-3">
                          {isPaid && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid
                            </span>
                          )}
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                          {isDueSoon && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" />
                              Due Soon
                            </span>
                          )}
                          {!isPaid && !isOverdue && !isDueSoon && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit block">
                              Upcoming
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isPaid ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                {payment.paymentMode}
                              </span>
                              <div className="font-mono text-[10px] text-slate-500">
                                {payment.instrumentReference}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Reminder Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReminder(selectedTenancy, payment)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors cursor-pointer"
                              title="Send WhatsApp Rent Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* Mark as Paid Action */}
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleMarkRentPaid(selectedTenancy.id, payment.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                Collect Rent
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
          </div>
        </>
      )}
    </div>
  </div>

      {/* MODAL 1: ADD NEW TENANCY CONTRACT */}
      <AddTenancyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTenancy={handleAddTenancy}
      />

      {/* MODAL 2: 1-CLICK LEGAL TENANCY AGREEMENT & POLICE FORM */}
      <TenancyAgreementModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        tenancy={selectedTenancy}
      />
    </div>
  );
}
