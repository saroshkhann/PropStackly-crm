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
  Sparkles,
  Download,
  Building,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Percent,
} from "lucide-react";
import { BackendDeal } from "@/lib/api";
import { formatPKR } from "@/lib/formatters";
import { pkrToEnglishWords, pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface LegalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: BackendDeal | null;
}

type DocumentTab = "iqrarnama" | "token_receipt" | "tax_challan";
type LanguageMode = "bilingual" | "urdu" | "english";

export default function LegalDocumentsModal({
  isOpen,
  onClose,
  deal,
}: LegalDocumentsModalProps) {
  const { settings, currentAgent } = useCRM();

  // Active Tab & View Settings
  const [activeTab, setActiveTab] = useState<DocumentTab>("iqrarnama");
  const [langMode, setLangMode] = useState<LanguageMode>("bilingual");
  const [eStampSpacing, setEStampSpacing] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Form editable states
  const [stampRefNo, setStampRefNo] = useState<string>("");
  const [agreementDate, setAgreementDate] = useState<string>("");
  const [transferTargetDate, setTransferTargetDate] = useState<string>("");

  // Seller Details (First Party / بائع)
  const [sellerName, setSellerName] = useState<string>("Chaudhry Muhammad Aslam");
  const [sellerFatherName, setSellerFatherName] = useState<string>("Haji Abdul Rehman");
  const [sellerCnic, setSellerCnic] = useState<string>("37405-1234567-1");
  const [sellerAddress, setSellerAddress] = useState<string>("House #14, Street 8, Sector F-8/3, Islamabad");
  const [sellerPhone, setSellerPhone] = useState<string>("+92 300 8501234");
  const [sellerFilerStatus, setSellerFilerStatus] = useState<"filer" | "late_filer" | "non_filer">("filer");

  // Buyer Details (Second Party / مشتری)
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerFatherName, setBuyerFatherName] = useState<string>("Muhammad Tariq Khan");
  const [buyerCnic, setBuyerCnic] = useState<string>("61101-9876543-1");
  const [buyerAddress, setBuyerAddress] = useState<string>("Sector G-11/2, Islamabad, Pakistan");
  const [buyerPhone, setBuyerPhone] = useState<string>("");
  const [buyerFilerStatus, setBuyerFilerStatus] = useState<"filer" | "late_filer" | "non_filer">("filer");

  // Property Details
  const [propertyTitle, setPropertyTitle] = useState<string>("");
  const [plotNumber, setPlotNumber] = useState<string>("Plot # 142, Street 18");
  const [societyName, setSocietyName] = useState<string>("DHA Phase 2, Sector B");
  const [city, setCity] = useState<string>("Islamabad");
  const [areaSize, setAreaSize] = useState<string>("1 Kanal (500 Sq Yds)");
  const [propertyType, setPropertyType] = useState<string>("Residential Plot");

  // Financials
  const [dealValue, setDealValue] = useState<number>(0);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [bayanaAmount, setBayanaAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("Pay Order / Bank Draft");
  const [instrumentNumber, setInstrumentNumber] = useState<string>("PO-481920 Meezan Bank");

  // Witnesses (گواہان)
  const [witness1Name, setWitness1Name] = useState<string>("Malik Tariq Mehmood");
  const [witness1Cnic, setWitness1Cnic] = useState<string>("37405-5551234-9");
  const [witness1Phone, setWitness1Phone] = useState<string>("+92 321 5551122");

  const [witness2Name, setWitness2Name] = useState<string>("Raja Kamran Abbasi");
  const [witness2Cnic, setWitness2Cnic] = useState<string>("61101-4443322-1");
  const [witness2Phone, setWitness2Phone] = useState<string>("+92 333 4443322");

  // Handle Escape key to close modal
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

  // Initialize data when deal opens
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setAgreementDate(today);

    // Default target date: 45 days after agreement
    const target = new Date();
    target.setDate(target.getDate() + 45);
    setTransferTargetDate(target.toISOString().split("T")[0]);

    if (deal) {
      setStampRefNo(deal.iqrarnama_number || `PB-STAMP-${Math.floor(100000 + Math.random() * 900000)}`);
      setBuyerName(deal.lead_name || "Buyer Client");
      setBuyerPhone(deal.lead_phone || "+92 300 0000000");

      setPropertyTitle(deal.property_title || "Prime Real Estate Property");
      if (deal.property_title?.toLowerCase().includes("dha")) {
        setSocietyName("DHA Phase 2, Islamabad");
      } else if (deal.property_title?.toLowerCase().includes("bahria")) {
        setSocietyName("Bahria Town Phase 8, Rawalpindi");
      } else if (deal.property_title?.toLowerCase().includes("gulberg")) {
        setSocietyName("Gulberg Greens, Islamabad");
      } else {
        setSocietyName("Islamabad / Rawalpindi Prime Sector");
      }

      const totalVal = Number(deal.deal_value_pkr) || 50_000_000;
      setDealValue(totalVal);

      const tokenVal = Number(deal.token_amount_pkr) || (totalVal * 0.02); // 2% default token
      setTokenAmount(tokenVal);

      const bayanaVal = Number(deal.bayana_amount_pkr) || (totalVal * 0.20); // 20% default bayana
      setBayanaAmount(bayanaVal);
    } else {
      setStampRefNo(`PB-STAMP-${Math.floor(100000 + Math.random() * 900000)}`);
      setBuyerName("Muhammad Usman Qureshi");
      setBuyerPhone("+92 300 9876543");
      setPropertyTitle("1 Kanal Residential Plot, DHA Phase 2");
      setSocietyName("DHA Phase 2, Sector B");
      setDealValue(45_000_000);
      setTokenAmount(1_000_000);
      setBayanaAmount(9_000_000);
    }
  }, [deal]);

  if (!isOpen) return null;

  // Calculated Financial Values
  const remainingBalance = Math.max(0, dealValue - bayanaAmount);
  const agencyName = settings.agencyName || "PropStackly Prime Properties";
  const agentName = currentAgent?.name || "Hamza Malik";

  // FBR 236C / 236K Calculations
  const buyerTaxRate = buyerFilerStatus === "filer" ? 0.03 : buyerFilerStatus === "late_filer" ? 0.06 : 0.12;
  const sellerTaxRate = sellerFilerStatus === "filer" ? 0.03 : sellerFilerStatus === "late_filer" ? 0.06 : 0.10;
  const buyerTax236K = Math.round(dealValue * buyerTaxRate);
  const sellerTax236C = Math.round(dealValue * sellerTaxRate);
  const stampDutyRate = 0.01; // 1% ICT/Punjab
  const stampDutyAmount = Math.round(dealValue * stampDutyRate);
  const societyTransferFee = areaSize.includes("Kanal") ? 135_000 : 75_000;
  const totalBuyerClosingCost = buyerTax236K + stampDutyAmount + societyTransferFee;
  const totalSellerDeductions = sellerTax236C + 25_000; // 25k NDC & society clearance

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy Clean Text Handler
  const handleCopyText = () => {
    let text = "";
    if (activeTab === "iqrarnama") {
      text = `=== معاہدہ بیعانہ برائے فروخت جائیداد / AGREEMENT TO SELL ===\n` +
        `E-Stamp Ref: ${stampRefNo} | Date: ${agreementDate}\n\n` +
        `SELLER / فریق اول: ${sellerName} s/o ${sellerFatherName} (CNIC: ${sellerCnic})\n` +
        `BUYER / فریق دوم: ${buyerName} s/o ${buyerFatherName} (CNIC: ${buyerCnic})\n\n` +
        `PROPERTY / جائیداد: ${plotNumber}, ${societyName}, ${city} (${areaSize})\n\n` +
        `TOTAL CONSIDERATION / کل قیمت: ${formatPKR(dealValue)} (${pkrToEnglishWords(dealValue)})\n` +
        `BAYANA ADVANCE / زر بیعانہ: ${formatPKR(bayanaAmount)} (${pkrToUrduWords(bayanaAmount)})\n` +
        `REMAINING BALANCE / بقایا رقم: ${formatPKR(remainingBalance)}\n` +
        `FINAL TRANSFER DATE / آخری تاریخ: ${transferTargetDate}\n\n` +
        `FACILITATING BROKERAGE: ${agencyName}\n` +
        `WITNESS 1: ${witness1Name} (${witness1Cnic})\n` +
        `WITNESS 2: ${witness2Name} (${witness2Cnic})`;
    } else if (activeTab === "token_receipt") {
      text = `=== رسید امانتی زرِ ٹوکن / TOKEN ADVANCE RECEIPT ===\n` +
        `Receipt Ref: ${deal?.id ? deal.id.slice(0, 8).toUpperCase() : "RCP-DEMO"} | Date: ${agreementDate}\n` +
        `Agency: ${agencyName}\n` +
        `Received with thanks from: ${buyerName} (CNIC: ${buyerCnic})\n` +
        `The sum of: ${formatPKR(tokenAmount)} (${pkrToEnglishWords(tokenAmount)})\n` +
        `Payment Mode: ${paymentMode} (${instrumentNumber})\n` +
        `Against Property: ${plotNumber}, ${societyName}, ${city}\n` +
        `Total Deal Value: ${formatPKR(dealValue)}\n` +
        `Authorized Signatory: ${agentName}`;
    } else {
      text = `=== FBR SECTION 236C & 236K CLOSING TAX SUMMARY ===\n` +
        `Property: ${plotNumber}, ${societyName} | Value: ${formatPKR(dealValue)}\n` +
        `BUYER TAX (Sec 236K - ${buyerFilerStatus.toUpperCase()}): ${formatPKR(buyerTax236K)} (${(buyerTaxRate * 100)}%)\n` +
        `SELLER TAX (Sec 236C - ${sellerFilerStatus.toUpperCase()}): ${formatPKR(sellerTax236C)} (${(sellerTaxRate * 100)}%)\n` +
        `Stamp Duty (1%): ${formatPKR(stampDutyAmount)}\n` +
        `Estimated Society Transfer Fee: ${formatPKR(societyTransferFee)}\n` +
        `Total Buyer Closing Dues: ${formatPKR(totalBuyerClosingCost)}\n` +
        `Total Seller Closing Deductions: ${formatPKR(totalSellerDeductions)}`;
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
        {/* Floating Top-Right Cross Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-300/80 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 print:hidden group"
          title="Close Agreement (Esc)"
          aria-label="Close Agreement"
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
                  Pakistani Real Estate Legal Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EE6427]/10 text-[#EE6427] border border-[#EE6427]/20 uppercase font-mono">
                  E-Stamp Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Click official bilingual legal agreements, token vouchers, and FBR tax documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-12">
            <button
              type="button"
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showConfigDrawer ? "Hide Party Form" : "Edit Parties & Terms"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 hover:text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Close Agreement (Esc)"
            >
              <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* TOOLBAR: Document Selectors & Options (Hidden during print) */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          {/* Document Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("iqrarnama")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "iqrarnama"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#EE6427]" />
              <span>معاہدہ بیعانہ (Bayana Agreement)</span>
            </button>

            <button
              onClick={() => setActiveTab("token_receipt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "token_receipt"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>رسید ٹوکن (Token Receipt)</span>
            </button>

            <button
              onClick={() => setActiveTab("tax_challan")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "tax_challan"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span>FBR 236C / 236K Slip</span>
            </button>
          </div>

          {/* Configuration Toggles */}
          <div className="flex items-center gap-3">
            {activeTab === "iqrarnama" && (
              <>
                {/* Language Select */}
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

                {/* E-Stamp paper clearance checkbox */}
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={eStampSpacing}
                    onChange={(e) => setEStampSpacing(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#EE6427] focus:ring-[#EE6427]"
                  />
                  <span>Leave 4.5&quot; Stamp Top Space</span>
                </label>
              </>
            )}

            {/* Print & Copy Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy formatted legal text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-[#EE6427] hover:bg-[#d6551d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* EDITABLE FORM DRAWER (Expandable) */}
        {showConfigDrawer && (
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4 max-h-72 overflow-y-auto shrink-0 print:hidden text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#EE6427]">
                <Sparkles className="w-3.5 h-3.5" />
                Quick-Edit Deal Legal Particulars
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Changes will dynamically update the print-ready agreement below.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  First Party / Seller Name (بائع)
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Seller Father Name
                </label>
                <input
                  type="text"
                  value={sellerFatherName}
                  onChange={(e) => setSellerFatherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Seller CNIC
                </label>
                <input
                  type="text"
                  value={sellerCnic}
                  onChange={(e) => setSellerCnic(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Second Party / Buyer Name (مشتری)
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Buyer Father Name
                </label>
                <input
                  type="text"
                  value={buyerFatherName}
                  onChange={(e) => setBuyerFatherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Buyer CNIC
                </label>
                <input
                  type="text"
                  value={buyerCnic}
                  onChange={(e) => setBuyerCnic(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Plot / Street Address
                </label>
                <input
                  type="text"
                  value={plotNumber}
                  onChange={(e) => setPlotNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Society / Sector & City
                </label>
                <input
                  type="text"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Property Size
                </label>
                <input
                  type="text"
                  value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Total Agreed Price (PKR)
                </label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Bayana Paid Amount (PKR)
                </label>
                <input
                  type="number"
                  value={bayanaAmount}
                  onChange={(e) => setBayanaAmount(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Final Transfer Date (آخری تاریخ)
                </label>
                <input
                  type="date"
                  value={transferTargetDate}
                  onChange={(e) => setTransferTargetDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE LEGAL DOCUMENT CANVAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          {/* A4 Paper Canvas Container */}
          <div className="w-full max-w-[820px] bg-white text-slate-900 p-8 sm:p-12 shadow-md border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none">

            {/* TAB 1: BAYANA IQRARNAMA (AGREEMENT TO SELL) */}
            {activeTab === "iqrarnama" && (
              <div className="space-y-6 text-[13px] leading-relaxed font-serif">
                
                {/* Simulated Government E-Stamp Top Clearance Header */}
                {eStampSpacing && (
                  <div className="h-44 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-lg flex flex-col items-center justify-center text-center p-4 print:border-none print:bg-transparent">
                    <span className="text-amber-800 font-sans font-bold text-xs uppercase tracking-widest">
                      ★ Government of Punjab / Islamabad Capital Territory (ICT) E-Stamp Space ★
                    </span>
                    <p className="text-[11px] text-amber-700/80 font-sans mt-1">
                      (Leave this 4.5 inch blank space if printing directly onto pre-issued PKR 1,200 legal stamp paper)
                    </p>
                    <span className="text-[10px] font-mono font-bold text-amber-900 mt-2">
                      e-Stamp Ref: {stampRefNo}
                    </span>
                  </div>
                )}

                {/* Legal Header */}
                <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                  {(langMode === "bilingual" || langMode === "urdu") && (
                    <h1 className="text-2xl font-bold font-serif text-slate-950 tracking-wide">
                      معاہدہ بیعانہ برائے فروخت جائیداد غیر منقولہ
                    </h1>
                  )}
                  {(langMode === "bilingual" || langMode === "english") && (
                    <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 font-sans">
                      AGREEMENT TO SELL (BAYANA IQRARNAMA)
                    </h2>
                  )}
                  <div className="flex items-center justify-between text-xs font-sans text-slate-600 pt-1">
                    <span>
                      <strong>Stamp Duty Reference:</strong> <span className="font-mono">{stampRefNo}</span>
                    </span>
                    <span>
                      <strong>Execution Date:</strong> <span className="font-mono">{agreementDate}</span>
                    </span>
                  </div>
                </div>

                {/* PARTIES SECTION (فریقین) */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <strong className="text-slate-950 font-sans text-xs uppercase tracking-wider">
                        1. FIRST PARTY / SELLER (فریق اول / بائع):
                      </strong>
                      <span className="text-[11px] text-slate-500 font-sans">Owner of Record</span>
                    </div>
                    <p className="text-slate-800">
                      <strong>{sellerName}</strong> ولد / زوجہ <strong>{sellerFatherName}</strong>، حامل قومی شناختی کارڈ نمبر{" "}
                      <span className="font-mono font-bold">{sellerCnic}</span>، ساکن {sellerAddress} (جس کو بعد میں اس دستاویز میں <strong>&quot;فریق اول یا بائع&quot;</strong> کہا جائے گا جس میں اس کے تمام قانونی ورثاء، جانشینان و نمائندگان شامل ہیں)۔
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                      <strong className="text-slate-950 font-sans text-xs uppercase tracking-wider">
                        2. SECOND PARTY / BUYER (فریق دوم / مشتری):
                      </strong>
                      <span className="text-[11px] text-slate-500 font-sans">Purchaser / Investor</span>
                    </div>
                    <p className="text-slate-800">
                      <strong>{buyerName}</strong> ولد / زوجہ <strong>{buyerFatherName}</strong>، حامل قومی شناختی کارڈ نمبر{" "}
                      <span className="font-mono font-bold">{buyerCnic}</span>، ساکن {buyerAddress} (جس کو بعد میں اس دستاویز میں <strong>&quot;فریق دوم یا مشتری&quot;</strong> کہا جائے گا جس میں اس کے تمام قانونی ورثاء و جانشینان شامل ہیں)۔
                    </p>
                  </div>
                </div>

                {/* PROPERTY DESCRIPTION (تفصیلِ جائیداد) */}
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                    3. PROPERTY PARTICULARS (تفصیلِ جائیداد و رقبہ):
                  </h3>
                  <p>
                    جو کہ فریق اول بحیثیتِ مالک و قابض جائیداد مندرجہ ذیل کا مکمل طور پر بلا شرکت غیرے مالک ہے:
                  </p>
                  <table className="w-full border border-slate-300 text-xs font-sans">
                    <tbody>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-bold w-1/3">Property Category / Type:</td>
                        <td className="p-2">{propertyType} ({areaSize})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold">Plot / Unit Identification:</td>
                        <td className="p-2 font-mono font-bold text-slate-950">{plotNumber}</td>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-bold">Society / Scheme & Phase:</td>
                        <td className="p-2">{societyName}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold">Territorial Jurisdiction / City:</td>
                        <td className="p-2">{city}, Pakistan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CONSIDERATION & PAYMENT SCHEDULE (تفصیل ادائیگیاں و بیعانہ) */}
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                    4. FINANCIAL TERMS & PAYMENT SCHEDULE (شرائط زرِ ثمن و ادائیگیاں):
                  </h3>
                  <p>
                    فریقین نے باہمی رضا مندی، ہوش و حواس خمسہ میں جائیداد متذکرہ بالا کا سودا کل مبلغ{" "}
                    <strong className="font-mono">{formatPKR(dealValue)}</strong> (بلفظ{" "}
                    <strong>{pkrToUrduWords(dealValue)}</strong> / {pkrToEnglishWords(dealValue)}) میں قطعی طور پر طے پایا ہے، جس کی ادائیگی درج ذیل طے ہوئی ہے:
                  </p>

                  <div className="border border-slate-300 rounded-lg overflow-hidden text-xs font-sans">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                        <tr>
                          <th className="p-2">Milestone / ادائیگی مرحلہ</th>
                          <th className="p-2">Amount (PKR)</th>
                          <th className="p-2">Mode & Instrument</th>
                          <th className="p-2">Due Date / تاریخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-medium">1. زرِ بیعانہ بوقتِ اقرار نامہ (Bayana Deposit)</td>
                          <td className="p-2 font-mono font-bold text-amber-900">{formatPKR(bayanaAmount)}</td>
                          <td className="p-2">{paymentMode} ({instrumentNumber})</td>
                          <td className="p-2 font-mono">{agreementDate} (وصول پایا)</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-2 font-medium">2. بقایا رقم بوقتِ رجسٹری / انتقال (Final Balance)</td>
                          <td className="p-2 font-mono font-bold text-[#EE6427]">{formatPKR(remainingBalance)}</td>
                          <td className="p-2">Pay Order بوقتِ ٹرانسفر</td>
                          <td className="p-2 font-mono font-bold">{transferTargetDate}</td>
                        </tr>
                        <tr className="font-bold bg-slate-100">
                          <td className="p-2">Total Transaction Valuation (کل طے شدہ قیمت)</td>
                          <td className="p-2 font-mono text-slate-950" colSpan={3}>
                            {formatPKR(dealValue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TERMS & CONDITIONS (شرائط و ضوابط) */}
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                    5. STANDARD LEGAL COVENANTS & FORFEITURE CLAUSES (قانونی شرائط و معاہدہ):
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-800">
                    <li>
                      <strong>Clear Title Assurance (بے باق ملکیتی تسلی):</strong> فریق اول اس امر کا اقرار کرتا ہے کہ جائیداد متذکرہ ہر قسم کے تنازعات، عدالتی حکم امتناعی (Stay Order)، رہن، بینک قرضہ جات، سرکاری بقایاجات، اور واجبات سے مکمل طور پر پاک و صاف ہے۔
                    </li>
                    <li>
                      <strong>Forfeiture on Buyer Default (منسوخی بیعانہ بحقِ بائع):</strong> اگر فریق دوم (مشتری) مقررہ تاریخ یعنی{" "}
                      <span className="font-mono font-bold">{transferTargetDate}</span> تک بقیہ رقم مبلغ{" "}
                      <span className="font-mono font-bold">{formatPKR(remainingBalance)}</span> ادا کر کے انتقال / رجسٹری کروانے میں ناکام رہا تو فریق اول کو یہ حق حاصل ہوگا کہ وہ زرِ بیعانہ بحق خود ضبط کر کے معاہدہ ہذا منسوخ تصور کرے۔
                    </li>
                    <li>
                      <strong>Seller Default Penalty (ہرجانہ بروئے معاہدہ بحقِ مشتری):</strong> اگر فریق اول (بائع) مقررہ تاریخ تک سوسائٹی سے NDC کلیئر نہ کروا سکا یا انتقال کروانے سے انکاری ہوا تو فریق اول زرِ بیعانہ واپس کرنے کا پابند ہوگا مع زرِ بیعانہ کے مساوی رقم بطور ہرجانہ فریق دوم کو ادا کرنے کا پابند ہوگا۔
                    </li>
                    <li>
                      <strong>Taxes & Transfer Expenses (اخراجات و ٹیکسز):</strong> تمام سوسائٹی ٹرانسفر فیس، سٹیمپ ڈیوٹی و FBR سیکشن 236K فریق دوم (مشتری) ادا کرے گا جبکہ FBR سیکشن 236C و سوسائٹی NDC کلیئرنس فریق اول (بائع) کی ذمہ داری ہوگی۔
                    </li>
                    <li>
                      <strong>Brokerage Commission (بروکریج کمیشن):</strong> فریقین تسلیم کرتے ہیں کہ یہ سودا باوساطت{" "}
                      <strong>{agencyName}</strong> طے پایا ہے اور دونوں فریقین مقررہ کمیشن بوقت انتقال ادا کرنے کے پابند ہوں گے۔
                    </li>
                  </ol>
                </div>

                {/* SIGNATURES & WITNESSES (دستخط فریقین و گواہان) */}
                <div className="pt-6 border-t-2 border-slate-900 space-y-6">
                  <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans">
                    <div className="border-t border-slate-400 pt-2 space-y-1">
                      <p className="font-bold text-slate-950">فریق اول / بائع (SELLER)</p>
                      <p>{sellerName}</p>
                      <p className="font-mono text-[11px] text-slate-600">CNIC: {sellerCnic}</p>
                      <p className="text-[10px] text-slate-400">دستخط و نشان انگوٹھا</p>
                    </div>

                    <div className="border-t border-slate-400 pt-2 space-y-1">
                      <p className="font-bold text-slate-950">فریق دوم / مشتری (BUYER)</p>
                      <p>{buyerName}</p>
                      <p className="font-mono text-[11px] text-slate-600">CNIC: {buyerCnic}</p>
                      <p className="text-[10px] text-slate-400">دستخط و نشان انگوٹھا</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-xs font-sans pt-2 border-t border-slate-200">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">گواہ نمبر 1 (WITNESS 1):</p>
                      <p>نام: {witness1Name}</p>
                      <p className="font-mono text-[11px]">CNIC: {witness1Cnic}</p>
                      <p className="text-[11px]">فون: {witness1Phone}</p>
                      <div className="h-8 border-b border-dotted border-slate-400 mt-2"></div>
                      <span className="text-[10px] text-slate-400">دستخط گواہ 1</span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">گواہ نمبر 2 (WITNESS 2):</p>
                      <p>نام: {witness2Name}</p>
                      <p className="font-mono text-[11px]">CNIC: {witness2Cnic}</p>
                      <p className="text-[11px]">فون: {witness2Phone}</p>
                      <div className="h-8 border-b border-dotted border-slate-400 mt-2"></div>
                      <span className="text-[10px] text-slate-400">دستخط گواہ 2</span>
                    </div>
                  </div>

                  {/* Facilitating Agency Stamp */}
                  <div className="text-center pt-2 border-t border-slate-300 font-sans text-xs">
                    <p className="font-bold text-slate-900">{agencyName}</p>
                    <p className="text-[11px] text-slate-500">
                      Certified Real Estate Advisory & Transaction Faciliator • Agent: {agentName}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: TOKEN ADVANCE RECEIPT */}
            {activeTab === "token_receipt" && (
              <div className="space-y-6 text-xs font-sans">
                {/* Agency Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                      {agencyName}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {settings.address || "Blue Area, Islamabad, Pakistan"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Phone: {settings.contactPhone || "+92 51 2894100"} | NTN: {settings.ntnNumber || "7492018-4"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded bg-[#EE6427]/10 text-[#EE6427] font-bold text-xs uppercase font-mono border border-[#EE6427]/20">
                      Official Receipt
                    </span>
                    <p className="text-xs font-mono font-bold mt-1 text-slate-800">
                      VR-TOKEN-{deal?.id ? deal.id.slice(0, 8).toUpperCase() : "DEMO-001"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">Date: {agreementDate}</p>
                  </div>
                </div>

                <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    TOKEN ADVANCE RECEIPT / رسید امانتی زرِ ٹوکن
                  </h2>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 leading-relaxed text-[13px]">
                  <p>
                    Received with thanks from Mr. / Ms. <strong>{buyerName}</strong> (CNIC: <span className="font-mono font-bold">{buyerCnic}</span>), the sum of:
                  </p>

                  <div className="p-3 bg-white border border-slate-300 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold block">Token Advance Amount:</span>
                      <span className="text-xl font-black font-mono text-[#EE6427]">
                        {formatPKR(tokenAmount)}
                      </span>
                    </div>
                    <div className="text-right font-serif text-sm text-slate-800">
                      <p className="font-bold">{pkrToUrduWords(tokenAmount)}</p>
                      <p className="text-xs font-sans text-slate-500">{pkrToEnglishWords(tokenAmount)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 font-bold block">Payment Mode:</span>
                      <span className="font-semibold text-slate-900">{paymentMode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">Instrument / Cheque Reference:</span>
                      <span className="font-mono font-semibold text-slate-900">{instrumentNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Property Particulars */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                    Secured Against Property Listing:
                  </h3>
                  <table className="w-full border border-slate-300 text-xs">
                    <tbody>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-bold w-1/3">Property Plot / Unit:</td>
                        <td className="p-2 font-mono font-bold text-slate-950">{plotNumber}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 font-bold">Society & Location:</td>
                        <td className="p-2">{societyName}, {city}</td>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <td className="p-2 font-bold">Area Size:</td>
                        <td className="p-2">{areaSize}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold">Total Agreed Value:</td>
                        <td className="p-2 font-mono font-bold text-[#EE6427]">{formatPKR(dealValue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terms of Token */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-950 space-y-1">
                  <strong className="block font-bold">Terms of Token (امانتی شرائط):</strong>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>This token deposit holds the above property reserved for a maximum of 7 business days until Bayana signing.</li>
                    <li>Full Bayana Agreement must be executed on or before the due date.</li>
                    <li>In case the Buyer declines to proceed, standard forfeiture terms apply.</li>
                  </ul>
                </div>

                {/* Signature Bar */}
                <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="space-y-1">
                    <div className="h-10 border-b border-dotted border-slate-400"></div>
                    <p className="font-bold text-slate-900">Depositor / Buyer Signature</p>
                    <p className="text-[11px] text-slate-500">{buyerName}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10 border-b border-dotted border-slate-400"></div>
                    <p className="font-bold text-slate-900">Authorized Agency Signatory</p>
                    <p className="text-[11px] text-slate-500">{agentName} • {agencyName}</p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: FBR TAX & TRANSFER SLIP */}
            {activeTab === "tax_challan" && (
              <div className="space-y-6 text-xs font-sans">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-black uppercase text-slate-950 tracking-tight">
                      FBR Section 236C & 236K Property Transfer Tax Challan Slip
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Government of Pakistan • Federal Board of Revenue & Society Registrar Docket
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      FY 2025-2026 Schedule
                    </span>
                  </div>
                </div>

                {/* Transaction Valuation Summary */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block uppercase text-[10px]">Property Subject to Transfer:</span>
                    <span className="font-bold text-slate-900 text-sm">{plotNumber}, {societyName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block uppercase text-[10px]">Declared Transaction Value:</span>
                    <span className="font-mono font-bold text-base text-[#EE6427]">{formatPKR(dealValue)}</span>
                  </div>
                </div>

                {/* TWO-COLUMN TAX DIVISION: BUYER VS SELLER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* BUYER EXPENSES (SECTION 236K + STAMP DUTY) */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex justify-between items-center border-b border-blue-200 pb-2">
                      <strong className="text-blue-950 text-xs uppercase tracking-wide">
                        Buyer Transfer Costs (مشتری واجبات)
                      </strong>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                        {buyerFilerStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-700">FBR Section 236K ({(buyerTaxRate * 100)}%):</span>
                        <span className="font-mono font-bold text-blue-950">{formatPKR(buyerTax236K)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Stamp Duty (Punjab/ICT 1%):</span>
                        <span className="font-mono font-bold text-slate-900">{formatPKR(stampDutyAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Society Transfer & Membership Fee:</span>
                        <span className="font-mono font-bold text-slate-900">{formatPKR(societyTransferFee)}</span>
                      </div>
                      <div className="border-t border-blue-300 pt-2 flex justify-between items-center font-bold text-blue-950">
                        <span>Total Buyer Transfer Dues:</span>
                        <span className="font-mono text-sm text-blue-900">{formatPKR(totalBuyerClosingCost)}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-blue-800/80 leading-relaxed italic">
                      * FBR Section 236K CPR challan must be paid via 1-Link at any authorized ABL, NBP, or SBP branch before society transfer booking.
                    </p>
                  </div>

                  {/* SELLER DEDUCTIONS (SECTION 236C) */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                    <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                      <strong className="text-amber-950 text-xs uppercase tracking-wide">
                        Seller Advance Tax (بائع کٹوتیاں)
                      </strong>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                        {sellerFilerStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-700">FBR Section 236C ({(sellerTaxRate * 100)}%):</span>
                        <span className="font-mono font-bold text-amber-950">{formatPKR(sellerTax236C)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700">Society NDC & Clearance Charges:</span>
                        <span className="font-mono font-bold text-slate-900">PKR 25,000</span>
                      </div>
                      <div className="border-t border-amber-300 pt-2 flex justify-between items-center font-bold text-amber-950">
                        <span>Total Seller Deductions:</span>
                        <span className="font-mono text-sm text-amber-900">{formatPKR(totalSellerDeductions)}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-amber-800/80 leading-relaxed italic">
                      * Section 236C is adjustable against annual income tax returns under Income Tax Ordinance, 2001.
                    </p>
                  </div>

                </div>

                {/* Net Out of Pocket Summary */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">
                      Total Buyer Out of Pocket (Price + Taxes):
                    </span>
                    <span className="text-xl font-black font-mono text-[#EE6427]">
                      {formatPKR(dealValue + totalBuyerClosingCost)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">
                      Net Seller Realization (After 236C):
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {formatPKR(dealValue - totalSellerDeductions)}
                    </span>
                  </div>
                </div>

                {/* Verification Authority Footer */}
                <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-500">
                  <span>Prepared by: {agencyName}</span>
                  <span>FBR e-File Verification Module • Verified for Punjab & ICT Sub-Registrar</span>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* MODAL FOOTER BAR (Always pinned, visible even when scrolled, hidden during print) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-[#EE6427] animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeTab === "iqrarnama" && "معاہدہ بیعانہ (Bayana Agreement)"}
              {activeTab === "token_receipt" && "رسید امانتی زرِ ٹوکن (Token Receipt)"}
              {activeTab === "tax_challan" && "FBR Section 236C & 236K Slip"}
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-slate-500">
              • Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Esc</kbd> or click outside to exit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:border-rose-900 text-slate-700 hover:text-rose-600 dark:text-slate-200 dark:hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Close Agreement (Esc)"
            >
              <X className="w-4 h-4 text-rose-500" />
              <span>Close Agreement</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy Text"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
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
