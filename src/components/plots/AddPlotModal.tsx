"use client";

import React, { useState } from "react";
import { X, Plus, Sparkles, Building, MapPin } from "lucide-react";
import { SocietyPlot, PlotStatus, PlotCategory, PossessionType, AllotmentType } from "@/types/plot";
import { SOCIETIES_CATALOG } from "@/data/societyPlotData";

interface AddPlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlot: (newPlot: SocietyPlot) => void;
  defaultSocietyId: string;
  defaultSectorName: string;
}

export function AddPlotModal({
  isOpen,
  onClose,
  onAddPlot,
  defaultSocietyId,
  defaultSectorName,
}: AddPlotModalProps) {
  const [societyId, setSocietyId] = useState(defaultSocietyId || "dha_phase_2");
  const [sectorName, setSectorName] = useState(defaultSectorName || "Sector A");
  const [plotNumber, setPlotNumber] = useState("");
  const [street, setStreet] = useState("Street 4");
  const [size, setSize] = useState<SocietyPlot["size"]>("1 Kanal");
  const [dimensions, setDimensions] = useState("50' x 90'");
  const [demandPricePKR, setDemandPricePKR] = useState(50_000_000);
  const [minimumTokenPKR, setMinimumTokenPKR] = useState(1_000_000);
  const [isCorner, setIsCorner] = useState(false);
  const [isParkFacing, setIsParkFacing] = useState(false);
  const [isBoulevard, setIsBoulevard] = useState(false);
  const [roadWidthFt, setRoadWidthFt] = useState(50);
  const [possession, setPossession] = useState<PossessionType>("possession_ready");
  const [allotmentType, setAllotmentType] = useState<AllotmentType>("Allotment Letter");
  const [ndcStatus, setNdcStatus] = useState<"Cleared" | "Pending" | "Not Required">("Cleared");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerCnic, setOwnerCnic] = useState("");
  const [notes, setNotes] = useState("");

  const currentSoc = SOCIETIES_CATALOG.find((s) => s.id === societyId) || SOCIETIES_CATALOG[0];

  const handleSizeChange = (newSize: SocietyPlot["size"]) => {
    setSize(newSize);
    if (newSize === "5 Marla") {
      setDimensions("25' x 50'");
      setDemandPricePKR(11_000_000);
      setMinimumTokenPKR(300_000);
    } else if (newSize === "10 Marla") {
      setDimensions("35' x 70'");
      setDemandPricePKR(28_000_000);
      setMinimumTokenPKR(500_000);
    } else if (newSize === "1 Kanal") {
      setDimensions("50' x 90'");
      setDemandPricePKR(55_000_000);
      setMinimumTokenPKR(1_000_000);
    } else if (newSize === "2 Kanal") {
      setDimensions("100' x 180'");
      setDemandPricePKR(115_000_000);
      setMinimumTokenPKR(2_500_000);
    } else if (newSize === "4 Marla Commercial") {
      setDimensions("30' x 60'");
      setDemandPricePKR(95_000_000);
      setMinimumTokenPKR(2_500_000);
    } else if (newSize === "8 Marla Commercial") {
      setDimensions("40' x 90'");
      setDemandPricePKR(185_000_000);
      setMinimumTokenPKR(5_000_000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let category: PlotCategory = "standard";
    if (size.includes("Commercial")) category = "commercial";
    else if (isCorner && isParkFacing) category = "corner_park";
    else if (isCorner && isBoulevard) category = "corner_boulevard";
    else if (isCorner) category = "corner";
    else if (isParkFacing) category = "park_facing";
    else if (isBoulevard) category = "boulevard";

    const newPlot: SocietyPlot = {
      id: `plot-${Date.now()}`,
      plotNumber: plotNumber.trim() || `Plot ${Math.floor(100 + Math.random() * 900)}`,
      societyId,
      societyName: currentSoc.name,
      sector: sectorName,
      street: street.trim() || "Main Street",
      size,
      dimensions,
      category,
      possession,
      status: "available",
      demandPricePKR: Number(demandPricePKR) || 50_000_000,
      minimumTokenPKR: Number(minimumTokenPKR) || 1_000_000,
      isCorner,
      isParkFacing,
      isBoulevard,
      roadWidthFt: Number(roadWidthFt) || 50,
      ownerName: ownerName.trim() || "Direct Allottee",
      ownerPhone: ownerPhone.trim() || "+92 300 1234567",
      ownerCnic: ownerCnic.trim() || "37405-1234567-1",
      directDealer: "In-House Agency Listing",
      allotmentType,
      ndcStatus,
      gridRow: 1,
      gridCol: 1,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    onAddPlot(newPlot);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Society Plot to Inventory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register a new plot with Pakistani dimensions, corner/park tags, and owner particulars
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Location & Sector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Housing Society *
              </label>
              <select
                value={societyId}
                onChange={(e) => {
                  setSocietyId(e.target.value);
                  const s = SOCIETIES_CATALOG.find((soc) => soc.id === e.target.value);
                  if (s) setSectorName(s.sectors[0].name);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {SOCIETIES_CATALOG.map((soc) => (
                  <option key={soc.id} value={soc.id}>
                    {soc.name} ({soc.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Sector / Block *
              </label>
              <select
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {currentSoc.sectors.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {sec.name} ({sec.defaultSize})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plot Number & Street */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Plot Number *
              </label>
              <input
                type="text"
                required
                value={plotNumber}
                onChange={(e) => setPlotNumber(e.target.value)}
                placeholder="e.g. 142 or CB-05"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Street / Avenue *
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Street 14 or Main Boulevard"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Size & Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Area Size (Marla / Kanal) *
              </label>
              <select
                value={size}
                onChange={(e) => handleSizeChange(e.target.value as SocietyPlot["size"])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="5 Marla">5 Marla (25 x 50)</option>
                <option value="10 Marla">10 Marla (35 x 70)</option>
                <option value="1 Kanal">1 Kanal (50 x 90)</option>
                <option value="2 Kanal">2 Kanal (100 x 180)</option>
                <option value="4 Marla Commercial">4 Marla Commercial (30 x 60)</option>
                <option value="8 Marla Commercial">8 Marla Commercial (40 x 90)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Plot Dimensions
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Special Category Toggles */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Special Pakistani Property Premiums
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={isCorner}
                  onChange={(e) => setIsCorner(e.target.checked)}
                  className="w-4 h-4 rounded text-[#EE6427] border-slate-300 focus:ring-[#EE6427]"
                />
                <span>🌟 Corner Plot</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={isParkFacing}
                  onChange={(e) => setIsParkFacing(e.target.checked)}
                  className="w-4 h-4 rounded text-[#EE6427] border-slate-300 focus:ring-[#EE6427]"
                />
                <span>🌳 Park Facing</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={isBoulevard}
                  onChange={(e) => setIsBoulevard(e.target.checked)}
                  className="w-4 h-4 rounded text-[#EE6427] border-slate-300 focus:ring-[#EE6427]"
                />
                <span>🛣️ Main Boulevard</span>
              </label>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Asking Demand Price (PKR) *
              </label>
              <input
                type="number"
                required
                value={demandPricePKR}
                onChange={(e) => setDemandPricePKR(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Min Token Advance (PKR)
              </label>
              <input
                type="number"
                value={minimumTokenPKR}
                onChange={(e) => setMinimumTokenPKR(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Owner / Seller Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Owner / Allottee Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Tariq Mahmood"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Owner Phone
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Owner CNIC
              </label>
              <input
                type="text"
                value={ownerCnic}
                onChange={(e) => setOwnerCnic(e.target.value)}
                placeholder="37405-1234567-1"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Internal Deal Notes & Physical Site Features
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Level ground, zero depression, original file in hand, ready transfer."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold shadow-md transition-all cursor-pointer"
            >
              Save Plot to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
