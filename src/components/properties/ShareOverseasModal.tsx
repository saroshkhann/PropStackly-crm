"use client";

import React, { useState } from "react";
import { Property, Lead } from "@/types/crm";
import { useCRM } from "@/context/CRMContext";
import api, { BackendShareLink } from "@/lib/api";
import { formatPKR } from "@/lib/formatters";
import { CurrencyCode, formatCurrency } from "@/lib/currency";
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Sparkles,
  ShieldCheck,
  Video,
  ExternalLink,
  MessageSquare,
  Loader2,
  Eye,
} from "lucide-react";

interface ShareOverseasModalProps {
  property: Property;
  lead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

const OVERSEAS_COUNTRIES = [
  { country: "United Kingdom", defaultCity: "London", currency: "GBP" as CurrencyCode },
  { country: "United Arab Emirates", defaultCity: "Dubai", currency: "AED" as CurrencyCode },
  { country: "Saudi Arabia", defaultCity: "Riyadh", currency: "SAR" as CurrencyCode },
  { country: "United States", defaultCity: "New York", currency: "USD" as CurrencyCode },
  { country: "Canada", defaultCity: "Toronto", currency: "CAD" as any },
  { country: "Australia", defaultCity: "Sydney", currency: "USD" as CurrencyCode },
];

export function ShareOverseasModal({
  property,
  lead,
  isOpen,
  onClose,
}: ShareOverseasModalProps) {
  const { showToast, currentAgent, settings } = useCRM();

  const [buyerName, setBuyerName] = useState(lead?.fullName || "");
  const [country, setCountry] = useState("United Kingdom");
  const [city, setCity] = useState("London");
  const [buyerPhone, setBuyerPhone] = useState(lead?.phone || "");
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>("GBP");
  const [customPitch, setCustomPitch] = useState(
    lead
      ? `Selected specifically for your investment requirement in ${property.society}.`
      : "Exclusive verified luxury inventory dossier for your property portfolio."
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [createdShare, setCreatedShare] = useState<BackendShareLink | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  if (!isOpen) return null;

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const found = OVERSEAS_COUNTRIES.find((c) => c.country === selectedCountry);
    if (found) {
      setCity(found.defaultCity);
      if (found.currency && ["GBP", "AED", "SAR", "USD"].includes(found.currency)) {
        setDefaultCurrency(found.currency);
      }
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.overseas.createShareLink(property.id, {
        lead_id: lead?.id,
        target_buyer_name: buyerName.trim() || undefined,
        target_buyer_country: country,
        target_buyer_city: city,
        target_buyer_phone: buyerPhone.trim() || undefined,
        custom_pitch: customPitch.trim() || undefined,
        default_currency: defaultCurrency,
      });

      setCreatedShare(res);
      showToast("Exclusive Overseas Client Dossier link generated!");
    } catch (err: any) {
      showToast(err.message || "Failed to generate overseas link", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const getFullShareUrl = () => {
    if (!createdShare) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${origin}${createdShare.share_url}`;
  };

  const handleCopyLink = () => {
    const url = getFullShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("Share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyPitch = () => {
    if (!createdShare) return;
    navigator.clipboard.writeText(createdShare.whatsapp_share_text);
    setCopiedPitch(true);
    showToast("WhatsApp pitch copied!");
    setTimeout(() => setCopiedPitch(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!createdShare) return;
    const phoneToUse = buyerPhone || lead?.phone || "";
    const cleanPhone = phoneToUse.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(createdShare.whatsapp_share_text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    showToast("Launching WhatsApp with pre-filled dossier link...");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EE6427]/20 border border-orange-400/30 text-orange-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Overseas Buyer Share Dossier
              </h3>
              <p className="text-xs text-orange-200/80 mt-0.5">
                Tokenized branded link with HD walkthrough, NOC verification & multi-currency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Brief Pill */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-3">
            <p className="font-bold text-slate-800 dark:text-white truncate">{property.title}</p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              {property.location}, {property.society}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatPKR(property.pricePKR)}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ~{formatCurrency(property.pricePKR, defaultCurrency, false)}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!createdShare ? (
            <form onSubmit={handleGenerateLink} className="space-y-4">
              {/* Value proposition badges */}
              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="p-2 rounded-lg bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-950/50 text-center">
                  <Video className="w-4 h-4 text-[#EE6427] mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-orange-950 dark:text-orange-100">HD Walkthrough</p>
                  <p className="text-[10px] text-[#DE5518] dark:text-orange-400/80">No giant file downloads</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">NOC & Legal</p>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">CDA/RDA verified title</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-center">
                  <Globe className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">Multi-Currency</p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">PKR, GBP, USD, AED, SAR</p>
                </div>
              </div>

              {/* Target Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Tariq Mahmood"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {OVERSEAS_COUNTRIES.map((c) => (
                      <option key={c.country} value={c.country}>
                        {c.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Timezone Hub
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Currency Display
                  </label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="GBP">🇬🇧 GBP (£) - British Pound</option>
                    <option value="AED">🇦🇪 AED - UAE Dirham</option>
                    <option value="SAR">🇸🇦 SAR - Saudi Riyal</option>
                    <option value="USD">🇺🇸 USD ($) - US Dollar</option>
                    <option value="PKR">🇵🇰 PKR - Pakistani Rupee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client WhatsApp Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +44 7911 123456 or +971 50 1234567"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personalized Advisor Note
                </label>
                <textarea
                  rows={2}
                  value={customPitch}
                  onChange={(e) => setCustomPitch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#EE6427]/60 focus:outline-hidden bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="Note that appears prominently on the client's private portal..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !buyerName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Secure Token...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Tokenized Overseas Dossier
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Created State with 1-Click Copy and WhatsApp Dispatch */
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    Tokenized Dossier Link Ready!
                  </h4>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mt-0.5">
                    Personalized for <strong>{createdShare.target_buyer_name}</strong> in{" "}
                    {createdShare.target_buyer_city}, {createdShare.target_buyer_country}.
                  </p>
                </div>
              </div>

              {/* Share URL Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Private Client Web Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullShareUrl()}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={getFullShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg transition-colors border border-orange-200 dark:border-orange-900/60"
                    title="Preview Client View"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* WhatsApp Message Preview & Action */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pre-Formatted WhatsApp Outreach
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                  {createdShare.whatsapp_share_text}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {copiedPitch ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Pitch Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Pitch
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {property.nocStatus || (property as any).noc_status || "CDA/RDA Approved"} • Verified Title Transfer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
