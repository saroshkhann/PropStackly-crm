"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Sparkles,
  Building,
  DollarSign,
  User,
  Calculator,
  Check,
  CreditCard,
  Percent,
} from "lucide-react";
import { InstallmentPlan, InstallmentFrequency } from "@/types/installment";
import { generateInstallmentMilestones } from "@/data/installmentPresets";
import { formatPKR } from "@/lib/formatters";
import { pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface InstallmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (newPlan: InstallmentPlan) => void;
  defaultClientName?: string;
  defaultClientPhone?: string;
}

export function InstallmentPlanModal({
  isOpen,
  onClose,
  onSavePlan,
  defaultClientName = "",
  defaultClientPhone = "",
}: InstallmentPlanModalProps) {
  const { currentAgent } = useCRM();

  // Form states
  const [planTitle, setPlanTitle] = useState("Park View City - 1 Kanal Overseas Block");
  const [projectName, setProjectName] = useState("Park View City");
  const [developerName, setDeveloperName] = useState("Vision Group");
  const [unitOrFileNumber, setUnitOrFileNumber] = useState("PVC-OVS-8490");
  const [propertyType, setPropertyType] = useState<InstallmentPlan["propertyType"]>("Residential Plot");
  const [size, setSize] = useState<InstallmentPlan["size"]>("1 Kanal");
  const [city, setCity] = useState<InstallmentPlan["city"]>("Islamabad");

  const [totalPricePKR, setTotalPricePKR] = useState(45_000_000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(15);
  const [possessionPercent, setPossessionPercent] = useState(10);
  const [tenureYears, setTenureYears] = useState(3);
  const [frequency, setFrequency] = useState<InstallmentFrequency>("quarterly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Client info
  const [clientName, setClientName] = useState(defaultClientName || "Chaudhry Muhammad Tariq");
  const [clientPhone, setClientPhone] = useState(defaultClientPhone || "+92 300 1234567");
  const [clientCnic, setClientCnic] = useState("37405-1234567-1");

  // Bank collection info
  const [bankAccountTitle, setBankAccountTitle] = useState("Park View City Project Escrow");
  const [bankName, setBankName] = useState("Meezan Bank Limited");
  const [bankIban, setBankIban] = useState("PK44MEZN0001048591024001");
  const [lateFeeMonthlyPercent, setLateFeeMonthlyPercent] = useState(1.5);

  // Live Calculations
  const downPaymentAmount = Math.round((totalPricePKR * downPaymentPercent) / 100);
  const possessionAmount = Math.round((totalPricePKR * possessionPercent) / 100);
  const balanceToInstall = Math.max(0, totalPricePKR - downPaymentAmount - possessionAmount);
  const totalInstallmentCount =
    frequency === "monthly"
      ? tenureYears * 12
      : frequency === "quarterly"
      ? tenureYears * 4
      : tenureYears * 2;
  const perInstallmentAmount = Math.round(balanceToInstall / totalInstallmentCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const milestones = generateInstallmentMilestones(
      totalPricePKR,
      downPaymentPercent,
      tenureYears,
      frequency,
      possessionPercent,
      startDate
    );

    const newPlan: InstallmentPlan = {
      id: `plan-${Date.now()}`,
      planTitle: planTitle.trim() || `${projectName} - ${size} Installment Plan`,
      projectName: projectName.trim(),
      developerName: developerName.trim(),
      unitOrFileNumber: unitOrFileNumber.trim(),
      propertyType,
      size,
      city,
      totalPricePKR,
      downPaymentPKR: downPaymentAmount,
      downPaymentPercent,
      tenureYears,
      frequency,
      totalInstallments: totalInstallmentCount,
      possessionDuePKR: possessionAmount,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientCnic: clientCnic.trim(),
      assignedAgentName: currentAgent?.name || "Hamza Malik",
      bankAccountTitle: bankAccountTitle.trim(),
      bankName: bankName.trim(),
      bankIban: bankIban.trim(),
      lateFeeMonthlyPercent,
      milestones,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(newPlan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              Create Pakistani Installment Plan & Recovery Schedule
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              3 to 4-year structured payment milestones with developer commission releases & bank slip details
            </p>
          </div>
        </div>

        {/* FORM BODY (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* 1. Project Particulars */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <Building className="w-4 h-4 text-[#EE6427]" />
              Project & File Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Park View City"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Developer Name
                </label>
                <input
                  type="text"
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  placeholder="e.g. Vision Group"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  File / Unit Reference # *
                </label>
                <input
                  type="text"
                  required
                  value={unitOrFileNumber}
                  onChange={(e) => setUnitOrFileNumber(e.target.value)}
                  placeholder="e.g. PVC-OVS-8421"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as InstallmentPlan["propertyType"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="Commercial Plot">Commercial Plot</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa / House">Villa / House</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as InstallmentPlan["size"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="5 Marla">5 Marla</option>
                  <option value="10 Marla">10 Marla</option>
                  <option value="1 Kanal">1 Kanal</option>
                  <option value="2 Kanal">2 Kanal</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as InstallmentPlan["city"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Financial Pricing & Milestone Formula */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Financial Structure & Milestone Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Total File / Plot Price (PKR) *
                </label>
                <input
                  type="number"
                  required
                  value={totalPricePKR}
                  onChange={(e) => setTotalPricePKR(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 font-urdu mt-0.5 block">
                  {pkrToUrduWords(totalPricePKR)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Plan Start / Booking Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Down Payment %
                </label>
                <select
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={10}>10% (Low Entry)</option>
                  <option value={15}>15% (Standard)</option>
                  <option value={20}>20% (Affidavit)</option>
                  <option value={25}>25% (Executive)</option>
                  <option value={30}>30%</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tenure (Years)
                </label>
                <select
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={1}>1 Year (Fast)</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years (Most Popular)</option>
                  <option value={3.5}>3.5 Years</option>
                  <option value={4}>4 Years (Standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Payment Cycle
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as InstallmentFrequency)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="quarterly">Quarterly (ہر 3 ماہ)</option>
                  <option value="monthly">Monthly (ماہانہ)</option>
                  <option value="semi_annual">Semi-Annual (6 ماہ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  On Possession %
                </label>
                <select
                  value={possessionPercent}
                  onChange={(e) => setPossessionPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={5}>5%</option>
                  <option value={10}>10% (Standard)</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
            </div>

            {/* Real-time Calculation Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Down Payment ({downPaymentPercent}%):
                </span>
                <span className="text-base font-black font-mono text-[#EE6427]">
                  {formatPKR(downPaymentAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Per Installment ({totalInstallmentCount}x):
                </span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {formatPKR(perInstallmentAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  On Possession ({possessionPercent}%):
                </span>
                <span className="text-base font-black font-mono text-blue-400">
                  {formatPKR(possessionAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Client Information */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <User className="w-4 h-4 text-blue-600" />
              Purchaser / Client Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Client Phone (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Client CNIC
                </label>
                <input
                  type="text"
                  value={clientCnic}
                  onChange={(e) => setClientCnic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4. Bank Account for Recovery Challans */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <CreditCard className="w-4 h-4 text-purple-600" />
              Designated Bank Deposit Account (Printed on Challans)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={bankAccountTitle}
                  onChange={(e) => setBankAccountTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  IBAN / Account Number
                </label>
                <input
                  type="text"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Generate Installment Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
