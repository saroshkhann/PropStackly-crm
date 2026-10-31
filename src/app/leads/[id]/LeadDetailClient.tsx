"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import api, { BackendDeal } from "@/lib/api";
import {
  formatPKR,
  formatPhoneNumber,
  formatDate,
  formatDateTime,
  getLeadStatusConfig,
  getPriorityConfig,
  getWhatsAppLink,
} from "@/lib/formatters";
import { LeadStatus, LeadPriority, Lead, Property } from "@/types/crm";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  MessageSquare,
  Calendar,
  Compass,
  MapPin,
  Building,
  DollarSign,
  User,
  Clock,
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Tag,
  ShieldCheck,
  Building2,
  Lock,
  BookmarkPlus,
  Loader2,
  Check,
  Trash2,
  X,
  Sparkles,
  Flame,
  Share2,
  Copy,
  Eye,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  Video,
  Globe,
  Handshake,
  Calculator,
  Scale,
} from "lucide-react";
import { VirtualTourModal } from "@/components/leads/VirtualTourModal";
import { ShareOverseasModal } from "@/components/properties/ShareOverseasModal";
import { DealModal } from "@/components/deals/DealModal";
import LegalDocumentsModal from "@/components/deals/LegalDocumentsModal";

export interface MatchedPropertyDisplay {
  id: string;
  title: string;
  type: string;
  location: string;
  society: string;
  city: string;
  pricePKR: number;
  areaSize: string;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  imageUrl: string;
  matchScore: number;
  matchLevel: "exceptional" | "strong" | "moderate";
  budgetFit: "exact" | "within_budget" | "below_budget" | "above_budget";
  budgetDeltaPKR: number;
  reasons: string[];
  whatsappPitchText: string;
  whatsappPitchTextUrdu: string;
}

function computeLocalMatches(
  lead: Lead,
  properties: Property[],
  agentName: string,
  agencyName: string
): MatchedPropertyDisplay[] {
  return properties
    .filter((p) => p.status !== "sold")
    .map((prop) => {
      const reasons: string[] = [];

      // 1. Location / Society Match (40 pts)
      let locationScore = 0;
      const propSoc = prop.society.toLowerCase();
      const propLoc = prop.location.toLowerCase();
      const preferred = Array.isArray(lead.preferredLocations)
        ? lead.preferredLocations
        : [String(lead.preferredLocations)];

      let exactMatch = false;
      let partialMatch = false;

      for (const loc of preferred) {
        const locNorm = loc.toLowerCase().trim();
        if (locNorm && (propSoc.includes(locNorm) || locNorm.includes(propSoc))) {
          exactMatch = true;
          break;
        }
        const keywords = locNorm
          .split(" ")
          .filter((w) => w.length > 2 && !["phase", "sector", "islamabad", "rawalpindi"].includes(w));
        for (const kw of keywords) {
          if (propSoc.includes(kw) || propLoc.includes(kw)) {
            partialMatch = true;
            break;
          }
        }
      }

      if (exactMatch) {
        locationScore = 40;
        reasons.push(`Target Society: ${prop.society} (+40%)`);
      } else if (partialMatch) {
        locationScore = 25;
        reasons.push(`Area Proximity: ${prop.society} (+25%)`);
      } else if (lead.city && prop.city && lead.city.toLowerCase() === prop.city.toLowerCase()) {
        locationScore = 15;
        reasons.push(`City Match: ${prop.city} (+15%)`);
      }

      // 2. Budget Fit (35 pts)
      let budgetScore = 0;
      const delta = prop.pricePKR - lead.budgetPKR;
      let budgetFit: "exact" | "within_budget" | "below_budget" | "above_budget" = "within_budget";

      if (lead.budgetPKR > 0) {
        const ratio = prop.pricePKR / lead.budgetPKR;
        if (ratio >= 0.90 && ratio <= 1.05) {
          budgetScore = 35;
          budgetFit = ratio === 1.0 ? "exact" : "within_budget";
          reasons.push(`Optimal Budget Fit (within ±8%) (+35%)`);
        } else if (ratio >= 0.75 && ratio <= 1.25) {
          budgetScore = 28;
          budgetFit = ratio < 1.0 ? "below_budget" : "above_budget";
          reasons.push(`Close Budget Match (${Math.round(ratio * 100)}% of target) (+28%)`);
        } else if (ratio >= 0.60 && ratio <= 1.40) {
          budgetScore = 18;
          budgetFit = ratio < 1.0 ? "below_budget" : "above_budget";
          reasons.push(`Negotiable Price Range (+18%)`);
        } else if (ratio >= 0.50 && ratio <= 1.55) {
          budgetScore = 8;
          budgetFit = ratio < 1.0 ? "below_budget" : "above_budget";
          reasons.push(`Broad Price Band (+8%)`);
        }
      } else {
        budgetScore = 20;
        reasons.push(`Open Budget Range (+20%)`);
      }

      // 3. Property Type Match (25 pts)
      let typeScore = 0;
      const leadTypeNorm = (lead.propertyTypeInterest || "").toLowerCase();
      const propTypeNorm = (prop.type || "").toLowerCase();

      if (leadTypeNorm === propTypeNorm) {
        typeScore = 25;
        reasons.push(`Exact Property Type: ${prop.type} (+25%)`);
      } else if (
        (leadTypeNorm.includes("house") || leadTypeNorm.includes("villa")) &&
        (propTypeNorm.includes("house") || propTypeNorm.includes("villa"))
      ) {
        typeScore = 25;
        reasons.push(`Residential Villa Category (+25%)`);
      } else if (leadTypeNorm.includes("plot") && propTypeNorm.includes("plot")) {
        typeScore = 25;
        reasons.push(`Plot Category Match (+25%)`);
      } else if (leadTypeNorm.includes("commercial") && propTypeNorm.includes("commercial")) {
        typeScore = 25;
        reasons.push(`Commercial Category Match (+25%)`);
      } else if (leadTypeNorm.includes("residential") || propTypeNorm.includes("residential")) {
        typeScore = 12;
        reasons.push(`Residential Fit (+12%)`);
      }

      const totalScore = Math.min(100, Math.max(10, locationScore + budgetScore + typeScore));
      const matchLevel: "exceptional" | "strong" | "moderate" =
        totalScore >= 85 ? "exceptional" : totalScore >= 65 ? "strong" : "moderate";

      const budgetComparison =
        delta === 0
          ? "Exact budget match"
          : delta < 0
          ? `${formatPKR(Math.abs(delta))} below maximum budget`
          : `Only ${formatPKR(delta)} above initial budget`;

      const budgetComparisonUrdu =
        delta === 0
          ? "Aap ke budget ke bilkul mutabiq"
          : delta < 0
          ? `${formatPKR(Math.abs(delta))} aap ke budget se kam`
          : `Sirf ${formatPKR(delta)} target budget se ooper`;

      const specsStr = prop.bedrooms
        ? `\n🛏 *Specs*: ${prop.bedrooms} Bedrooms, ${prop.bathrooms} Bathrooms`
        : "";

      const specsStrUrdu = prop.bedrooms
        ? `\n🛏 *Specs*: ${prop.bedrooms} Bedrooms, ${prop.bathrooms} Bathrooms`
        : "";

      const whatsappPitch =
        `Assalam-o-Alaikum ${lead.fullName}!\n\n` +
        `Based on your requirement for a ${lead.propertyTypeInterest} in ${prop.society} ` +
        `(Target: ${formatPKR(lead.budgetPKR)}), I have found an option that matches your criteria (*${totalScore}% Match*):\n\n` +
        `🏠 *${prop.title}*\n` +
        `📍 *Location*: ${prop.location}, ${prop.society}\n` +
        `💰 *Demand*: ${formatPKR(prop.pricePKR)} (${budgetComparison})\n` +
        `📐 *Area Size*: ${prop.areaSize}${specsStr}\n` +
        `✨ *Highlights*: Verified ownership documents with immediate transfer.\n\n` +
        `Would you like to review the layout plan or schedule a site visit this week?\n\n` +
        `Best regards,\n` +
        `*${agentName}*\n` +
        `${agencyName}`;

      const whatsappPitchUrdu =
        `السلام علیکم ${lead.fullName} صاحب!\n\n` +
        `Aap ki requirement ke mutabiq ${prop.society} mein ${lead.propertyTypeInterest} ` +
        `(Target: ${formatPKR(lead.budgetPKR)}) ke liye ek behtareen property mili hai (*${totalScore}% Match*):\n\n` +
        `🏠 *${prop.title}*\n` +
        `📍 *Location*: ${prop.location}, ${prop.society}\n` +
        `💰 *Demand*: ${formatPKR(prop.pricePKR)} (${budgetComparisonUrdu})\n` +
        `📐 *Size*: ${prop.areaSize}${specsStrUrdu}\n` +
        `✨ *Highlights*: Clear title deed, society verified documents, aur fori biometric transfer available.\n\n` +
        `Kya aap is hafte is property ka video walkthrough dekhna chahein ge ya physical site visit schedule karein?\n\n` +
        `Shukriya,\n` +
        `*${agentName}*\n` +
        `${agencyName}`;

      return {
        id: prop.id,
        title: prop.title,
        type: prop.type,
        location: prop.location,
        society: prop.society,
        city: prop.city,
        pricePKR: prop.pricePKR,
        areaSize: prop.areaSize,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        status: prop.status,
        imageUrl: prop.imageUrl,
        matchScore: totalScore,
        matchLevel,
        budgetFit,
        budgetDeltaPKR: delta,
        reasons,
        whatsappPitchText: whatsappPitch,
        whatsappPitchTextUrdu: whatsappPitchUrdu,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function LeadDetailClient({ leadId }: { leadId: string }) {
  return (
    <AppShell>
      <LeadDetailInner leadId={leadId} />
    </AppShell>
  );
}

function LeadDetailInner({ leadId }: { leadId: string }) {
  const router = useRouter();
  const {
    leads,
    properties,
    agents,
    notes,
    activities,
    followUps,
    siteVisits,
    currentAgent,
    settings,
    updateLeadStatus,
    reassignLead,
    associatePropertyToLead,
    removePropertyFromLead,
    addNote,
    logActivity,
    addFollowUp,
    addSiteVisit,
    toggleFollowUp,
    showToast,
    isManager,
    isOwner,
    isAgent,
  } = useCRM();

  const lead = leads.find((l) => l.id === leadId);

  // Active tab state in main section
  const [activeTab, setActiveTab] = useState<"matches" | "notes" | "timeline" | "followups">("matches");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  // WhatsApp Pitch preview modal state
  const [previewPitchMatch, setPreviewPitchMatch] = useState<MatchedPropertyDisplay | null>(null);
  const [pitchMessageText, setPitchMessageText] = useState("");
  const [pitchLanguage, setPitchLanguage] = useState<"en" | "ur">("en");
  const [isCopiedPitch, setIsCopiedPitch] = useState(false);

  // Note form state
  const [newNoteText, setNewNoteText] = useState("");
  const [todayStr, setTodayStr] = useState("2026-10-21");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  // Modals state
  const [showScheduleFU, setShowScheduleFU] = useState(false);
  const [fuDate, setFuDate] = useState(todayStr);
  const [fuTime, setFuTime] = useState("14:30");
  const [fuType, setFuType] = useState<any>("Phone Call");
  const [fuNotes, setFuNotes] = useState("");

  const [showScheduleSV, setShowScheduleSV] = useState(false);
  const [svPropertyId, setSvPropertyId] = useState(properties[0]?.id || "");
  const [svDate, setSvDate] = useState(todayStr);
  const [svTime, setSvTime] = useState("16:00");
  const [svNotes, setSvNotes] = useState("");
  const [svError, setSvError] = useState<string | null>(null);
  const [isBookingSV, setIsBookingSV] = useState(false);

  // Link property modal state
  const [showLinkPropertyModal, setShowLinkPropertyModal] = useState(false);
  const [linkPropId, setLinkPropId] = useState(properties[0]?.id || "");
  const [linkPropNotes, setLinkPropNotes] = useState("");
  const [isLinkingProp, setIsLinkingProp] = useState(false);
  const [linkPropError, setLinkPropError] = useState<string | null>(null);

  // Overseas & Virtual Tour Modals
  const [showVirtualTourModal, setShowVirtualTourModal] = useState(false);
  const [virtualTourPropId, setVirtualTourPropId] = useState("");
  const [showOverseasShareModal, setShowOverseasShareModal] = useState(false);
  const [shareOverseasProp, setShareOverseasProp] = useState<Property | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Active Pakistani Deal Tracking
  const [activeDeal, setActiveDeal] = useState<BackendDeal | null>(null);
  const [loadingDeal, setLoadingDeal] = useState<boolean>(true);

  const fetchActiveDeal = useCallback(async () => {
    if (!leadId) return;
    try {
      setLoadingDeal(true);
      const deals = await api.deals.getAll({ lead_id: leadId });
      const found = deals.find((d) => d.stage !== "cancelled");
      setActiveDeal(found || null);
    } catch (err) {
      console.error("Failed to fetch deal for lead:", err);
    } finally {
      setLoadingDeal(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchActiveDeal();
  }, [fetchActiveDeal]);

  const agentName = currentAgent?.name || "Hamza Malik";
  const agencyName = settings?.agencyName || "Apex Properties Islamabad";

  // Compute live smart matches
  const allMatchedProperties = useMemo(() => {
    if (!lead) return [];
    return computeLocalMatches(lead, properties, agentName, agencyName);
  }, [lead, properties, agentName, agencyName]);

  const filteredMatches = useMemo(() => {
    if (minScoreFilter === 0) return allMatchedProperties;
    return allMatchedProperties.filter((m) => m.matchScore >= minScoreFilter);
  }, [allMatchedProperties, minScoreFilter]);

  if (!lead) {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Lead Record Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          This enquiry may have been removed or does not exist.
        </p>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-[#EE6427] text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Leads Directory
        </Link>
      </div>
    );
  }

  const agent = agents.find((a) => a.id === lead.assignedAgentId);
  const leadNotes = notes[lead.id] || [];
  const leadActivities = activities.filter((a) => a.leadId === lead.id);
  const leadFollowUps = followUps.filter((f) => f.leadId === lead.id);
  const leadSiteVisits = siteVisits.filter((s) => s.leadId === lead.id);

  const statusConfig = getLeadStatusConfig(lead.status);
  const priorityConfig = getPriorityConfig(lead.priority);

  const firstLoc = Array.isArray(lead.preferredLocations) ? lead.preferredLocations[0] : "Islamabad";
  const waGreeting = `Assalam-o-Alaikum ${lead.fullName}, this is ${currentAgent?.name || "Hamza Malik"} from ${agencyName}. I have selected premium options matching your requirement in ${firstLoc || "Islamabad"}.`;
  const waLink = getWhatsAppLink(lead.phone, waGreeting);

  const isPropertyShortlisted = (propId: string) => {
    return lead.associatedProperties?.some((ap) => ap.propertyId === propId);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(lead.id, newNoteText.trim());
    setNewNoteText("");
  };

  const handleScheduleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    addFollowUp({
      leadId: lead.id,
      leadName: lead.fullName,
      leadPhone: lead.phone,
      assignedAgentId: lead.assignedAgentId,
      agentName: agent?.name || "Consultant",
      scheduledDate: fuDate,
      scheduledTime: fuTime,
      type: fuType,
      notes: fuNotes || "General follow-up regarding property requirements",
      priority: "high",
    });
    setShowScheduleFU(false);
    setFuNotes("");
  };

  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSvError(null);
    setIsBookingSV(true);
    const selectedProp = properties.find((p) => p.id === svPropertyId);
    try {
      await addSiteVisit({
        leadId: lead.id,
        leadName: lead.fullName,
        leadPhone: lead.phone,
        propertyId: svPropertyId,
        propertyTitle: selectedProp?.title || "Property",
        propertyLocation: selectedProp?.location || "Location",
        assignedAgentId: lead.assignedAgentId,
        agentName: agent?.name || "Consultant",
        visitDate: svDate,
        visitTime: svTime,
        status: "scheduled",
        notes: svNotes || "Client site visit",
      });
      setShowScheduleSV(false);
      setSvNotes("");
    } catch (err: any) {
      setSvError(err.message || "Failed to schedule visit. Scheduling conflict detected.");
    } finally {
      setIsBookingSV(false);
    }
  };

  const handleLinkProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkPropError(null);
    if (!linkPropId) return;
    setIsLinkingProp(true);
    try {
      await associatePropertyToLead(lead.id, linkPropId, linkPropNotes.trim() || undefined);
      setShowLinkPropertyModal(false);
      setLinkPropNotes("");
    } catch (err: any) {
      setLinkPropError(err.message || "Failed to link property.");
    } finally {
      setIsLinkingProp(false);
    }
  };

  const handleQuickShortlist = async (match: MatchedPropertyDisplay) => {
    try {
      await associatePropertyToLead(
        lead.id,
        match.id,
        `${match.matchScore}% Smart Match based on ${lead.propertyTypeInterest} in ${match.society}`
      );
      showToast(`Added '${match.title}' to ${lead.fullName}'s shortlisted properties.`);
    } catch (err: any) {
      showToast(err.message || "Failed to shortlist property", "error");
    }
  };

  const handleOpenPitchPreview = (match: MatchedPropertyDisplay, lang: "en" | "ur" = "en") => {
    setPreviewPitchMatch(match);
    setPitchLanguage(lang);
    setPitchMessageText(lang === "ur" ? match.whatsappPitchTextUrdu : match.whatsappPitchText);
    setIsCopiedPitch(false);
  };

  const handleDirectWhatsAppShare = (match: MatchedPropertyDisplay, customText?: string, lang: "en" | "ur" = "en") => {
    const defaultText = lang === "ur" ? match.whatsappPitchTextUrdu : match.whatsappPitchText;
    const textToSend = customText || defaultText;
    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`;

    // Log activity to lead history
    const langLabel = lang === "ur" ? "Urdu (اردو)" : "English";
    logActivity(lead.id, {
      leadId: lead.id,
      type: "whatsapp",
      title: `Property Pitch (${langLabel}) Dispatched via WhatsApp`,
      description: `Dispatched ${langLabel} pitch for '${match.title}' (${match.society}, ${formatPKR(match.pricePKR)}, ${match.matchScore}% Match) to ${lead.phone}.`,
      performedBy: currentAgent?.name || "Consultant",
    });

    showToast(`WhatsApp ${langLabel} pitch opened for ${lead.fullName}!`);
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setPreviewPitchMatch(null);
  };

  const handleCopyPitchText = () => {
    navigator.clipboard.writeText(pitchMessageText);
    setIsCopiedPitch(true);
    showToast("Pitch copied to clipboard!");
    setTimeout(() => setIsCopiedPitch(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to all leads
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: {lead.id}</span>
      </div>

      {/* Main Profile Header Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Lead Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
                {lead.fullName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityConfig.bg}`}
              >
                {priorityConfig.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Source: {lead.source}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span className="font-mono font-medium">{formatPhoneNumber(lead.phone)}</span>
              {lead.email && <span>• {lead.email}</span>}
              <span>• City: {lead.city}</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <span>
                Created by: <strong className="text-slate-700 dark:text-slate-300">{lead.createdByName || "Intake Lead Form"}</strong>
              </span>
              <span>•</span>
              <span>
                Last updated by: <strong className="text-slate-700 dark:text-slate-300">{lead.updatedByName || lead.createdByName || "System"}</strong>
              </span>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#EE6427]" />
              Call (+92)
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Client
            </a>
            <button
              onClick={() => setShowScheduleFU(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              + Follow-up
            </button>
            <button
              onClick={() => setShowScheduleSV(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              Schedule Visit
            </button>
            <button
              onClick={() => {
                setVirtualTourPropId(properties[0]?.id || "");
                setShowVirtualTourModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer"
              title="Schedule WhatsApp Video Walkthrough with Timezone Conversion"
            >
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              Virtual Tour
            </button>
            {activeDeal ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg opacity-90 cursor-not-allowed select-none"
                  title={`Deal already initiated in ${activeDeal.stage.toUpperCase()} Stage (${formatPKR(Number(activeDeal.deal_value_pkr) || 0)}). Button is locked to prevent duplicate deal creation.`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Deal Locked ({activeDeal.stage === "token" ? "Token Stage" : activeDeal.stage === "bayana" ? "Bayana Stage" : activeDeal.stage === "noc_verification" ? "NOC Stage" : activeDeal.stage === "final_transfer" ? "Transfer Stage" : "Completed"})
                  </span>
                </button>
                <Link
                  href={`/deals?search=${encodeURIComponent(lead.fullName || "")}`}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-[#EE6427] dark:bg-slate-800 dark:hover:bg-[#EE6427] rounded-lg shadow-xs transition-colors"
                  title="View and advance this deal on the Deals & Pipeline page"
                >
                  <span>View in Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setShowDealModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Initiate Pakistani Deal (Token → Bayana → NOC → Transfer)"
              >
                <Handshake className="w-3.5 h-3.5" />
                Lock Deal / Token
              </button>
            )}
          </div>
        </div>

        {/* Stage & Agent Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Current Stage:
            </span>
            <select
              value={lead.status}
              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 cursor-pointer"
            >
              <option value="new">New Enquiry</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="follow_up">Follow-up Due</option>
              <option value="site_visit_scheduled">Site Visit Scheduled</option>
              <option value="negotiation">Under Negotiation</option>
              <option value="won">Deal Closed (Won 🎉)</option>
              <option value="lost">Lost / Dropped</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Assigned Consultant:
            </span>
            {isAgent ? (
              <div
                title="Only Agency Managers and Owners can reassign leads"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {agents.find((ag) => ag.id === lead.assignedAgentId)?.name || currentAgent?.name || "Assigned Consultant"}
                </span>
              </div>
            ) : (
              <select
                value={lead.assignedAgentId}
                onChange={(e) => reassignLead(lead.id, e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 cursor-pointer"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role.split(" ")[0]})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Active Transaction Milestone Banner */}
        {activeDeal && (
          <div className="mt-4 p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-[#EE6427] flex items-center justify-center shrink-0">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Active Transaction: {activeDeal.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-200/70 dark:bg-orange-900/60 text-[#DE5518] dark:text-orange-300">
                    {activeDeal.stage.replace("_", " ")}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  Deal Value: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatPKR(Number(activeDeal.deal_value_pkr) || 0)}</strong>
                  {Number(activeDeal.token_amount_pkr) > 0 && (
                    <> • Token: <span className="font-mono">{formatPKR(Number(activeDeal.token_amount_pkr) || 0)}</span></>
                  )}
                  {Number(activeDeal.bayana_amount_pkr) > 0 && (
                    <> • Bayana: <span className="font-mono">{formatPKR(Number(activeDeal.bayana_amount_pkr) || 0)}</span></>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Generate Urdu/English Bayana Iqrarnama, Token Receipt, and FBR Tax Slip"
              >
                <Scale className="w-3.5 h-3.5 text-[#EE6427]" />
                <span>Legal Papers</span>
              </button>
              <Link
                href={`/deals?search=${encodeURIComponent(lead.fullName || "")}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                <span>Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Details & Interactive Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requirements & Property Recommendations */}
        <div className="space-y-6">
          {/* Requirements Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building className="w-4 h-4 text-[#EE6427]" />
              Buyer Requirements
            </h3>

            <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-1 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Budget Range</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {formatPKR(lead.budgetPKR)}
                </span>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Property Type</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {lead.propertyTypeInterest}
                </span>
              </div>

              <div className="pt-2.5 flex items-start justify-between">
                <span className="text-slate-500 dark:text-slate-400">Target Societies</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[180px]">
                  {Array.isArray(lead.preferredLocations)
                    ? lead.preferredLocations.join(", ")
                    : lead.preferredLocations}
                </span>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Purpose</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.purpose}</span>
              </div>

              <div className="pt-2.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Registration Date</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Associated Properties / Shortlisted Inventory */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-[#EE6427]" />
                  Shortlisted Properties
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lead.associatedProperties?.length || 0} inventory units linked to this buyer
                </p>
              </div>
              <button
                onClick={() => setShowLinkPropertyModal(true)}
                className="text-xs text-[#EE6427] hover:text-[#DE5518] font-semibold flex items-center gap-1 cursor-pointer"
              >
                + Link Property
              </button>
            </div>

            {!lead.associatedProperties || lead.associatedProperties.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">No properties linked yet.</p>
                <button
                  type="button"
                  onClick={() => setShowLinkPropertyModal(true)}
                  className="mt-2 text-xs font-semibold text-[#EE6427] hover:underline inline-block cursor-pointer"
                >
                  + Link from Inventory
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lead.associatedProperties.map((ap) => (
                  <div
                    key={ap.id || ap.propertyId}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800/80 hover:border-orange-300 dark:hover:border-orange-700 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {ap.propertyTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {ap.propertyLocation}, {ap.propertySociety}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePropertyFromLead(lead.id, ap.propertyId)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer"
                        title="Unlink property"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-750">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatPKR(ap.propertyPricePKR)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSvPropertyId(ap.propertyId);
                          setShowScheduleSV(true);
                        }}
                        className="text-[10px] font-semibold text-[#EE6427] hover:underline cursor-pointer"
                      >
                        Schedule Tour →
                      </button>
                    </div>

                    {ap.notes && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-850 p-1.5 rounded-md border border-slate-100 dark:border-slate-700 italic">
                        &ldquo;{ap.notes}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Smart Match Sidebar Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Top Inventory Matches
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {allMatchedProperties.length} units match buyer criteria
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("matches")}
                className="text-xs text-[#EE6427] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                View all ({allMatchedProperties.length})
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {allMatchedProperties.slice(0, 3).map((match) => (
                <div
                  key={match.id}
                  onClick={() => setActiveTab("matches")}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-500 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427] truncate">
                      {match.title}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                        match.matchScore >= 85
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : match.matchScore >= 65
                          ? "bg-orange-100 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 border border-orange-200 dark:border-orange-900/60"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {match.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {match.society} • {match.areaSize}
                  </p>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatPKR(match.pricePKR)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {match.budgetFit === "below_budget"
                        ? "Under budget"
                        : match.budgetFit === "exact"
                        ? "Exact fit"
                        : "Within band"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Interactive Tabs (Matched Inventory, Notes, Activity, Follow-ups) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Navigation Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-1.5 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "matches"
                  ? "bg-[#EE6427] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Matched Inventory</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "matches" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                }`}
              >
                {allMatchedProperties.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "notes"
                  ? "bg-[#EE6427] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Consultant Notes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "notes" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {leadNotes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("followups")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "followups"
                  ? "bg-[#EE6427] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Follow-ups & Visits</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "followups" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {leadFollowUps.length + leadSiteVisits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "timeline"
                  ? "bg-[#EE6427] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Activity History</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "timeline" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {leadActivities.length}
              </span>
            </button>
          </div>

          {/* TAB 1: SMART MATCHED INVENTORY */}
          {activeTab === "matches" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Filter and Overview Banner */}
              <div className="p-4 bg-orange-50/70 dark:bg-slate-800 rounded-xl border border-orange-200/60 dark:border-orange-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Live Buyer Requirement Matching
                    </span>
                    <span className="text-[10px] font-semibold bg-orange-100 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/60">
                      Auto-Ranked
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Calculated using society location, {formatPKR(lead.budgetPKR)} budget envelope, and {lead.propertyTypeInterest} specs.
                  </p>
                </div>

                {/* Score Filter Pills */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score:</span>
                  <button
                    onClick={() => setMinScoreFilter(0)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      minScoreFilter === 0
                        ? "bg-slate-900 dark:bg-slate-700 text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    All ({allMatchedProperties.length})
                  </button>
                  <button
                    onClick={() => setMinScoreFilter(85)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      minScoreFilter === 85
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>🔥 85%+</span>
                  </button>
                  <button
                    onClick={() => setMinScoreFilter(65)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                      minScoreFilter === 65
                        ? "bg-[#EE6427] text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>65%+</span>
                  </button>
                </div>
              </div>

              {/* Matched Property Cards List */}
              {filteredMatches.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Building className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Inventory Meets Filter Criteria</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Try clearing the score filter or expanding {lead.fullName}&apos;s preferred societies to view broader matches.
                  </p>
                  <button
                    onClick={() => setMinScoreFilter(0)}
                    className="px-4 py-1.5 text-xs font-semibold text-[#EE6427] bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors cursor-pointer"
                  >
                    Reset Score Filter
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMatches.map((match) => {
                    const shortlisted = isPropertyShortlisted(match.id);
                    return (
                      <div
                        key={match.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-orange-400 dark:hover:border-orange-500 transition-all overflow-hidden"
                      >
                        <div className="p-5 flex flex-col md:flex-row gap-5">
                          {/* Property Thumbnail with Badges */}
                          <div className="relative md:w-56 h-40 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={match.imageUrl}
                              alt={match.title}
                              className="w-full h-full object-cover"
                            />
                            {/* Match Score Badge */}
                            <div className="absolute top-2 left-2">
                              <span
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-md ${
                                  match.matchScore >= 85
                                    ? "bg-emerald-600 text-white ring-2 ring-white"
                                    : match.matchScore >= 65
                                    ? "bg-[#EE6427] text-white ring-2 ring-white"
                                    : "bg-amber-600 text-white ring-2 ring-white"
                                }`}
                              >
                                {match.matchScore >= 85 && <Sparkles className="w-3.5 h-3.5" />}
                                {match.matchScore}% Match
                              </span>
                            </div>

                            {/* Property Type Pill */}
                            <div className="absolute bottom-2 left-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                                {match.type}
                              </span>
                            </div>
                          </div>

                          {/* Property Details & Reasons */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-[#EE6427] transition-colors">
                                  {match.title}
                                </h4>
                                <span className="text-base sm:text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                  {formatPKR(match.pricePKR)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {match.location}, {match.society} • {match.city}
                              </p>
                            </div>

                            {/* Key Specs Pill Row */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                📐 {match.areaSize}
                              </span>
                              {match.bedrooms && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                  🛏 {match.bedrooms} Beds
                                </span>
                              )}
                              {match.bathrooms && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                  🚿 {match.bathrooms} Baths
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                  match.budgetFit === "below_budget"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                                    : match.budgetFit === "exact"
                                    ? "bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-200 border border-orange-200 dark:border-orange-900/60"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                                }`}
                              >
                                {match.budgetDeltaPKR < 0
                                  ? `${formatPKR(Math.abs(match.budgetDeltaPKR))} below max budget`
                                  : match.budgetDeltaPKR === 0
                                  ? "Exact budget fit"
                                  : `${formatPKR(match.budgetDeltaPKR)} above initial budget`}
                              </span>
                            </div>

                            {/* Why this matched: Transparent Reasons */}
                            <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Match Analysis:
                              </span>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {match.reasons.map((r, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700"
                                  >
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Action Bar */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* English WhatsApp Share */}
                                <button
                                  type="button"
                                  onClick={() => handleDirectWhatsAppShare(match, undefined, "en")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                                  title="Send English WhatsApp Pitch"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp (EN)</span>
                                </button>

                                {/* Urdu WhatsApp Share */}
                                <button
                                  type="button"
                                  onClick={() => handleDirectWhatsAppShare(match, undefined, "ur")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                                  title="Send Roman Urdu WhatsApp Pitch (اردو)"
                                >
                                  <span className="text-xs">🇵🇰</span>
                                  <span>WhatsApp (اردو)</span>
                                </button>

                                {/* Preview / Customize Pitch */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPitchPreview(match, "en")}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Preview and customize English or Urdu pitch"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Preview Pitch
                                </button>

                                {/* Tax & Transfer Calculator Link */}
                                <Link
                                  href={`/tax-calculator?price=${match.pricePKR}&society=${encodeURIComponent(match.society)}&size=${encodeURIComponent(match.areaSize)}&type=${encodeURIComponent(match.type)}&title=${encodeURIComponent(match.title)}`}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer"
                                  title="Calculate FBR Section 236C/K & Society Transfer Fees for this property"
                                >
                                  <Calculator className="w-3.5 h-3.5" />
                                  <span>Taxes</span>
                                </Link>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Shortlist for Buyer Button */}
                                {shortlisted ? (
                                  <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    Shortlisted
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickShortlist(match)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <BookmarkPlus className="w-3.5 h-3.5 text-[#EE6427]" />
                                    Shortlist
                                  </button>
                                )}

                                {/* Schedule Tour Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSvPropertyId(match.id);
                                    setShowScheduleSV(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#DE5518] dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-900/60 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                  Book Tour
                                </button>

                                {/* Virtual Video Tour */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVirtualTourPropId(match.id);
                                    setShowVirtualTourModal(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors cursor-pointer"
                                  title="Virtual Video Walkthrough with Timezone Conversion"
                                >
                                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                                  Virtual Tour
                                </button>

                                {/* Overseas Client Share Dossier */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const propObj = properties.find((p) => p.id === match.id);
                                    if (propObj) {
                                      setShareOverseasProp(propObj);
                                      setShowOverseasShareModal(true);
                                    }
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Generate Tokenized Overseas Client Dossier"
                                >
                                  <Globe className="w-3.5 h-3.5 text-[#EE6427]" />
                                  Overseas Link
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONSULTANT NOTES */}
          {activeTab === "notes" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-between">
                <span>Consultant Notes & Conversation Logs</span>
                <span className="text-xs font-mono text-slate-400 font-normal">
                  {leadNotes.length} notes recorded
                </span>
              </h3>

              {/* Note Input */}
              <form onSubmit={handleAddNote} className="space-y-2.5">
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Log client note (e.g. Spoke on phone, client requested floor plan for DHA villa, will visit on Saturday...)"
                  className="w-full p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Logging as <strong className="text-slate-700 dark:text-slate-300">{agentName}</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-2xs disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    Save Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {leadNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No internal notes recorded yet. Add your first note above.
                  </p>
                ) : (
                  leadNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{note.author}</span>
                        <span className="text-slate-400 font-mono">{formatDateTime(note.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY HISTORY */}
          {activeTab === "timeline" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Activity & Pipeline Timeline
              </h3>

              <div className="space-y-3">
                {leadActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No pipeline activities recorded yet.
                  </p>
                ) : (
                  leadActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#EE6427] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(act.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">{act.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">By {act.performedBy}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FOLLOW-UPS & VISITS */}
          {activeTab === "followups" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
              {/* Follow-ups */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Scheduled Follow-ups
                  </h4>
                  <button
                    onClick={() => setShowScheduleFU(true)}
                    className="text-xs text-[#EE6427] hover:underline font-semibold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {leadFollowUps.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No tasks scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {leadFollowUps.map((fu) => (
                      <div
                        key={fu.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                          fu.completed ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={fu.completed}
                          onChange={() => toggleFollowUp(fu.id)}
                          className="mt-0.5 rounded text-[#EE6427] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold ${fu.completed ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
                              {fu.scheduledDate} • {fu.scheduledTime} ({fu.type})
                            </p>
                            {fu.completed && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold">
                                Done
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{fu.notes}</p>
                          {fu.completed && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
                              Completed {fu.completedByName ? `by ${fu.completedByName}` : ""}{" "}
                              {fu.completedAt ? `on ${formatDate(fu.completedAt)}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Site Visits */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Site Tours
                  </h4>
                  <button
                    onClick={() => setShowScheduleSV(true)}
                    className="text-xs text-[#EE6427] hover:underline font-semibold cursor-pointer"
                  >
                    + Book
                  </button>
                </div>

                {leadSiteVisits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No tours arranged</p>
                ) : (
                  <div className="space-y-2">
                    {leadSiteVisits.map((sv) => (
                      <div
                        key={sv.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-purple-700 dark:text-purple-400">
                            {sv.visitDate} • {sv.visitTime}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                            {sv.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 font-medium truncate">
                          {sv.propertyTitle}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Pitch Preview & Customize Modal */}
      {previewPitchMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp Property Pitch Preview</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Recipient: {lead.fullName} ({formatPhoneNumber(lead.phone)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewPitchMatch(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Property Summary Pill */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{previewPitchMatch.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{previewPitchMatch.society} • {previewPitchMatch.areaSize}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatPKR(previewPitchMatch.pricePKR)}</p>
                <span className="text-[10px] font-bold text-[#EE6427]">{previewPitchMatch.matchScore}% Match</span>
              </div>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setPitchLanguage("en");
                  setPitchMessageText(previewPitchMatch.whatsappPitchText);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pitchLanguage === "en"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>🇬🇧</span>
                <span>English Pitch</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPitchLanguage("ur");
                  setPitchMessageText(previewPitchMatch.whatsappPitchTextUrdu || previewPitchMatch.whatsappPitchText);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pitchLanguage === "ur"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>🇵🇰</span>
                <span>Urdu Pitch (اردو / Roman Urdu)</span>
              </button>
            </div>

            {/* Pitch Text Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {pitchLanguage === "ur" ? "Urdu Pitch Message (Roman Urdu & Urdu)" : "English Pitch Message"}
                </label>
                <span className="text-[11px] text-slate-400">
                  {pitchLanguage === "ur" ? "🇵🇰 Roman Urdu Format" : "🇬🇧 English Format"}
                </span>
              </div>
              <textarea
                rows={9}
                value={pitchMessageText}
                onChange={(e) => setPitchMessageText(e.target.value)}
                className="w-full p-3 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                You can customize this message before dispatching or copying.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCopyPitchText}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                {isCopiedPitch ? "Copied!" : "Copy Text"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPitchMatch(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectWhatsAppShare(previewPitchMatch, pitchMessageText, pitchLanguage)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {pitchLanguage === "ur" ? "Open WhatsApp & Send (Urdu)" : "Open WhatsApp & Send (English)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showScheduleFU && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Follow-up</h3>
            <form onSubmit={handleScheduleFollowUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={fuTime}
                    onChange={(e) => setFuTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Interaction Medium</label>
                <select
                  value={fuType}
                  onChange={(e) => setFuType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp Message">WhatsApp Message</option>
                  <option value="In-Person Meeting">In-Person Office Meeting</option>
                  <option value="Documentation">Documentation / Transfer Prep</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Objectives</label>
                <textarea
                  rows={2}
                  required
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  placeholder="e.g. Call regarding DHA Sector B villa counter-offer..."
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleFU(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-xs cursor-pointer"
                >
                  Schedule Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Site Visit Modal */}
      {showScheduleSV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Property Site Tour</h3>

            {svError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{svError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSiteVisit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Property</label>
                <select
                  value={svPropertyId}
                  onChange={(e) => setSvPropertyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.society}) - {formatPKR(p.pricePKR)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={svDate}
                    onChange={(e) => setSvDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={svTime}
                    onChange={(e) => setSvTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Instructions</label>
                <textarea
                  rows={2}
                  value={svNotes}
                  onChange={(e) => setSvNotes(e.target.value)}
                  placeholder="e.g. Guard key arranged, meeting client at Sector J gate..."
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleSV(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingSV}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isBookingSV && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isBookingSV ? "Booking..." : "Book Site Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Property Modal */}
      {showLinkPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Shortlist Property for Lead</h3>
              <button
                onClick={() => setShowLinkPropertyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Attach matching property from your agency inventory to {lead.fullName}&apos;s file.
            </p>

            {linkPropError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{linkPropError}</span>
              </div>
            )}

            <form onSubmit={handleLinkProperty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Property</label>
                <select
                  value={linkPropId}
                  onChange={(e) => setLinkPropId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.society}) - {formatPKR(p.pricePKR)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Buyer Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={linkPropNotes}
                  onChange={(e) => setLinkPropNotes(e.target.value)}
                  placeholder="e.g. Client liked corner orientation and 5 bedroom layout"
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkPropertyModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinkingProp}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isLinkingProp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isLinkingProp ? "Linking..." : "Attach Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Tour Modal */}
      {showVirtualTourModal && (
        <VirtualTourModal
          lead={lead}
          properties={properties}
          preSelectedPropertyId={virtualTourPropId}
          isOpen={showVirtualTourModal}
          onClose={() => setShowVirtualTourModal(false)}
        />
      )}

      {/* Overseas Share Modal */}
      {showOverseasShareModal && shareOverseasProp && (
        <ShareOverseasModal
          property={shareOverseasProp}
          lead={lead}
          isOpen={showOverseasShareModal}
          onClose={() => {
            setShowOverseasShareModal(false);
            setShareOverseasProp(null);
          }}
        />
      )}

      {/* Pakistani Deal Modal */}
      {showDealModal && (
        <DealModal
          isOpen={showDealModal}
          onClose={() => setShowDealModal(false)}
          onSaved={(saved) => {
            setActiveDeal(saved);
            showToast("Deal Milestone initiated successfully!", "success");
            router.push("/deals");
          }}
          defaultLeadId={lead.id}
          defaultPropertyId={properties[0]?.id}
        />
      )}

      {/* 1-Click Pakistani Legal Document Suite (Bayana Iqrarnama, Token Receipt, FBR Slip) */}
      <LegalDocumentsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        deal={activeDeal}
      />
    </div>
  );
}
