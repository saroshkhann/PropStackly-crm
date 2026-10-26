"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calculator,
  Building2,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  Copy,
  Printer,
  ArrowRight,
  CheckCircle2,
  Info,
  DollarSign,
  TrendingDown,
  User,
  ExternalLink,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { AppShell } from "@/components/layout/AppShell";
import { api, TaxCalculationRequest, TaxCalculationResponse } from "@/lib/api";
import { formatPKR, formatPhoneNumber, getWhatsAppLink } from "@/lib/formatters";

function TaxCalculatorContent() {
  const searchParams = useSearchParams();
  const { leads, currentAgent, settings, showToast } = useCRM();

  // Initial values from query params or defaults
  const paramPrice = searchParams.get("price") ? Number(searchParams.get("price")) : 45_000_000;
  const paramSociety = searchParams.get("society") || "DHA (Defence Housing Authority)";
  const paramSize = searchParams.get("size") || "1 Kanal";
  const paramType = searchParams.get("type") || "Residential House";
  const paramTitle = searchParams.get("title") || "";

  // State
  const [propertyPrice, setPropertyPrice] = useState<number>(paramPrice > 0 ? paramPrice : 45_000_000);
  const [society, setSociety] = useState<string>(paramSociety);
  const [propertyType, setPropertyType] = useState<string>(paramType);
  const [areaSize, setAreaSize] = useState<string>(paramSize);
  const [province, setProvince] = useState<"punjab" | "ict" | "sindh" | "kpk">("punjab");
  const [buyerStatus, setBuyerStatus] = useState<"filer" | "late_filer" | "non_filer">("filer");
  const [sellerStatus, setSellerStatus] = useState<"filer" | "late_filer" | "non_filer">("filer");
  const [isFirstMembership, setIsFirstMembership] = useState<boolean>(true);
  const [isUrgentTransfer, setIsUrgentTransfer] = useState<boolean>(false);

  // Lead dispatch selection
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [customPhone, setCustomPhone] = useState<string>("");

  // Result state
  const [calcResult, setCalcResult] = useState<TaxCalculationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeWaTab, setActiveWaTab] = useState<"en" | "ur">("ur");
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);

  // Quick price chips
  const quickPrices = [
    { label: "1 Crore", value: 10_000_000 },
    { label: "2.5 Crore", value: 25_000_000 },
    { label: "4.5 Crore", value: 45_000_000 },
    { label: "7.5 Crore", value: 75_000_000 },
    { label: "12 Crore", value: 120_000_000 },
    { label: "20 Crore", value: 200_000_000 },
  ];

  // Perform calculation via API or fallback local formula
  useEffect(() => {
    let isSubscribed = true;

    async function performCalculation() {
      setIsLoading(true);
      const reqPayload: TaxCalculationRequest = {
        property_price: propertyPrice || 0,
        society,
        property_type: propertyType,
        area_size: areaSize,
        buyer_tax_status: buyerStatus,
        seller_tax_status: sellerStatus,
        is_first_transfer_membership: isFirstMembership,
        is_urgent_transfer: isUrgentTransfer,
        province,
      };

      try {
        const res = await api.tax.calculate(reqPayload);
        if (isSubscribed) {
          setCalcResult(res);
        }
      } catch (err) {
        // Local calculation fallback if offline
        const price = propertyPrice || 0;
        const bRate =
          buyerStatus === "filer"
            ? price <= 50_000_000
              ? 0.03
              : price <= 100_000_000
              ? 0.035
              : 0.04
            : buyerStatus === "late_filer"
            ? price <= 50_000_000
              ? 0.06
              : price <= 100_000_000
              ? 0.07
              : 0.08
            : price <= 50_000_000
            ? 0.12
            : price <= 100_000_000
            ? 0.16
            : 0.20;

        const sRate =
          sellerStatus === "filer"
            ? price <= 50_000_000
              ? 0.03
              : price <= 100_000_000
              ? 0.04
              : 0.05
            : sellerStatus === "late_filer"
            ? price <= 50_000_000
              ? 0.06
              : price <= 100_000_000
              ? 0.07
              : 0.08
            : price <= 50_000_000
            ? 0.10
            : 0.15;

        const b236k = Math.round(price * bRate);
        const s236c = Math.round(price * sRate);
        const nonFilerBRate =
          price <= 50_000_000 ? 0.12 : price <= 100_000_000 ? 0.16 : 0.20;
        const bSavings = Math.max(0, Math.round(price * nonFilerBRate) - b236k);

        const stampRate = province === "sindh" || province === "kpk" ? 0.02 : 0.01;
        const stampAmount = Math.round(price * stampRate);
        const tmaRate = society.toLowerCase().includes("dha") ? 0.0 : 0.01;
        const tmaAmount = Math.round(price * tmaRate);

        const transferFee = society.toLowerCase().includes("dha")
          ? areaSize.includes("2 Kanal")
            ? 240_000
            : areaSize.includes("1 Kanal")
            ? 135_000
            : areaSize.includes("10 Marla")
            ? 75_000
            : 45_000
          : 90_000;
        const memFee = isFirstMembership ? 65_000 : 0;
        const urgFee = isUrgentTransfer ? 45_000 : 0;
        const ndcFee = 25_000;

        const totalBCost = b236k + stampAmount + tmaAmount + transferFee + memFee + urgFee;
        const totalBOutOfPocket = price + totalBCost;
        const totalSDeductions = s236c + ndcFee;
        const netSProceeds = price - totalSDeductions;

        if (isSubscribed) {
          setCalcResult({
            property_price: price,
            taxable_base: price,
            society,
            property_type: propertyType,
            area_size: areaSize,
            buyer_tax_status: buyerStatus,
            seller_tax_status: sellerStatus,
            buyer: {
              section_236k_rate: bRate,
              section_236k_amount: b236k,
              stamp_duty_rate: stampRate,
              stamp_duty_amount: stampAmount,
              tma_tax_rate: tmaRate,
              tma_tax_amount: tmaAmount,
              society_transfer_fee: transferFee,
              society_membership_fee: memFee,
              urgent_transfer_fee: urgFee,
              total_buyer_closing_cost: totalBCost,
              total_buyer_out_of_pocket: totalBOutOfPocket,
              filer_savings_vs_non_filer: bSavings,
            },
            seller: {
              section_236c_rate: sRate,
              section_236c_amount: s236c,
              society_ndc_fee: ndcFee,
              total_seller_deductions: totalSDeductions,
              net_seller_proceeds: netSProceeds,
              filer_savings_vs_non_filer: 0,
            },
            combined: {
              total_government_taxes: b236k + s236c + stampAmount + tmaAmount,
              total_society_fees: transferFee + memFee + urgFee + ndcFee,
              grand_total_closing_cost: totalBCost + totalSDeductions,
            },
            whatsapp_breakdown_en: `🏛 FBR Tax & Property Transfer Cost Breakdown\n📍 Property: ${areaSize} ${propertyType} in ${society}\n💰 Deal Value: Rs. ${price.toLocaleString()}\n\n👤 BUYER EXPENSES (${buyerStatus.toUpperCase()}):\n• FBR Sec 236K Advance Tax (${(bRate * 100).toFixed(1)}%): Rs. ${b236k.toLocaleString()}\n• Stamp Duty (${(stampRate * 100).toFixed(1)}%): Rs. ${stampAmount.toLocaleString()}\n• Society Transfer Fee: Rs. ${transferFee.toLocaleString()}\n👉 Total Buyer Extra Cost: Rs. ${totalBCost.toLocaleString()}\n🏷 Total Out-of-Pocket: Rs. ${totalBOutOfPocket.toLocaleString()}\n\n✨ Filer Advantage: You save Rs. ${bSavings.toLocaleString()} vs Non-Filer rate!`,
            whatsapp_breakdown_ur: `السلام علیکم!\n🏛 پراپرٹی ٹیکس اور ٹرانسفر خرچہ تفصیل (FBR Tax Breakdown)\n📍 پراپرٹی: ${areaSize} ${propertyType} (${society})\n💰 سودا قیمت: Rs. ${price.toLocaleString()}\n\n🟢 خریدار (Buyer) کے کل اخراجات:\n1. FBR سیکشن 236K ٹیکس (${(bRate * 100).toFixed(1)}%): Rs. ${b236k.toLocaleString()}\n2. اسٹامپ ڈیوٹی: Rs. ${stampAmount.toLocaleString()}\n3. سوسائٹی ٹرانسفر فیس: Rs. ${transferFee.toLocaleString()}\n👉 کل اضافی ٹرانسفر خرچہ: Rs. ${totalBCost.toLocaleString()}\n💵 خریدار کی کل ادائیگی: Rs. ${totalBOutOfPocket.toLocaleString()}\n\n⭐ فائلر بچت: فائلر ہونے کی وجہ سے آپ کی سیدھی Rs. ${bSavings.toLocaleString()} کی بچت ہے!`,
          });
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    performCalculation();
    return () => {
      isSubscribed = false;
    };
  }, [
    propertyPrice,
    society,
    propertyType,
    areaSize,
    province,
    buyerStatus,
    sellerStatus,
    isFirstMembership,
    isUrgentTransfer,
  ]);

  // Selected lead phone
  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  const recipientPhone = selectedLead ? selectedLead.phone : customPhone;

  // Dispatch WhatsApp action
  const handleSendWhatsApp = () => {
    if (!calcResult) return;
    const text = activeWaTab === "ur" ? calcResult.whatsapp_breakdown_ur : calcResult.whatsapp_breakdown_en;
    const cleanPhone = recipientPhone.replace(/\D/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    showToast("WhatsApp opened with Tax & Transfer Breakdown!");
  };

  const handleCopyText = () => {
    if (!calcResult) return;
    const text = activeWaTab === "ur" ? calcResult.whatsapp_breakdown_ur : calcResult.whatsapp_breakdown_en;
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    showToast("Tax breakdown copied to clipboard!");
    setTimeout(() => setCopiedPitch(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header with PropStackly Orange Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#EE6427] border border-orange-200 dark:border-orange-900/60 flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                  FBR Property Tax & Transfer Calculator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-[#EE6427] border border-orange-200 dark:border-orange-800">
                  Finance Act 2024-2025
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculate Section 236C (Seller Tax), 236K (Buyer Tax), Stamp Duty & Society Transfer Fees.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#EE6427]" />
            <span>Print Estimate</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Results Display (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EE6427]" />
                <span>1. Property & Deal Price</span>
              </h2>
              <span className="text-[11px] font-mono font-bold text-[#EE6427]">
                {formatPKR(propertyPrice)}
              </span>
            </div>

            {/* Price Input with Clean Flexbox Addon (Zero Overlap Bug) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Deal Price / Market Value (PKR)
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 overflow-hidden focus-within:ring-2 focus-within:ring-[#EE6427] focus-within:border-[#EE6427] focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                <span className="px-3.5 py-2.5 bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] font-black text-xs border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                  PKR
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={propertyPrice || ""}
                  placeholder="e.g. 45000000"
                  onChange={(e) => setPropertyPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-transparent text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {quickPrices.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setPropertyPrice(chip.value)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                      propertyPrice === chip.value
                        ? "bg-[#EE6427] text-white border-[#EE6427] shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Society / Jurisdiction */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Society / Housing Authority
              </label>
              <select
                value={society}
                onChange={(e) => setSociety(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
              >
                <option value="DHA (Defence Housing Authority)">DHA (Defence Housing Authority - All Phases)</option>
                <option value="Bahria Town">Bahria Town (Rawalpindi / Islamabad / Lahore / Karachi)</option>
                <option value="CDA (Capital Development Authority - Islamabad)">CDA (Capital Development Authority)</option>
                <option value="LDA (Lahore Development Authority)">LDA (Lahore Development Authority)</option>
                <option value="Park View City">Park View City</option>
                <option value="Eighteen Islamabad">Eighteen Islamabad</option>
                <option value="Capital Smart City">Capital Smart City</option>
                <option value="General Registry / Intiqal (Fard)">General Registry / Intiqal (Fard)</option>
              </select>
            </div>

            {/* Property Type & Area Size Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Property Category
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
                >
                  <option value="Residential House">Residential House / Villa</option>
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="Commercial Plaza">Commercial Plaza / Building</option>
                  <option value="Commercial Plot">Commercial Plot</option>
                  <option value="Apartment / Flat">Apartment / Penthouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Area Size
                </label>
                <select
                  value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
                >
                  <option value="5 Marla">5 Marla (125 Sq Yd)</option>
                  <option value="7 Marla">7 Marla (175 Sq Yd)</option>
                  <option value="10 Marla">10 Marla (250 Sq Yd)</option>
                  <option value="1 Kanal">1 Kanal (500 Sq Yd)</option>
                  <option value="2 Kanal">2 Kanal (1,000 Sq Yd)</option>
                  <option value="4 Marla Commercial">4 Marla Commercial</option>
                  <option value="8 Marla Commercial">8 Marla Commercial</option>
                </select>
              </div>
            </div>

            {/* Province for Stamp Duty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Province / Territory (Stamp Duty Rate)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvince("punjab")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    province === "punjab"
                      ? "bg-orange-50 dark:bg-orange-950/60 text-[#EE6427] border-orange-300 dark:border-orange-800 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Punjab / Islamabad (1%)
                </button>
                <button
                  type="button"
                  onClick={() => setProvince("sindh")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    province === "sindh"
                      ? "bg-orange-50 dark:bg-orange-950/60 text-[#EE6427] border-orange-300 dark:border-orange-800 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Sindh / KPK (2%)
                </button>
              </div>
            </div>
          </div>

          {/* Tax Status Section */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EE6427]" />
              <span>2. FBR Tax Status (ATL)</span>
            </h2>

            {/* Buyer Status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#EE6427]" />
                  <span>Buyer FBR Status (Section 236K)</span>
                </label>
                <span className="text-[10px] text-slate-400">Paid by Buyer</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBuyerStatus("filer")}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    buyerStatus === "filer"
                      ? "bg-[#EE6427] text-white border-[#EE6427] shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <div>Active Filer</div>
                  <div className="text-[10px] font-normal opacity-90">3% - 4%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBuyerStatus("late_filer")}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    buyerStatus === "late_filer"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <div>Late Filer</div>
                  <div className="text-[10px] font-normal opacity-90">6% - 8%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBuyerStatus("non_filer")}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    buyerStatus === "non_filer"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <div>Non-Filer</div>
                  <div className="text-[10px] font-normal opacity-90">12% - 20%</div>
                </button>
              </div>
            </div>

            {/* Seller Status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#EE6427]" />
                  <span>Seller FBR Status (Section 236C)</span>
                </label>
                <span className="text-[10px] text-slate-400">Deducted from Seller</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSellerStatus("filer")}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    sellerStatus === "filer"
                      ? "bg-[#EE6427] text-white border-[#EE6427] shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <div>Active Filer</div>
                  <div className="text-[10px] font-normal opacity-90">3% - 5%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerStatus("late_filer")}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    sellerStatus === "late_filer"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <div>Late Filer</div>
                  <div className="text-[10px] font-normal opacity-90">6% - 8%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSellerStatus("non_filer")}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    sellerStatus === "non_filer"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                  }`}
                >
                  <div>Non-Filer</div>
                  <div className="text-[10px] font-normal opacity-90">10% - 15%</div>
                </button>
              </div>
            </div>

            {/* Society Options */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isFirstMembership}
                  onChange={(e) => setIsFirstMembership(e.target.checked)}
                  className="w-4 h-4 text-[#EE6427] rounded-sm focus:ring-[#EE6427]"
                />
                <span>Include 1-time Society Membership Fee (DHA / Bahria)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isUrgentTransfer}
                  onChange={(e) => setIsUrgentTransfer(e.target.checked)}
                  className="w-4 h-4 text-[#EE6427] rounded-sm focus:ring-[#EE6427]"
                />
                <span>Urgent Transfer Processing Fee (Express biometric)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-5">
          {calcResult ? (
            <>
              {/* Highlight Hero Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buyer Out-of-pocket Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#EE6427]/30 dark:border-[#EE6427]/40 shadow-xs space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#EE6427]" />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold uppercase tracking-wider">Buyer Total Out-of-Pocket</span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#EE6427] dark:text-orange-300 text-[10px] font-bold border border-orange-200 dark:border-orange-800">
                      Price + All Taxes
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                    {formatPKR(calcResult.buyer.total_buyer_out_of_pocket, false)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Base Deal Price:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatPKR(calcResult.property_price)}</span>
                  </div>
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total Closing Taxes & Fees:</span>
                    <span className="font-mono font-bold text-[#EE6427]">+ {formatPKR(calcResult.buyer.total_buyer_closing_cost)}</span>
                  </div>
                </div>

                {/* Seller Net Proceeds Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold uppercase tracking-wider">Seller Net In-Hand Cash</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      Net Proceeds
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                    {formatPKR(calcResult.seller.net_seller_proceeds, false)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Deal Amount:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatPKR(calcResult.property_price)}</span>
                  </div>
                  <div className="text-xs flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">FBR 236C & NDC Deduction:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">- {formatPKR(calcResult.seller.total_seller_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Filer Advantage Banner in Orange */}
              {calcResult.buyer.filer_savings_vs_non_filer > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EE6427] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-orange-950 dark:text-orange-200">
                      Active Filer Savings Advantage
                    </h3>
                    <p className="text-xs text-orange-900 dark:text-orange-300 mt-0.5 leading-relaxed">
                      By purchasing this property as an <strong>Active Filer</strong>, the buyer directly saves{" "}
                      <strong className="underline font-mono text-[#EE6427] dark:text-orange-400">
                        {formatPKR(calcResult.buyer.filer_savings_vs_non_filer, false)}
                      </strong>{" "}
                      compared to the non-filer tax penalty!
                    </p>
                  </div>
                </div>
              )}

              {/* Itemized Breakdown Table */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EE6427]" />
                  <span>Itemized Cost Breakdown</span>
                </h3>

                {/* Buyer Column */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Buyer Transfer Expenses:
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>
                        FBR Section 236K Advance Tax (
                        {(calcResult.buyer.section_236k_rate * 100).toFixed(1)}%):
                      </span>
                      <span className="font-mono font-semibold">
                        Rs. {calcResult.buyer.section_236k_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>
                        Provincial Stamp Duty (
                        {(calcResult.buyer.stamp_duty_rate * 100).toFixed(1)}%):
                      </span>
                      <span className="font-mono font-semibold">
                        Rs. {calcResult.buyer.stamp_duty_amount.toLocaleString()}
                      </span>
                    </div>
                    {calcResult.buyer.tma_tax_amount > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>TMA / Municipal Corporation Tax:</span>
                        <span className="font-mono font-semibold">
                          Rs. {calcResult.buyer.tma_tax_amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Society Transfer Fee:</span>
                      <span className="font-mono font-semibold">
                        Rs. {calcResult.buyer.society_transfer_fee.toLocaleString()}
                      </span>
                    </div>
                    {calcResult.buyer.society_membership_fee > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>1-Time Society Membership:</span>
                        <span className="font-mono font-semibold">
                          Rs. {calcResult.buyer.society_membership_fee.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {calcResult.buyer.urgent_transfer_fee > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Urgent Processing Fee:</span>
                        <span className="font-mono font-semibold">
                          Rs. {calcResult.buyer.urgent_transfer_fee.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total Buyer Closing Expense:</span>
                      <span className="font-mono text-[#EE6427]">
                        Rs. {calcResult.buyer.total_buyer_closing_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Seller Column */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Seller Deductions:
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>
                        FBR Section 236C Advance Tax (
                        {(calcResult.seller.section_236c_rate * 100).toFixed(1)}%):
                      </span>
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                        Rs. {calcResult.seller.section_236c_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Society NDC Clearance Fee:</span>
                      <span className="font-mono font-semibold">
                        Rs. {calcResult.seller.society_ndc_fee.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total Seller Deductions:</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">
                        Rs. {calcResult.seller.total_seller_deductions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual-Language WhatsApp Share Box in Orange Theme */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#EE6427]" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      1-Click WhatsApp Pitch & Estimate
                    </h3>
                  </div>

                  {/* Language Switcher Tabs */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveWaTab("ur")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        activeWaTab === "ur"
                          ? "bg-[#EE6427] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      🇵🇰 Roman Urdu (اردو)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWaTab("en")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        activeWaTab === "en"
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </div>

                {/* Recipient Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Attach CRM Lead:
                    </label>
                    <select
                      value={selectedLeadId}
                      onChange={(e) => {
                        setSelectedLeadId(e.target.value);
                        if (e.target.value) setCustomPhone("");
                      }}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="">-- Manual Number or Direct --</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.fullName} ({l.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Recipient Mobile:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 03001234567"
                      value={recipientPhone}
                      onChange={(e) => {
                        setSelectedLeadId("");
                        setCustomPhone(e.target.value);
                      }}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Pre-formatted Message Textarea */}
                <div className="relative">
                  <textarea
                    rows={8}
                    readOnly
                    value={activeWaTab === "ur" ? calcResult.whatsapp_breakdown_ur : calcResult.whatsapp_breakdown_en}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPitch ? "Copied!" : "Copy Pitch"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open WhatsApp & Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Calculator className="w-8 h-8 text-[#EE6427] mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-slate-500">Calculating FBR tax brackets...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaxCalculatorPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading calculator...</div>}>
        <TaxCalculatorContent />
      </Suspense>
    </AppShell>
  );
}
