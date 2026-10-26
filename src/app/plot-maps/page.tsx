"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Map,
  Plus,
  Grid,
  List,
  Search,
  Sparkles,
  Building2,
  Handshake,
  Scale,
  Maximize2,
  Phone,
  MessageCircle,
  ShieldCheck,
  Check,
  Compass,
} from "lucide-react";
import { SocietyPlot, PlotStatus } from "@/types/plot";
import { INITIAL_SOCIETY_PLOTS, SOCIETIES_CATALOG } from "@/data/societyPlotData";
import { SocietySectorMap } from "@/components/plots/SocietySectorMap";
import { PlotDetailDrawer } from "@/components/plots/PlotDetailDrawer";
import { AddPlotModal } from "@/components/plots/AddPlotModal";
import { DealModal } from "@/components/deals/DealModal";
import LegalDocumentsModal from "@/components/deals/LegalDocumentsModal";
import { formatPKR } from "@/lib/formatters";
import { useCRM } from "@/context/CRMContext";
import { BackendDeal } from "@/lib/api";

export default function PlotMapsPage() {
  return (
    <AppShell>
      <PlotMapsContent />
    </AppShell>
  );
}

function PlotMapsContent() {
  const { showToast } = useCRM();

  // Plot state
  const [plots, setPlots] = useState<SocietyPlot[]>(INITIAL_SOCIETY_PLOTS);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>("dha_phase_2");
  const [selectedSectorName, setSelectedSectorName] = useState<string>("Sector A");
  const [selectedPlot, setSelectedPlot] = useState<SocietyPlot | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // View Mode: visual blueprint map vs spreadsheet table
  const [viewMode, setViewMode] = useState<"map" | "table">("map");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [activeDealForLegal, setActiveDealForLegal] = useState<BackendDeal | null>(null);

  // Status update handler
  const handleUpdateStatus = (plotId: string, newStatus: PlotStatus) => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === plotId) {
          return { ...p, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    if (selectedPlot?.id === plotId) {
      setSelectedPlot((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    showToast(`Plot status updated to ${newStatus.replace("_", " ")}!`, "success");
  };

  // Add plot handler
  const handleAddPlot = (newPlot: SocietyPlot) => {
    setPlots((prev) => [newPlot, ...prev]);
    setSelectedPlot(newPlot);
    setIsDrawerOpen(true);
    showToast(`Plot ${newPlot.plotNumber} added to inventory successfully!`, "success");
  };

  // Initiate deal from plot
  const handleInitiateDeal = (plot: SocietyPlot) => {
    setIsDealModalOpen(true);
  };

  // Open Legal Documents from plot
  const handleOpenLegalDocs = (plot: SocietyPlot) => {
    const syntheticDeal: BackendDeal = {
      id: `plot-deal-${plot.id}`,
      agency_id: "agency-1",
      lead_id: "lead-101",
      property_id: undefined,
      agent_id: "agent-1",
      title: `${plot.societyName} - ${plot.sector} (${plot.plotNumber}) Deal`,
      stage: "bayana",
      deal_value_pkr: plot.demandPricePKR,
      token_amount_pkr: plot.minimumTokenPKR,
      token_date: new Date().toISOString().split("T")[0],
      token_type: "pakka_token",
      bayana_amount_pkr: Math.round(plot.demandPricePKR * 0.2),
      bayana_date: new Date().toISOString().split("T")[0],
      iqrarnama_number: `IQR-${plot.plotNumber.replace(/[^a-zA-Z0-9]/g, "")}-${new Date().getFullYear()}`,
      noc_authority: plot.societyName,
      ndc_cleared: plot.ndcStatus === "Cleared",
      commission_side: "both_sides_2pct",
      commission_percentage: 2,
      commission_pkr: Math.round(plot.demandPricePKR * 0.02),
      agency_split_percentage: 50,
      agent_split_percentage: 50,
      agency_commission_pkr: Math.round(plot.demandPricePKR * 0.01),
      agent_commission_pkr: Math.round(plot.demandPricePKR * 0.01),
      settlement_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lead_name: "Buyer Client",
      lead_phone: "+92 300 0000000",
      property_title: `${plot.size} ${plot.plotNumber}, ${plot.street}, ${plot.sector}, ${plot.societyName}`,
    };

    setActiveDealForLegal(syntheticDeal);
    setIsLegalModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EE6427]/10 text-[#EE6427] border border-[#EE6427]/20 uppercase font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EE6427] animate-pulse" />
              Pakistani Real Estate Inventory
            </span>
            <span className="text-xs text-slate-400">
              DHA • Bahria Town • CDA • Gulberg
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-[#EE6427]" />
            <span>Society Plot Maps & Sector Grid</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive master blueprint maps, corner/park premium categorization, and 1-click deal initiation
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-[#EE6427]" />
              <span>Blueprint Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table Inventory</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plot</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW: MAP OR TABLE */}
      {viewMode === "map" ? (
        <SocietySectorMap
          plots={plots}
          selectedPlot={selectedPlot}
          onSelectPlot={(p) => {
            setSelectedPlot(p);
            setIsDrawerOpen(true);
          }}
          selectedSocietyId={selectedSocietyId}
          onSelectSocietyId={setSelectedSocietyId}
          selectedSectorId={selectedSectorName}
          onSelectSectorId={setSelectedSectorName}
        />
      ) : (
        /* TABLE INVENTORY SPREADSHEET VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Plot #</th>
                  <th className="p-3.5">Society & Sector</th>
                  <th className="p-3.5">Street</th>
                  <th className="p-3.5">Size & Dimensions</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Asking Demand</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Owner / Contact</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {plots.map((plot) => (
                  <tr
                    key={plot.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPlot(plot);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      {plot.plotNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {plot.societyName}
                      </div>
                      <div className="text-[11px] text-slate-500">{plot.sector}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {plot.street}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {plot.size}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {plot.dimensions}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        {plot.isCorner && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Corner
                          </span>
                        )}
                        {plot.isParkFacing && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Park
                          </span>
                        )}
                        {plot.isBoulevard && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            Blvd
                          </span>
                        )}
                        {!plot.isCorner && !plot.isParkFacing && !plot.isBoulevard && (
                          <span className="text-slate-400">General</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatPKR(plot.demandPricePKR)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider capitalize ${
                          plot.status === "available"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : plot.status === "token_paid"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : plot.status === "bayana_done"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {plot.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {plot.ownerName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {plot.ownerPhone}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlot(plot);
                          setIsDrawerOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLOT DETAIL INSPECTOR DRAWER */}
      <PlotDetailDrawer
        plot={selectedPlot}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onInitiateDeal={(p) => {
          handleInitiateDeal(p);
        }}
        onOpenLegalDocs={(p) => {
          handleOpenLegalDocs(p);
        }}
      />

      {/* ADD PLOT MODAL */}
      <AddPlotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlot={handleAddPlot}
        defaultSocietyId={selectedSocietyId}
        defaultSectorName={selectedSectorName}
      />

      {/* INITIATE DEAL MODAL */}
      {isDealModalOpen && (
        <DealModal
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          onSaved={(saved) => {
            showToast("Deal created from plot successfully!", "success");
            setIsDealModalOpen(false);
          }}
        />
      )}

      {/* 1-CLICK LEGAL SUITE & IQRARNAMA */}
      <LegalDocumentsModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        deal={activeDealForLegal}
      />
    </div>
  );
}
