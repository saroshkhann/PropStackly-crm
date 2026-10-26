"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BackendPublicDossier } from "@/lib/api";
import { CurrencyCode, SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/currency";
import {
  SUPPORTED_TIMEZONES,
  convertTimeBetweenZones,
  OverseasTimezone,
} from "@/lib/timezone";
import {
  Building,
  ShieldCheck,
  Video,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Globe,
  CheckCircle2,
  Share2,
  ExternalLink,
  ChevronRight,
  Eye,
  FileText,
  MapPin,
  Sparkles,
  Award,
  Check,
  Loader2,
} from "lucide-react";

interface ClientPortalViewProps {
  dossier: BackendPublicDossier;
}

export function ClientPortalView({ dossier }: ClientPortalViewProps) {
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>(
    (dossier.default_currency as CurrencyCode) || "GBP"
  );

  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "video" | "specs">(
    "photos"
  );
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Tour Booking State
  const [clientName, setClientName] = useState(dossier.target_buyer_name || "");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTzId, setClientTzId] = useState("Europe/London");
  const [tourDate, setTourDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [tourTime, setTourTime] = useState("16:00");
  const [platform, setPlatform] = useState("whatsapp_video");
  const [tourNotes, setTourNotes] = useState("");

  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const selectedTz =
    SUPPORTED_TIMEZONES.find((t) => t.id === clientTzId) || SUPPORTED_TIMEZONES[0];

  const convertedPkt = convertTimeBetweenZones(
    tourDate,
    tourTime,
    clientTzId,
    "Asia/Karachi"
  );

  const handleBookVirtualTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;

    setIsBooking(true);
    setBookingError(null);

    try {
      const res = await fetch(`/api/backend/public/share/${dossier.token}/book-tour`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          client_email: clientEmail.trim() || undefined,
          client_timezone: clientTzId,
          visit_date: tourDate,
          visit_time: tourTime,
          is_time_in_client_tz: true,
          platform,
          notes: tourNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to schedule walkthrough. Please try again or message via WhatsApp.");
      }

      const data = await res.json();
      setBookingSuccess(data);
    } catch (err: any) {
      setBookingError(err.message || "Something went wrong.");
    } finally {
      setIsBooking(false);
    }
  };

  const currentPriceFormatted =
    activeCurrency === "PKR"
      ? dossier.formatted_pkr
      : formatCurrency(dossier.price_pkr, activeCurrency, false);

  const gallery =
    dossier.gallery_images && dossier.gallery_images.length > 0
      ? dossier.gallery_images
      : [dossier.image_url];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#EE6427] selection:text-white">
      {/* Top Overseas Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EE6427] flex items-center justify-center font-bold text-white shadow-lg shadow-[#EE6427]/30">
              V
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                {dossier.agency.name}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-orange-400 font-medium ml-2 px-2 py-0.5 rounded-full bg-orange-950 border border-orange-900">
                Overseas Private Portfolio
              </span>
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden md:inline">Currency:</span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700">
              {(["PKR", "GBP", "USD", "AED", "SAR"] as CurrencyCode[]).map((c) => {
                const meta = SUPPORTED_CURRENCIES[c];
                const isSel = activeCurrency === c;
                return (
                  <button
                    key={c}
                    onClick={() => setActiveCurrency(c)}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isSel
                        ? "bg-[#EE6427] text-white font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{meta.flag}</span>{" "}
                    <span className="hidden sm:inline">{c}</span>
                  </button>
                );
              })}
            </div>

            <a
              href={dossier.direct_whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md cursor-pointer ml-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Advisor</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Personalization Greeting Card */}
        {dossier.target_buyer_name && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-stone-900 to-slate-900 border border-[#EE6427]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#EE6427]/20 border border-orange-400/30 text-orange-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-orange-300 font-semibold uppercase tracking-wider">
                  Exclusive Overseas Client Dossier
                </p>
                <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  Prepared exclusively for {dossier.target_buyer_name}
                  {dossier.target_buyer_city && ` • ${dossier.target_buyer_city}, ${dossier.target_buyer_country || ""}`}
                </h2>
                {dossier.custom_pitch && (
                  <p className="text-xs text-slate-300 mt-1 italic">
                    &ldquo;{dossier.custom_pitch}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Legal Title
              </span>
            </div>
          </div>
        )}

        {/* Title & Price Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                {dossier.type}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                {dossier.location}, {dossier.society}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {dossier.title}
            </h1>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs text-slate-400 font-medium">Asking Price / Demand</p>
            <div className="flex items-baseline lg:justify-end gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {currentPriceFormatted}
              </span>
              {activeCurrency !== "PKR" && (
                <span className="text-sm text-slate-400 font-mono">
                  ({dossier.formatted_pkr})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live Interbank Rate • State Bank of Pakistan Compliant
            </p>
          </div>
        </div>

        {/* Media Gallery & Walkthrough Showcase */}
        <div className="space-y-3">
          {/* Media Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveMediaTab("photos")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMediaTab === "photos"
                  ? "bg-[#EE6427] text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              HD Photos ({gallery.length})
            </button>
            <button
              onClick={() => setActiveMediaTab("video")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMediaTab === "video"
                  ? "bg-[#EE6427] text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Walkthrough
            </button>
            <button
              onClick={() => setActiveMediaTab("specs")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeMediaTab === "specs"
                  ? "bg-[#EE6427] text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Floor Plan & Specs
            </button>
          </div>

          {/* Active Tab View */}
          {activeMediaTab === "photos" && (
            <div className="space-y-3">
              {/* Hero Image Display */}
              <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                <img
                  src={gallery[selectedPhotoIndex] || dossier.image_url}
                  alt={dossier.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-white border border-slate-700/60">
                    {dossier.area_size}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-orange-950/80 backdrop-blur-md text-xs font-semibold text-orange-300 border border-orange-800/60">
                    {dossier.society}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative aspect-16/10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? "border-[#EE6427] ring-2 ring-[#EE6427]/30 scale-102"
                          : "border-slate-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMediaTab === "video" && (
            <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EE6427]/20 border border-[#EE6427]/40 text-orange-400 flex items-center justify-center mb-3">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-white">4K Walkthrough Video Tour Available</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                A 7-minute guided video walkthrough detailing exterior structure, double-height lobby, designer kitchen, and Margalla view terrace.
              </p>
              <a
                href={dossier.direct_whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 bg-[#EE6427] hover:bg-orange-50 dark:hover:bg-orange-950/400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
              >
                <MessageSquare className="w-4 h-4" />
                Request Private Walkthrough Video on WhatsApp
              </a>
            </div>
          )}

          {activeMediaTab === "specs" && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Architectural & Structural Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400">Total Plot Size</span>
                  <p className="font-bold text-white text-sm mt-0.5">{dossier.area_size}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400">Bedrooms</span>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {dossier.bedrooms || "N/A"} Luxury Suites
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400">Bathrooms</span>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {dossier.bathrooms || "N/A"} Imported Fitted
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400">Possession</span>
                  <p className="font-bold text-emerald-400 text-sm mt-0.5">
                    {dossier.possession_status}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {dossier.description}
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Grid: Legal Assurances & Virtual Tour Scheduler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Legal Verification & Transparency for Overseas */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Legal Verification & Overseas Safeguards
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                As an overseas Pakistani buyer, complete legal security is paramount. This property has undergone formal legal title vetting:
              </p>

              <div className="space-y-2.5 pt-1">
                {dossier.legal_assurances.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* RDA SBP Repatriation Note */}
              <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-900/60 text-xs text-orange-200 space-y-1">
                <p className="font-bold text-orange-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Roshan Digital Account (RDA) Support
                </p>
                <p className="text-[11px] text-orange-200/80 leading-relaxed">
                  Funds transferred through your RDA account allow 100% full tax-exempt capital repatriation back to the UK, UAE, or USA anytime upon future sale.
                </p>
              </div>
            </div>

            {/* Agent Contact Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={dossier.agent.avatar_url}
                  alt={dossier.agent.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{dossier.agent.name}</h4>
                  <p className="text-xs text-slate-400">{dossier.agent.role_title}</p>
                  <p className="text-[11px] text-orange-400 mt-0.5">{dossier.agency.name}</p>
                </div>
              </div>

              <a
                href={dossier.direct_whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Direct</span>
              </a>
            </div>
          </div>

          {/* Right Column: WhatsApp Video Tour Scheduler with Timezone Conversion */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-orange-400">
              <Video className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Book Virtual Video Walkthrough
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatic timezone conversion — inspect live from anywhere in the world
                </p>
              </div>
            </div>

            {!bookingSuccess ? (
              <form onSubmit={handleBookVirtualTour} className="space-y-3.5 pt-2">
                {bookingError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                    {bookingError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Dr. Tariq Mahmood"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+44 7911 123456"
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@domain.co.uk"
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                    />
                  </div>
                </div>

                {/* Timezone Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Current Timezone
                  </label>
                  <select
                    value={clientTzId}
                    onChange={(e) => setClientTzId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  >
                    {SUPPORTED_TIMEZONES.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.flag} {tz.country} — {tz.city} ({tz.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Pickers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={tourDate}
                      onChange={(e) => setTourDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Local Time ({selectedTz.code})
                    </label>
                    <input
                      type="time"
                      required
                      value={tourTime}
                      onChange={(e) => setTourTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                    />
                  </div>
                </div>

                {/* Dual Timezone Live Feedback */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Your Local Time</p>
                    <p className="font-bold text-white text-sm">
                      {tourTime} ({selectedTz.code})
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Pakistan Time (PKT)</p>
                    <p className="font-bold text-emerald-400 text-sm">
                      {convertedPkt.display}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Specific Rooms / Inquiries to Focus On
                  </label>
                  <input
                    type="text"
                    value={tourNotes}
                    onChange={(e) => setTourNotes(e.target.value)}
                    placeholder="e.g. Solar net-metering setup, master suite, layout plan"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBooking}
                  className="w-full py-2.5 px-4 bg-[#EE6427] hover:bg-orange-50 dark:hover:bg-orange-950/400 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scheduling Walkthrough...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule Virtual Walkthrough
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-sm text-white">
                    Walkthrough Appointment Confirmed!
                  </h4>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Your consultant <strong>{dossier.agent.name}</strong> has received the booking request for{" "}
                  <strong>{bookingSuccess.visit_date}</strong> at <strong>{bookingSuccess.client_local_time}</strong> (Islamabad: {bookingSuccess.pkt_time}).
                </p>
                <div className="pt-2">
                  <a
                    href={bookingSuccess.direct_whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Confirmed Appointment on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating WhatsApp Action Pill for Mobile */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href={dossier.direct_whatsapp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xl transition-all hover:scale-105 cursor-pointer border border-emerald-400/40"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
