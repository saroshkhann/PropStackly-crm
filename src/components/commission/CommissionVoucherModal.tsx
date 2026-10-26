"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Building2,
  DollarSign,
  FileCheck2,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  Award,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { CommissionPayoutVoucher } from "@/types/commissionLedger";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords, pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface CommissionVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: CommissionPayoutVoucher | null;
}

export function CommissionVoucherModal({
  isOpen,
  onClose,
  voucher,
}: CommissionVoucherModalProps) {
  const { settings } = useCRM();
  const [copied, setCopied] = useState(false);

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

  if (!isOpen || !voucher) return null;

  const agencyName = settings.agencyName || "PropStackly Prime Real Estate Brokerage";
  const agencyAddress = settings.address || "Main Boulevard, DHA Phase 2, Islamabad";
  const agencyPhone = settings.contactPhone || "+92 51 8443920";
  const agencyNtn = settings.ntnNumber || "7294012-8";

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text =
      `=== PROPSTACKLY COMMISSION VOUCHER ===\n` +
      `Voucher #: ${voucher.voucherNumber}\n` +
      `Date: ${voucher.payoutDate}\n` +
      `Agent: ${voucher.agentName} (CNIC: ${voucher.agentCnic})\n` +
      `Payment Mode: ${voucher.paymentMode.replace(/_/g, " ")} (${voucher.transactionRef})\n` +
      `Gross Commission: ${formatPKR(voucher.grossEarnedPKR)}\n` +
      `Total Deductions: ${formatPKR(voucher.totalDeductionsPKR)}\n` +
      `FBR Tax (12% Sec 233): ${formatPKR(voucher.whtTaxAmountPKR)}\n` +
      `NET DISBURSED: ${formatPKR(voucher.netDisbursedPKR)}\n` +
      `(${pkrToEnglishWords(voucher.netDisbursedPKR)})\n` +
      `Bank: ${voucher.bankName} | IBAN: ${voucher.iban}\n` +
      `Approved By: ${voucher.approvedBy}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppNotify = () => {
    const text =
      `*COMMISSION PAYMENT ADVICE - ${agencyName.toUpperCase()}*\n\n` +
      `Assalam-o-Alaikum *${voucher.agentName}*,\n` +
      `Your commission payout for voucher *${voucher.voucherNumber}* has been successfully processed.\n\n` +
      `📊 *Gross Commission:* ${formatPKR(voucher.grossEarnedPKR)}\n` +
      `📉 *Deductions & Advances:* ${formatPKR(voucher.totalDeductionsPKR)}\n` +
      `🏛️ *FBR WHT Tax (Sec 233):* ${formatPKR(voucher.whtTaxAmountPKR)}\n` +
      `💰 *Net Disbursed Amount:* ${formatPKR(voucher.netDisbursedPKR)}\n` +
      `_(${pkrToEnglishWords(voucher.netDisbursedPKR)})_\n\n` +
      `🏦 *Bank Account:* ${voucher.bankName}\n` +
      `💳 *IBAN:* ${voucher.iban}\n` +
      `🧾 *Txn Ref:* ${voucher.transactionRef}\n` +
      `📅 *Date:* ${voucher.payoutDate}\n\n` +
      `Your official payment voucher is saved in the PropStackly CRM portal. JazakAllah khair!`;

    const cleanPhone = voucher.agentPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Cross Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-300/80 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 print:hidden group"
          title="Close Voucher (Esc)"
          aria-label="Close Voucher"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Modal Toolbar (hidden in print) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden pr-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Commission Payout Voucher
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-orange-100 dark:bg-orange-900/50 text-[#EE6427]">
                  {voucher.voucherNumber}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Print-ready official agent hisab-kitab payment slip & tax certificate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppNotify}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Agent</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Slip</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Voucher Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:overflow-visible text-slate-800 dark:text-slate-200 font-sans">
          {/* A4 Printable Container Sheet */}
          <div className="max-w-[800px] mx-auto bg-white text-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Agency Header Banner */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#EE6427] text-white flex items-center justify-center font-black text-xl">
                    P
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                      {agencyName}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Registered Real Estate Advisory & Brokerage Firm
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] text-slate-600 space-y-0.5">
                  <p>📍 {agencyAddress}</p>
                  <p>📞 {agencyPhone} | ✉️ {settings.contactEmail || "info@propstackly.pk"}</p>
                  <p>🏛️ NTN / Tax ID: <span className="font-mono font-bold text-slate-900">{agencyNtn}</span></p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 text-xs font-bold uppercase rounded-md bg-slate-900 text-white tracking-wider">
                  PAYMENT VOUCHER
                </span>
                <p className="mt-2 text-xs font-mono font-bold text-slate-900">
                  Ref: {voucher.voucherNumber}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Date: <span className="font-semibold">{voucher.payoutDate}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Check className="w-3 h-3" />
                  <span>DISBURSED & PAID</span>
                </div>
              </div>
            </div>

            {/* Bilingual Title Ribbon */}
            <div className="my-5 py-2 px-4 bg-slate-100 rounded-lg flex items-center justify-between border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                COMMISSION DISBURSEMENT & TAX WITHHOLDING VOUCHER
              </span>
              <span className="text-xs font-bold text-slate-800 font-serif" dir="rtl">
                رسید ادائیگی کمیشن و گوشوارہ کٹوتی ٹیکس
              </span>
            </div>

            {/* Agent Beneficiary Details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 uppercase font-semibold">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Agent / Beneficiary</span>
                </div>
                <p className="font-bold text-sm text-slate-950">{voucher.agentName}</p>
                <p className="text-slate-600">
                  CNIC: <span className="font-mono font-bold text-slate-800">{voucher.agentCnic}</span>
                </p>
                <p className="text-slate-600">
                  Phone: <span className="font-semibold text-slate-800">{voucher.agentPhone}</span>
                </p>
              </div>

              <div className="space-y-1.5 border-l border-slate-200 pl-4">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 uppercase font-semibold">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <span>Payment Settlement Details</span>
                </div>
                <p className="text-slate-800">
                  Bank: <span className="font-bold text-slate-950">{voucher.bankName}</span>
                </p>
                <p className="text-slate-800">
                  Account Title: <span className="font-semibold">{voucher.accountTitle}</span>
                </p>
                <p className="text-slate-800 text-[11px]">
                  IBAN: <span className="font-mono font-bold text-slate-950">{voucher.iban}</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  Mode: <span className="font-semibold">{voucher.paymentMode.replace(/_/g, " ")}</span> | Txn:{" "}
                  <span className="font-mono font-semibold">{voucher.transactionRef}</span>
                </p>
              </div>
            </div>

            {/* Section 1: Closed Deals Included */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>1. Closed Deals & Commission Breakdown</span>
                <span className="font-serif text-[11px] font-normal" dir="rtl">
                  تفصیل ڈیلز و کمیشن
                </span>
              </h3>

              <div className="mt-2.5 overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Deal #</th>
                      <th className="py-2 px-3">Property & Society</th>
                      <th className="py-2 px-3 text-right">Deal Value</th>
                      <th className="py-2 px-3 text-right">Gross Comm (2%)</th>
                      <th className="py-2 px-3 text-center">Split %</th>
                      <th className="py-2 px-3 text-right">Agent Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {voucher.deals.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                          {d.dealNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-slate-950 line-clamp-1">{d.dealTitle}</p>
                          <p className="text-[11px] text-slate-500">{d.society}</p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {formatPKR(d.dealValuePKR)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {formatPKR(d.grossCommissionPKR)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-orange-600">
                          {d.agentSplitPct}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                          {formatPKR(d.agentSharePKR)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td colSpan={5} className="py-2 px-3 text-right uppercase text-[11px]">
                        Total Gross Commission Earned:
                      </td>
                      <td className="py-2 px-3 text-right text-sm">
                        {formatPKR(voucher.grossEarnedPKR)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 2: Itemized Deductions & Advances */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>2. Deductions, Marketing Costs & Advance Adjustments</span>
                <span className="font-serif text-[11px] font-normal" dir="rtl">
                  وضعداریاں و ایڈوانس کٹوتیاں
                </span>
              </h3>

              {voucher.deductions.length > 0 ? (
                <div className="mt-2.5 overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Description / Remarks</th>
                        <th className="py-2 px-3 text-right">Deducted (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {voucher.deductions.map((ded) => (
                        <tr key={ded.id}>
                          <td className="py-2 px-3 font-semibold text-slate-700 capitalize">
                            {ded.type.replace(/_/g, " ")}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{ded.description}</td>
                          <td className="py-2 px-3 text-right font-bold text-rose-600">
                            - {formatPKR(ded.amountPKR)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-rose-50 font-bold border-t border-slate-200 text-rose-900">
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-right uppercase text-[11px]">
                          Total Marketing & Advance Deductions:
                        </td>
                        <td className="py-2 px-3 text-right text-xs">
                          - {formatPKR(voucher.totalDeductionsPKR)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
                  No marketing or advance loan deductions applied for this voucher.
                </div>
              )}
            </div>

            {/* Section 3: FBR Tax Certificate (Sec 233) */}
            <div className="mt-6 p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-950 uppercase tracking-wide">
                    3. FBR Section 233 Withholding Tax (WHT Certificate)
                  </span>
                </div>
                <span className="font-bold text-amber-900">{voucher.whtTaxPct}% Active Taxpayer Rate</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-700">
                <span>
                  Section 233 WHT on Brokerage / Commission: (Base: {formatPKR(voucher.grossEarnedPKR - voucher.totalDeductionsPKR)})
                </span>
                <span className="font-bold text-rose-700">- {formatPKR(voucher.whtTaxAmountPKR)}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                * Withholding tax under Section 233 of the Income Tax Ordinance 2001. CPR slip will be furnished at monthly withholding tax return.
              </p>
            </div>

            {/* Net Amount Disbursed Hero Card */}
            <div className="mt-6 p-5 rounded-xl bg-linear-to-r from-orange-50 via-amber-50 to-orange-100 border-2 border-orange-300 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-950">
                    NET AMOUNT PAID TO AGENT / خالص ادا شدہ رقم
                  </span>
                  <div className="mt-1 text-2xl sm:text-3xl font-black text-[#DE5518] tracking-tight">
                    {formatPKR(voucher.netDisbursedPKR)}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold text-slate-800">
                    {pkrToEnglishWords(voucher.netDisbursedPKR)}
                  </p>
                  <p className="text-xs font-bold text-slate-900 font-serif mt-0.5" dir="rtl">
                    {pkrToUrduWords(voucher.netDisbursedPKR)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes / Special Remarks */}
            {voucher.notes && (
              <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="font-semibold text-slate-900">Accounts Remarks: </span>
                {voucher.notes}
              </div>
            )}

            {/* Signatures & Verification Block */}
            <div className="mt-10 pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-12">
                <div className="border-b border-slate-400 w-36 mx-auto"></div>
                <div>
                  <p className="font-bold text-slate-900">Prepared By</p>
                  <p className="text-[10px] text-slate-500">Accounts & Finance Dept</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-slate-400 w-36 mx-auto"></div>
                <div>
                  <p className="font-bold text-slate-900">{voucher.approvedBy}</p>
                  <p className="text-[10px] text-slate-500">Broker of Record / CEO</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-slate-400 w-36 mx-auto"></div>
                <div>
                  <p className="font-bold text-slate-900">{voucher.agentName}</p>
                  <p className="text-[10px] text-slate-500">Received By (Agent Signature)</p>
                </div>
              </div>
            </div>

            {/* Official Legal Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
              <p>
                This electronic payment voucher is officially generated via {agencyName} Real Estate Suite (PropStackly).
              </p>
              <p className="mt-0.5">
                All records are permanently preserved in the brokerage commission hisab-kitab ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border rounded">Esc</kbd> or click Close to return.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Close Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
