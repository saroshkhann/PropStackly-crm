"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Check,
  Building2,
  Copy,
  MessageCircle,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  Phone,
  RefreshCw,
} from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { formatPKR } from "@/lib/formatters";

interface TrialUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrialUpgradeModal({ isOpen, onClose }: TrialUpgradeModalProps) {
  const {
    settings,
    activateSubscription,
    resetTrial,
    isTrialExpired,
    trialRemainingFormatted,
    isOwner,
  } = useCRM();

  const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "enterprise">("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [paymentRef, setPaymentRef] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      id: "starter" as const,
      name: "Agency Starter",
      tagline: "For boutique real estate agencies & teams up to 5 agents",
      monthlyPKR: 15_000,
      annualPKR: 144_000, // 12,000/mo (20% off)
      features: [
        "Up to 5 Real Estate Agents",
        "Unlimited Leads & Smart Matching",
        "Pakistani Deals Pipeline (Token & Bayana)",
        "FBR Tax Calculator (236K, 236C, 7E)",
        "Speed-to-Lead SLA Monitoring",
        "WhatsApp Click-to-Chat Integration",
      ],
      popular: false,
    },
    {
      id: "growth" as const,
      name: "Agency Growth",
      tagline: "Most popular for active brokerage firms in DHA & Bahria",
      monthlyPKR: 28_000,
      annualPKR: 268_800, // 22,400/mo
      features: [
        "Up to 15 Real Estate Agents",
        "Interactive Society Plot Master Maps",
        "Overseas Client Tokenized Dossiers",
        "Installment Plan Schedules & Due Reminders",
        "Agent Commission Hisab-Kitab Vouchers",
        "n8n Automated Webhook Triggers",
        "Priority WhatsApp & Phone Support",
      ],
      popular: true,
    },
    {
      id: "enterprise" as const,
      name: "Developer & Enterprise",
      tagline: "For large builders, developers & multi-city franchises",
      monthlyPKR: 55_000,
      annualPKR: 528_000,
      features: [
        "Unlimited Agents & Branch Offices",
        "Custom Society Plot Maps Digitization",
        "Dedicated Database & Custom Domain",
        "Official Meta WhatsApp Cloud API Setup",
        "On-Site Staff Training in Islamabad / Lahore",
        "24/7 Dedicated Account Manager",
      ],
      popular: false,
    },
  ];

  const currentPlanObj = plans.find((p) => p.id === selectedPlan) || plans[0];
  const priceToPay =
    billingCycle === "annual" ? currentPlanObj.annualPKR : currentPlanObj.monthlyPKR;

  // Pakistani Bank Account Details for IBFT
  const bankDetails = {
    bankName: "Meezan Bank Limited",
    accountTitle: "PropStackly Technologies (SMC-Pvt) Ltd",
    accountNumber: "0104-0105849201",
    iban: "PK44MEZN0001040105849201",
    branch: "Blue Area Branch, Islamabad",
    raastId: "+92 300 5550192",
    whatsappSales: "923005550192", // formatted for wa.me
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef.trim()) {
      alert("Please enter your IBFT Transaction Reference number or voucher ID.");
      return;
    }

    try {
      setIsSubmitting(true);
      await activateSubscription({
        plan: selectedPlan,
        duration_months: billingCycle === "annual" ? 12 : 1,
        payment_method: "IBFT",
        payment_reference: paymentRef.trim(),
        notes: `Activated via PropStackly In-App Upgrade (${billingCycle} plan)`,
      });
      setIsSubmitting(false);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppUpgradeUrl = () => {
    const text = encodeURIComponent(
      `Assalam-o-Alaikum PropStackly Team! 👋\n\nI want to activate the *${currentPlanObj.name}* (${billingCycle}) for our agency *${settings.agencyName}*.\n\nAmount: ${formatPKR(priceToPay)}\nCity: ${settings.city}\nContact: ${settings.contactPhone}\n\nPlease share the payment invoice and confirmation.`
    );
    return `https://wa.me/${bankDetails.whatsappSales}?text=${text}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* HEADER */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950 text-white shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Agency Pro Licensing
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Status: {isTrialExpired ? "🚨 3-Day Trial Concluded" : `⏳ ${trialRemainingFormatted}`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Upgrade {settings.agencyName} to PropStackly Pro
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Empower your property consultants with Pakistan&apos;s most comprehensive real estate CRM. Keep your inventory, leads, plot maps, and commission ledgers running smoothly.
          </p>

          {/* Billing Cycle Switch */}
          <div className="mt-4 flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl w-fit border border-slate-700">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#EE6427] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === "annual"
                  ? "bg-[#EE6427] text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual Billing
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full border border-emerald-500/40 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const price = billingCycle === "annual" ? plan.annualPKR : plan.monthlyPKR;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#EE6427] bg-orange-50/30 dark:bg-orange-950/20 shadow-md ring-2 ring-[#EE6427]/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EE6427] text-white shadow-xs">
                      Recommended
                    </span>
                  )}

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center justify-between">
                      {plan.name}
                      {isSelected && <Check className="w-4 h-4 text-[#EE6427]" />}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                      {plan.tagline}
                    </p>

                    <div className="mt-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-2xl font-black text-slate-950 dark:text-white">
                        {formatPKR(price)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {billingCycle === "annual" ? "per year (all taxes included)" : "per month"}
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan.id);
                    }}
                    className={`mt-5 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[#EE6427] text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Selected Plan" : "Choose Plan"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pakistani Bank IBFT Payment Section */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#EE6427]" />
                  Pay via Online Bank Transfer (IBFT / Raast)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transfer <strong className="text-slate-900 dark:text-white">{formatPKR(priceToPay)}</strong> directly from Meezan, HBL, Bank Alfalah, Nayapay, or SadaPay app.
                </p>
              </div>

              {/* Direct WhatsApp Sales Link */}
              <a
                href={generateWhatsAppUpgradeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Sales for Invoice
              </a>
            </div>

            {/* Account particulars table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Bank Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{bankDetails.bankName}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Account Title</span>
                <span className="font-bold text-slate-900 dark:text-white">{bankDetails.accountTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Account Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{bankDetails.accountNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankDetails.accountNumber, "acc")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copy Account Number"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">IBAN (Raast Ready)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{bankDetails.iban}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankDetails.iban, "iban")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copy IBAN"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {copiedField && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                ✓ Copied {copiedField === "acc" ? "Account Number" : "IBAN"} to clipboard!
              </p>
            )}

            {/* Submit Reference Form */}
            <form onSubmit={handleActivateSubmit} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Enter IBFT Transaction Reference / Slip ID (e.g. MZN-948102)"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#EE6427] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#EE6427] hover:bg-[#d5531d] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSubmitting ? "Activating..." : "Submit & Activate License"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Demo Controls for Owner / Testing */}
          {isOwner && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Agency Owner Admin Controls
                </span>
                <p className="text-amber-800/80 dark:text-amber-400 text-[11px]">
                  Use these controls to test trial renewal or instant activation without leaving the app.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetTrial(3);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold hover:bg-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restart 3-Day Trial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    activateSubscription({
                      plan: "growth",
                      duration_months: 12,
                      payment_method: "Admin Override",
                      payment_reference: "OWNER-DIRECT-ACTIVATE",
                    });
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Instant Pro Activation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
