"use client";

import React, { useState, useMemo } from "react";
import {
  Map,
  Compass,
  Filter,
  Search,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building,
  Check,
  ChevronRight,
  Maximize2,
  Phone,
  MessageCircle,
} from "lucide-react";
import { SocietyPlot, PlotStatus, PlotCategory } from "@/types/plot";
import { SOCIETIES_CATALOG } from "@/data/societyPlotData";
import { formatPKR } from "@/lib/formatters";
import { pkrToUrduWords } from "@/lib/pkrWords";

interface SocietySectorMapProps {
  plots: SocietyPlot[];
  selectedPlot: SocietyPlot | null;
  onSelectPlot: (plot: SocietyPlot) => void;
  selectedSocietyId: string;
  onSelectSocietyId: (id: string) => void;
  selectedSectorId: string;
  onSelectSectorId: (sectorName: string) => void;
}

export function SocietySectorMap({
  plots,
  selectedPlot,
  onSelectPlot,
  selectedSocietyId,
  onSelectSocietyId,
  selectedSectorId,
  onSelectSectorId,
}: SocietySectorMapProps) {
  // Zoom level state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const currentSociety = useMemo(() => {
    return SOCIETIES_CATALOG.find((s) => s.id === selectedSocietyId) || SOCIETIES_CATALOG[0];
  }, [selectedSocietyId]);

  const activeSector = useMemo(() => {
    return (
      currentSociety.sectors.find((s) => s.name === selectedSectorId) ||
      currentSociety.sectors[0]
    );
  }, [currentSociety, selectedSectorId]);

  // Filter plots for active society and sector
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      if (plot.societyId !== selectedSocietyId) return false;
      if (plot.sector !== activeSector.name) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchesPlot = plot.plotNumber.toLowerCase().includes(q);
        const matchesStreet = plot.street.toLowerCase().includes(q);
        const matchesOwner = plot.ownerName.toLowerCase().includes(q);
        if (!matchesPlot && !matchesStreet && !matchesOwner) return false;
      }

      if (selectedStatus !== "all" && plot.status !== selectedStatus) return false;
      if (selectedSize !== "all" && !plot.size.toLowerCase().includes(selectedSize.toLowerCase())) return false;

      if (selectedCategory === "corner" && !plot.isCorner) return false;
      if (selectedCategory === "park" && !plot.isParkFacing) return false;
      if (selectedCategory === "boulevard" && !plot.isBoulevard) return false;

      return true;
    });
  }, [plots, selectedSocietyId, activeSector.name, search, selectedStatus, selectedSize, selectedCategory]);

  // Metrics for active sector
  const sectorMetrics = useMemo(() => {
    const sectorAllPlots = plots.filter(
      (p) => p.societyId === selectedSocietyId && p.sector === activeSector.name
    );
    const total = sectorAllPlots.length;
    const available = sectorAllPlots.filter((p) => p.status === "available").length;
    const token = sectorAllPlots.filter((p) => p.status === "token_paid").length;
    const bayana = sectorAllPlots.filter((p) => p.status === "bayana_done").length;
    const sold = sectorAllPlots.filter((p) => p.status === "sold").length;
    const totalValue = sectorAllPlots.reduce((sum, p) => sum + p.demandPricePKR, 0);

    return { total, available, token, bayana, sold, totalValue };
  }, [plots, selectedSocietyId, activeSector.name]);

  // Group filtered plots by street
  const plotsByStreet = useMemo(() => {
    const groups: Record<string, SocietyPlot[]> = {};
    filteredPlots.forEach((p) => {
      if (!groups[p.street]) {
        groups[p.street] = [];
      }
      groups[p.street].push(p);
    });
    return groups;
  }, [filteredPlots]);

  const getStatusColorClasses = (status: PlotStatus, isSelected: boolean) => {
    if (isSelected) {
      return "ring-4 ring-[#EE6427] ring-offset-2 scale-[1.03] shadow-lg z-20";
    }

    switch (status) {
      case "available":
        return "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 hover:border-emerald-500 hover:bg-emerald-100/80";
      case "token_paid":
        return "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 hover:border-amber-500 hover:bg-amber-100/80";
      case "bayana_done":
        return "border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 hover:border-purple-500 hover:bg-purple-100/80";
      case "sold":
        return "border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 opacity-80 hover:opacity-100";
      case "hold":
        return "border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 hover:border-blue-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP SOCIETY & SECTOR NAVIGATION TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
        {/* Society Selector Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Master Society:
            </span>
            {SOCIETIES_CATALOG.map((soc) => (
              <button
                key={soc.id}
                type="button"
                onClick={() => {
                  onSelectSocietyId(soc.id);
                  onSelectSectorId(soc.sectors[0].name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSocietyId === soc.id
                    ? "bg-[#EE6427] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {soc.name} ({soc.city})
              </button>
            ))}
          </div>

          {/* Zoom & Canvas Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.45))}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-slate-600 dark:text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Sector / Block:
          </span>
          {currentSociety.sectors.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSectorId(sec.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeSector.name === sec.name
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>{sec.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({sec.defaultSize})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. SECTOR METRICS & AMENITIES RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sector Inventory
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {sectorMetrics.total}
            </span>
            <span className="text-xs text-slate-500">Plots Listed</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Available For Sale
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-200">
              {sectorMetrics.available}
            </span>
            <span className="text-xs text-emerald-600">Active</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            Token Advance Locked
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black font-mono text-amber-800 dark:text-amber-200">
              {sectorMetrics.token}
            </span>
            <span className="text-xs text-amber-600">Under Token</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
            Bayana Executed
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black font-mono text-purple-800 dark:text-purple-200">
              {sectorMetrics.bayana}
            </span>
            <span className="text-xs text-purple-600">Awaiting Transfer</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sector Total Value
          </span>
          <div className="mt-0.5">
            <span className="text-base font-black font-mono text-[#EE6427] block truncate">
              {formatPKR(sectorMetrics.totalValue)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Plot #, Street, or Owner..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs focus:ring-1 focus:ring-[#EE6427]"
          >
            <option value="all">All Statuses</option>
            <option value="available">🟢 Available for Sale</option>
            <option value="token_paid">🟠 Token Paid</option>
            <option value="bayana_done">🟣 Bayana Done</option>
            <option value="sold">🔴 Transferred / Sold</option>
            <option value="hold">🔵 On Hold</option>
          </select>

          {/* Size */}
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs focus:ring-1 focus:ring-[#EE6427]"
          >
            <option value="all">All Sizes</option>
            <option value="5 Marla">5 Marla</option>
            <option value="10 Marla">10 Marla</option>
            <option value="1 Kanal">1 Kanal</option>
            <option value="2 Kanal">2 Kanal</option>
            <option value="Commercial">Commercial</option>
          </select>

          {/* Categories */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs focus:ring-1 focus:ring-[#EE6427]"
          >
            <option value="all">All Categories</option>
            <option value="corner">🌟 Corner Only</option>
            <option value="park">🌳 Park Facing Only</option>
            <option value="boulevard">🛣️ Boulevard Only</option>
          </select>
        </div>
      </div>

      {/* 4. INTERACTIVE SECTOR GRID CANVAS */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl overflow-x-auto min-h-[500px] relative">
        {/* Blueprint Grid Watermark Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EE6427] animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {currentSociety.name} • {activeSector.name} Blueprint Map
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({activeSector.boulevard})
            </span>
          </div>

          {/* Legend */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Token Paid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              Bayana Done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              Sold
            </span>
          </div>
        </div>

        {/* Dynamic Zoom Wrapper */}
        <div
          className="transition-transform duration-200 origin-top-left space-y-8"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {Object.keys(plotsByStreet).length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm space-y-2">
              <p className="font-bold text-slate-300">No plots match the selected filters.</p>
              <p className="text-xs text-slate-500">Try adjusting your status or category filters above.</p>
            </div>
          ) : (
            Object.entries(plotsByStreet).map(([streetName, streetPlots]) => (
              <div key={streetName} className="space-y-3">
                {/* Street Label Divider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    🛣️ {streetName}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {streetPlots.length} Plots
                  </span>
                </div>

                {/* Plot Cards Grid for Street */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {streetPlots.map((plot) => {
                    const isSelected = selectedPlot?.id === plot.id;
                    return (
                      <div
                        key={plot.id}
                        onClick={() => onSelectPlot(plot)}
                        className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-150 flex flex-col justify-between select-none shadow-sm ${getStatusColorClasses(
                          plot.status,
                          isSelected
                        )}`}
                      >
                        {/* Corner Ribbon / Badges */}
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-black font-mono">
                              {plot.plotNumber}
                            </span>
                            <span className="text-[11px] font-semibold opacity-75 font-sans">
                              ({plot.size})
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {plot.isCorner && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-amber-950 uppercase"
                                title="Corner Plot (+10% Premium)"
                              >
                                Corner
                              </span>
                            )}
                            {plot.isParkFacing && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white uppercase"
                                title="Park Facing (+10% Premium)"
                              >
                                Park
                              </span>
                            )}
                            {plot.isBoulevard && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white uppercase"
                                title="Main Boulevard"
                              >
                                Blvd
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dimensions & Road Info */}
                        <div className="text-[11px] opacity-80 mb-3 space-y-0.5">
                          <div>Dimensions: <span className="font-mono font-bold">{plot.dimensions}</span></div>
                          <div>Road: <span className="font-mono">{plot.roadWidthFt}ft Carpeted</span></div>
                        </div>

                        {/* Price & Action Footer */}
                        <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                          <div className="font-mono font-black text-sm">
                            {formatPKR(plot.demandPricePKR)}
                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                            {plot.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
