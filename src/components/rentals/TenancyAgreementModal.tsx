"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  Receipt,
  Scale,
  ShieldCheck,
  Building,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { TenancyContract } from "@/types/rental";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords, pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface TenancyAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenancy: TenancyContract | null;
}

type TenancyTab = "agreement" | "receipt" | "police_verification";
type LanguageMode = "bilingual" | "urdu" | "english";

export default function TenancyAgreementModal({
  isOpen,
  onClose,
  tenancy,
}: TenancyAgreementModalProps) {
  const { settings, currentAgent } = useCRM();

  // Active Tab & View Settings
  const [activeTab, setActiveTab] = useState<TenancyTab>("agreement");
  const [langMode, setLangMode] = useState<LanguageMode>("bilingual");
  const [eStampSpacing, setEStampSpacing] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tenancy) return null;

  const agencyName = settings.agencyName || "PropStackly Prime Properties";
  const agentName = currentAgent?.name || "Hamza Malik";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = "";
    if (activeTab === "agreement") {
      text =
        `=== قانونی معاہدہ کرایہ داری برائے رہائش / TENANCY AGREEMENT ===\n` +
        `Ref: ${tenancy.agreementNumber} | Start Date: ${tenancy.startDate}\n\n` +
        `LANDLORD / مالک مکان: ${tenancy.landlordName} s/o ${tenancy.landlordFatherName} (CNIC: ${tenancy.landlordCnic})\n` +
        `TENANT / کرایہ دار: ${tenancy.tenantName} s/o ${tenancy.tenantFatherName} (CNIC: ${tenancy.tenantCnic})\n\n` +
        `PREMISES / کرایہ شدہ مکان: ${tenancy.address}, ${tenancy.city}\n\n` +
        `MONTHLY RENT / ماہانہ کرایہ: ${formatPKR(tenancy.monthlyRentPKR)} (${pkrToUrduWords(tenancy.monthlyRentPKR)})\n` +
        `SECURITY DEPOSIT / زرِ ضمانت: ${formatPKR(tenancy.securityDepositPKR)} (${tenancy.securityDepositMonths} Months Refundable)\n` +
        `ANNUAL INCREMENT / سالانہ اضافہ: ${tenancy.annualIncrementPercent}%\n` +
        `TENURE / مدت معاہدہ: ${tenancy.tenancyTenureMonths} Months (${tenancy.startDate} to ${tenancy.endDate})\n\n` +
        `ELECTRICITY METER: ${tenancy.electricityMeterNo} (Starting: ${tenancy.electricityReadingStart})\n` +
        `SUI GAS METER: ${tenancy.gasMeterNo} (Starting: ${tenancy.gasReadingStart})\n\n` +
        `FACILITATING BROKERAGE: ${agencyName}\n` +
        `WITNESS 1: ${tenancy.witness1Name} (${tenancy.witness1Cnic})\n` +
        `WITNESS 2: ${tenancy.witness2Name} (${tenancy.witness2Cnic})`;
    } else if (activeTab === "receipt") {
      text =
        `=== رسید وصولی پیشگی کرایہ و زرِ ضمانت / RENT RECEIPT ===\n` +
        `Receipt Ref: ${tenancy.agreementNumber}-RCP\n` +
        `Received with thanks from: ${tenancy.tenantName} (CNIC: ${tenancy.tenantCnic})\n` +
        `On Account of: Advance Rent & Security Deposit for ${tenancy.address}\n` +
        `Monthly Rent: ${formatPKR(tenancy.monthlyRentPKR)}\n` +
        `Security Deposit Held: ${formatPKR(tenancy.securityDepositPKR)}\n` +
        `Authorized Signatory: ${agencyName}`;
    } else {
      text =
        `=== فارم اندراج کرایہ دار برائے پولیس ویریفیکیشن ===\n` +
        `Police Station: ${tenancy.policeStationName}\n` +
        `Tenant Name: ${tenancy.tenantName} (CNIC: ${tenancy.tenantCnic})\n` +
        `Permanent Address: ${tenancy.tenantPermanentAddress}\n` +
        `Occupation: ${tenancy.tenantOccupation}\n` +
        `Rented Premises: ${tenancy.address}, ${tenancy.city}\n` +
        `Landlord: ${tenancy.landlordName} (CNIC: ${tenancy.landlordCnic}, Phone: ${tenancy.landlordPhone})`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-hidden print:p-0 print:bg-white print:static print:overflow-visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-300/80 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 print:hidden"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* HEADER CONTROLS (Hidden during print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                  Pakistani Tenancy Legal & Police Verification Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EE6427]/10 text-[#EE6427] border border-[#EE6427]/20 uppercase font-mono">
                  Punjab & ICT Legal Act
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Click Tenancy Agreement (کرایہ نامہ), Rent Receipts, and Police Verification Form
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-12">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 hover:text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* TOOLBAR: Document Selectors (Hidden during print) */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("agreement")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "agreement"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#EE6427]" />
              <span>قانونی کرایہ نامہ (Tenancy Agreement)</span>
            </button>

            <button
              onClick={() => setActiveTab("receipt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "receipt"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>رسید کرایہ و ضمانت (Rent Receipt)</span>
            </button>

            <button
              onClick={() => setActiveTab("police_verification")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "police_verification"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>پولیس ویریفیکیشن فارم (Police Form)</span>
            </button>
          </div>

          {/* Configuration Toggles */}
          <div className="flex items-center gap-3">
            {activeTab === "agreement" && (
              <>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <button
                    onClick={() => setLangMode("bilingual")}
                    className={`px-2 py-1 rounded-md transition-all ${
                      langMode === "bilingual" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : ""
                    }`}
                  >
                    Bilingual
                  </button>
                  <button
                    onClick={() => setLangMode("urdu")}
                    className={`px-2 py-1 rounded-md transition-all font-urdu ${
                      langMode === "urdu" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : ""
                    }`}
                  >
                    صرف اردو
                  </button>
                  <button
                    onClick={() => setLangMode("english")}
                    className={`px-2 py-1 rounded-md transition-all ${
                      langMode === "english" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : ""
                    }`}
                  >
                    English
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={eStampSpacing}
                    onChange={(e) => setEStampSpacing(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#EE6427] focus:ring-[#EE6427]"
                  />
                  <span>Leave 4.5&quot; e-Stamp Space</span>
                </label>
              </>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#EE6427] hover:bg-[#d6551d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE LEGAL DOCUMENT CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div className="w-full max-w-[820px] bg-white text-slate-900 p-8 sm:p-12 shadow-md border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none">
            {/* TAB 1: TENANCY AGREEMENT */}
            {activeTab === "agreement" && (
              <div className="space-y-6 text-[13px] leading-relaxed font-serif">
                {/* 4.5 Inch e-Stamp Top Clearance */}
                {eStampSpacing && (
                  <div className="h-44 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-xl flex flex-col items-center justify-center text-amber-800 text-xs text-center p-4 print:border-none print:bg-transparent">
                    <p className="font-bold uppercase tracking-wider text-sm mb-1 font-sans">
                      4.5-Inch Official e-Stamp Paper Clearance Header
                    </p>
                    <p className="max-w-md text-[11px] font-sans">
                      This space prints blank on physical Punjab/Sindh e-Stamp Treasury paper under the QR code seal.
                    </p>
                  </div>
                )}

                {/* Agreement Title */}
                <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-sans text-slate-950">
                    معاہدہ کرایہ داری برائے رہائش / مکان
                  </h1>
                  <h2 className="text-xs font-bold tracking-widest text-slate-600 font-sans uppercase">
                    RESIDENTIAL TENANCY LEASE AGREEMENT (PUNJAB & ICT RENT LAWS)
                  </h2>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-500 pt-2 font-sans">
                    <span>Agreement Ref: <strong>{tenancy.agreementNumber}</strong></span>
                    <span>Date of Execution: <strong>{tenancy.startDate}</strong></span>
                  </div>
                </div>

                {/* Parties Preamble */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
                  <p className="font-semibold text-slate-900 text-center font-sans uppercase text-xs">
                    PARTIES TO THIS AGREEMENT / فریقین معاہدہ ہذا
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 border-r border-slate-200 pr-2">
                      <span className="font-bold text-xs font-sans text-[#EE6427] block">
                        FIRST PARTY / LANDLORD (مالک مکان):
                      </span>
                      <p><strong>{tenancy.landlordName}</strong> s/o {tenancy.landlordFatherName}</p>
                      <p className="font-mono">CNIC: <strong>{tenancy.landlordCnic}</strong></p>
                      <p>Resident of: {tenancy.landlordAddress}</p>
                      <p className="font-mono">Phone: {tenancy.landlordPhone}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-xs font-sans text-blue-600 block">
                        SECOND PARTY / TENANT (کرایہ دار):
                      </span>
                      <p><strong>{tenancy.tenantName}</strong> s/o {tenancy.tenantFatherName}</p>
                      <p className="font-mono">CNIC: <strong>{tenancy.tenantCnic}</strong></p>
                      <p>Permanent Address: {tenancy.tenantPermanentAddress}</p>
                      <p className="font-mono">Phone: {tenancy.tenantPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Property Under Lease */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs leading-normal font-sans">
                  <strong>SUBJECT PREMISES:</strong> The First Party is the lawful owner and hereby leases out the property situated at <strong>{tenancy.address}, {tenancy.city} ({tenancy.propertyTitle})</strong> to the Second Party for purely residential purposes.
                </div>

                {/* Legal Clauses */}
                <div className="space-y-3">
                  <p className="font-bold font-sans text-xs uppercase tracking-wider text-slate-800">
                    TERMS & CONDITIONS / شرائط و ضوابط
                  </p>

                  <ol className="list-decimal pl-5 space-y-2.5">
                    <li>
                      <strong>مدت کرایہ داری (Tenure of Tenancy):</strong> یہ معاہدہ بمطابق تاریخ <strong>{tenancy.startDate}</strong> سے لے کر تاریخ <strong>{tenancy.endDate}</strong> تک کل مدت <strong>{tenancy.tenancyTenureMonths} ماہ</strong> کے لیے طے پایا ہے۔
                    </li>
                    <li>
                      <strong>ماہانہ کرایہ (Monthly Rent):</strong> جائیداد ہذا کا ماہانہ کرایہ مبلغ <strong>{formatPKR(tenancy.monthlyRentPKR)}</strong> ({pkrToUrduWords(tenancy.monthlyRentPKR)}) مقرر پایا ہے جو کہ فریق دوم ہر ماہ کی <strong>5 تاریخ</strong> تک فریق اول کے بینک اکاؤنٹ میں ادا کرنے کا پابند ہوگا۔
                    </li>
                    <li>
                      <strong>امانتی زرِ ضمانت (Refundable Security Deposit):</strong> فریق دوم نے فریق اول کو بحساب <strong>{tenancy.securityDepositMonths} ماہ</strong> مبلغ <strong>{formatPKR(tenancy.securityDepositPKR)}</strong> بطور امانت و ضمانت جمع کروا دیا ہے۔ یہ رقم مکان خالی کرنے اور یوٹیلٹی بلز کی کلیئرنس کے بعد مکمل طور پر قابلِ واپسی ہوگی۔
                    </li>
                    <li>
                      <strong>سالانہ اضافہ کرایہ (Annual Rent Escalation):</strong> ہر 11 ماہ یا ایک سال بعد معاہدہ کی تجدید کی صورت میں ماہانہ کرایہ میں <strong>{tenancy.annualIncrementPercent}%</strong> (دس فیصد) سالانہ اضافہ ہوگا۔
                    </li>
                    <li>
                      <strong>یوٹیلٹی بلز و میٹر ریڈنگز (Utility Meter Handover):</strong>
                      <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 font-mono text-xs">
                        <div>• بجلی میٹر # (Electricity): {tenancy.electricityMeterNo} (ابتدائی ریڈنگ: {tenancy.electricityReadingStart})</div>
                        <div>• گیس میٹر # (Sui Gas): {tenancy.gasMeterNo} (ابتدائی ریڈنگ: {tenancy.gasReadingStart})</div>
                        <div>• ماہانہ واٹر و مینٹیننس چارجز: {formatPKR(tenancy.waterMaintenanceChargesPKR)}</div>
                      </div>
                    </li>
                    <li>
                      <strong>صرف رہائشی مقصد (Strictly Residential):</strong> فریق دوم اس مکان کو صرف خاندانی رہائش کے لیے استعمال کرے گا، کسی بھی قسم کی تجارتی یا غیر قانونی سرگرمی کی قطعی اجازت نہ ہوگی۔
                    </li>
                    <li>
                      <strong>نوٹس پیریڈ (Notice Period):</strong> مکان خالی کرنے کی صورت میں فریقین ایک دوسرے کو <strong>{tenancy.noticePeriodDays} یوم</strong> قبل تحریری نوٹس دینے کے پابند ہوں گے۔
                    </li>
                  </ol>
                </div>

                {/* Signatures & Witnesses */}
                <div className="pt-8 border-t-2 border-slate-900 space-y-8 font-sans">
                  <div className="grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <div className="border-b border-black w-48 mx-auto mb-1 h-8" />
                      <p className="font-bold">دستخط فریق اول (مالک مکان)</p>
                      <p className="text-[11px] text-slate-500 font-mono">{tenancy.landlordName}</p>
                    </div>
                    <div>
                      <div className="border-b border-black w-48 mx-auto mb-1 h-8" />
                      <p className="font-bold">دستخط فریق دوم (کرایہ دار)</p>
                      <p className="text-[11px] text-slate-500 font-mono">{tenancy.tenantName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
                    <div>
                      <p className="font-bold text-slate-800">گواہ نمبر 1 (Witness 1):</p>
                      <p>نام: {tenancy.witness1Name}</p>
                      <p className="font-mono">شناختی کارڈ: {tenancy.witness1Cnic}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">گواہ نمبر 2 (Witness 2):</p>
                      <p>نام: {tenancy.witness2Name}</p>
                      <p className="font-mono">شناختی کارڈ: {tenancy.witness2Cnic}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RENT RECEIPT */}
            {activeTab === "receipt" && (
              <div className="space-y-6 font-sans">
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">
                      رسید وصولی پیشگی کرایہ و زرِ ضمانت
                    </h2>
                    <p className="text-xs text-slate-500 uppercase font-mono">
                      OFFICIAL ADVANCE RENT & SECURITY DEPOSIT VOUCHER
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                      Receipt Validated
                    </span>
                    <p className="text-xs font-mono mt-1 text-slate-600">Ref: {tenancy.agreementNumber}-ADV</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 leading-relaxed text-xs">
                  <p>
                    Received with thanks from Mr. / Ms. <strong>{tenancy.tenantName}</strong> (CNIC: <span className="font-mono font-bold">{tenancy.tenantCnic}</span>), the sum of:
                  </p>

                  <div className="p-3 bg-white border border-slate-300 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Advance Rent (1st Month):</span>
                      <span className="text-base font-bold font-mono text-slate-900">{formatPKR(tenancy.monthlyRentPKR)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Refundable Security Deposit ({tenancy.securityDepositMonths}M):</span>
                      <span className="text-base font-bold font-mono text-emerald-700">{formatPKR(tenancy.securityDepositPKR)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount Received:</span>
                      <span className="text-lg font-black font-mono text-[#EE6427]">
                        {formatPKR(tenancy.monthlyRentPKR + tenancy.securityDepositPKR)}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700">
                    Against the residential premises situated at: <strong>{tenancy.address}, {tenancy.city}</strong>.
                  </p>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-dashed border-black pt-2">
                    Authorized Broker / Agency Signature ({agencyName})
                  </div>
                  <div className="border-t border-dashed border-black pt-2">
                    Landlord Receiving Signature
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: POLICE VERIFICATION FORM */}
            {activeTab === "police_verification" && (
              <div className="space-y-5 font-sans text-xs">
                <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                  <h2 className="text-lg font-black text-slate-900 uppercase">
                    فارم اندراج کرایہ دار برائے پولیس ویریفیکیشن
                  </h2>
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    PUNJAB & ISLAMABAD POLICE TENANT VERIFICATION REGISTRATION FORM
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Concerned Police Station: <strong>{tenancy.policeStationName}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 border border-slate-300 p-4 rounded-xl">
                  <div className="col-span-2 space-y-2">
                    <p><strong>Tenant Full Name / نام کرایہ دار:</strong> {tenancy.tenantName}</p>
                    <p><strong>Father / Husband Name / ولدیت:</strong> {tenancy.tenantFatherName}</p>
                    <p className="font-mono"><strong>CNIC / شناختی کارڈ:</strong> {tenancy.tenantCnic}</p>
                    <p className="font-mono"><strong>Mobile Phone / موبائل فون:</strong> {tenancy.tenantPhone}</p>
                    <p><strong>Permanent District Address / مستقل پتہ:</strong> {tenancy.tenantPermanentAddress}</p>
                    <p><strong>Occupation / پیشۂ ملازمت:</strong> {tenancy.tenantOccupation}</p>
                    <p><strong>Total Family Members Residing:</strong> {tenancy.tenantTotalOccupants} Persons</p>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center text-[10px] text-slate-400">
                    <User className="w-8 h-8 text-slate-300 mb-1" />
                    <span>Tenant Passport Size Photograph Affixed Here</span>
                  </div>
                </div>

                <div className="border border-slate-300 p-4 rounded-xl space-y-2 bg-slate-50">
                  <p className="font-bold text-slate-800 uppercase text-[11px]">
                    Landlord Particulars (تفصیلات مالک مکان):
                  </p>
                  <p><strong>Name:</strong> {tenancy.landlordName} (CNIC: <span className="font-mono">{tenancy.landlordCnic}</span>)</p>
                  <p><strong>Phone:</strong> {tenancy.landlordPhone}</p>
                  <p><strong>Rented Property Address:</strong> {tenancy.address}, {tenancy.city}</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-normal">
                  * Submission of this form along with tenant CNIC copy and tenancy agreement is mandatory under Punjab Information of Temporary Residents Act / ICT Tenant Security Rules.
                </div>

                <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-dashed border-black pt-2">
                    Signature of Tenant (کرایہ دار)
                  </div>
                  <div className="border-t border-dashed border-black pt-2">
                    Police Station Khidmat Markaz Receiving Stamp
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PINNED STICKY BOTTOM FOOTER BAR */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              {activeTab === "agreement" && "Legal Tenancy Agreement Ready"}
              {activeTab === "receipt" && "Advance Rent & Security Voucher"}
              {activeTab === "police_verification" && "Police Tenant Verification Form Ready"}
            </span>
            <span className="hidden md:inline text-slate-400">• Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Esc</kbd> to close</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy Text"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
