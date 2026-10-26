"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  Building,
  Calendar,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Download,
} from "lucide-react";
import { InstallmentPlan, InstallmentMilestone } from "@/types/installment";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords, pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface InstallmentVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InstallmentPlan | null;
  milestone: InstallmentMilestone | null;
}

export function InstallmentVoucherModal({
  isOpen,
  onClose,
  plan,
  milestone,
}: InstallmentVoucherModalProps) {
  const { settings } = useCRM();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !plan || !milestone) return null;

  const agencyName = settings.agencyName || "PropStackly Prime Properties";
  const voucherRef = `CHL-${plan.unitOrFileNumber}-${milestone.milestoneNumber}`;

  const handlePrint = () => {
    window.print();
  };

  const renderChallanSlip = (slipType: "BANK COPY" | "HEAD OFFICE / DEVELOPER COPY" | "PURCHASER / APPLICANT COPY") => (
    <div className="border-2 border-slate-900 p-4 rounded-lg bg-white text-slate-900 text-[11px] leading-tight space-y-3 font-sans print:border-black print:text-black">
      {/* Challan Slip Header */}
      <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start">
        <div>
          <span className="font-mono font-bold text-[9px] uppercase px-1.5 py-0.5 border border-slate-900 rounded inline-block mb-1">
            {slipType}
          </span>
          <h3 className="font-black text-sm uppercase tracking-wide">{plan.projectName}</h3>
          <p className="text-[10px] text-slate-600">{plan.developerName}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-xs">{voucherRef}</p>
          <p className="text-[10px] text-slate-600">Date: {milestone.dueDate}</p>
        </div>
      </div>

      {/* Bank Deposit Info */}
      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] space-y-0.5 print:bg-white print:border-slate-400">
        <p><strong>Bank:</strong> {plan.bankName}</p>
        <p><strong>A/C Title:</strong> {plan.bankAccountTitle}</p>
        <p className="font-mono"><strong>IBAN:</strong> {plan.bankIban}</p>
      </div>

      {/* Particulars Table */}
      <table className="w-full text-left border border-slate-300 divide-y divide-slate-200">
        <tbody>
          <tr>
            <td className="p-1.5 font-semibold text-slate-600 w-1/3">Client Name:</td>
            <td className="p-1.5 font-bold">{plan.clientName}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-semibold text-slate-600">CNIC / Reg No:</td>
            <td className="p-1.5 font-mono">{plan.clientCnic || "N/A"}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-semibold text-slate-600">File / Unit #:</td>
            <td className="p-1.5 font-mono font-bold text-orange-600 print:text-black">{plan.unitOrFileNumber} ({plan.size})</td>
          </tr>
          <tr>
            <td className="p-1.5 font-semibold text-slate-600">Installment #:</td>
            <td className="p-1.5 font-semibold">{milestone.title}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-semibold text-slate-600">Due Date:</td>
            <td className="p-1.5 font-bold font-mono text-rose-700 print:text-black">{milestone.dueDate}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount Box */}
      <div className="p-2 border-2 border-slate-900 rounded bg-slate-50 flex items-center justify-between print:bg-white">
        <span className="font-bold uppercase text-[10px]">Net Payable:</span>
        <span className="text-sm font-black font-mono">{formatPKR(milestone.amountPKR)}</span>
      </div>

      <div className="text-[9px] font-urdu text-slate-700 leading-normal">
        روپے بحساب لفظی: <strong>{pkrToUrduWords(milestone.amountPKR)}</strong>
      </div>

      {/* Terms & Stamp Areas */}
      <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-4 text-center text-[9px] text-slate-500 pt-6">
        <div className="border-t border-dashed border-slate-400 pt-1">
          Authorized Officer / Broker ({agencyName})
        </div>
        <div className="border-t border-dashed border-slate-400 pt-1">
          Bank Branch Cashier & Seal
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer print:hidden"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER CONTROLS (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0 print:hidden pr-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                Official Bank Deposit Challan Form (3-Slip Voucher)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Print-ready Bank Copy, Developer Copy, and Purchaser Copy formatted on A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Challan</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE CHALAN CANVAS (3 Slips side-by-side or stacked) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-md space-y-6 print:p-0 print:shadow-none print:border-none print:max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
              {renderChallanSlip("BANK COPY")}
              {renderChallanSlip("HEAD OFFICE / DEVELOPER COPY")}
              {renderChallanSlip("PURCHASER / APPLICANT COPY")}
            </div>

            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              * Payment must be deposited in designated bank branches across Pakistan before due date to avoid late surcharges.
            </div>
          </div>
        </div>

        {/* FOOTER BAR (Hidden during print) */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0 print:hidden text-xs">
          <span className="text-slate-500">
            Reference: <strong className="font-mono text-slate-800 dark:text-slate-200">{voucherRef}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print 3-Slip Challan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
