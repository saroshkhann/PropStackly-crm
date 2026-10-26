"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import { formatPKR, getPropertyStatusConfig, getWhatsAppLink } from "@/lib/formatters";
import { Property, PropertyType, PropertyStatus } from "@/types/crm";
import { AddPropertyModal } from "@/components/properties/AddPropertyModal";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Map,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Share2,
  Trash2,
  Edit,
  X,
  ExternalLink,
  Sparkles,
  Lock,
  Globe,
  Calculator,
} from "lucide-react";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { ShareOverseasModal } from "@/components/properties/ShareOverseasModal";

export default function PropertiesPage() {
  return (
    <AppShell>
      <PropertiesContent />
    </AppShell>
  );
}

function PropertiesContent() {
  const {
    properties,
    agents,
    deleteProperty,
    updateProperty,
    showToast,
    isManager,
    isOwner,
    isAgent,
    activeCurrency,
    formatActiveCurrency,
  } = useCRM();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propToDelete, setPropToDelete] = useState<Property | null>(null);
  const [selectedShareProperty, setSelectedShareProperty] = useState<Property | null>(null);

  const filteredProperties = useMemo(() => {
    const list = properties.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(searchLower) ||
        p.society.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower) ||
        p.areaSize.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
      if (selectedType !== "all" && p.type !== selectedType) return false;
      if (selectedCity !== "all" && p.city !== selectedCity) return false;
      if (selectedStatus !== "all" && p.status !== selectedStatus) return false;

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "price_desc") return b.pricePKR - a.pricePKR;
      if (sortBy === "price_asc") return a.pricePKR - b.pricePKR;
      if (sortBy === "newest")
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [properties, search, selectedType, selectedCity, selectedStatus, sortBy]);

  const handleShareWhatsApp = (property: Property) => {
    const text = `Assalam-o-Alaikum, here are details for: ${property.title}\n📍 Location: ${property.location}, ${property.society}, ${property.city}\n📐 Size: ${property.areaSize}\n💰 Asking Price: ${formatPKR(property.pricePKR)}\n\nInterested? Contact PropStackly Prime Properties.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    showToast("Opening WhatsApp with property details...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Inventory Management</span>
            <span>•</span>
            <span className="text-[#EE6427] font-bold">{properties.length} Active Listings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Property Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Villas, residential plots, commercial floors, and luxury penthouses
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/plot-maps"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-lg shadow-2xs transition-colors"
            title="Open Interactive DHA & Bahria Blueprint Sector Maps"
          >
            <Map className="w-3.5 h-3.5 text-[#EE6427]" />
            <span>Society Plot Maps</span>
          </Link>

          {/* View toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isManager ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Property
            </button>
          ) : (
            <div
              title="Only Agency Managers and Owners can add inventory"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              Add Inventory (Manager Only)
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by society, DHA, Bahria, size..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Property Types</option>
              <option value="House / Villa">House / Villa</option>
              <option value="Residential Plot">Residential Plot</option>
              <option value="Commercial Plot">Commercial Plot</option>
              <option value="Apartment / Penthouse">Apartment / Penthouse</option>
              <option value="Commercial Plaza">Commercial Plaza</option>
              <option value="Farmhouse">Farmhouse</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Cities</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Rawalpindi">Rawalpindi</option>
              <option value="Lahore">Lahore</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="under_negotiation">Under Negotiation</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold Out</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 font-semibold text-orange-950 dark:text-orange-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            >
              <option value="featured">Featured First</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="newest">Newest Listed</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Multi-Currency & Overseas Conversion Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Active Valuation Currency:</span>
            <CurrencySelector />
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Real-time interbank conversion for overseas Pakistani clients (UK, UAE, US, Saudi Arabia)
          </span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No properties match your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing search terms or status criteria</p>
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const statusCfg = getPropertyStatusConfig(prop.status);
              const agent = agents.find((a) => a.id === prop.assignedAgentId);

              return (
                <div
                  key={prop.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden hover:shadow-md transition-shadow flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs ${statusCfg.bg}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-bold font-mono shadow-md flex items-baseline gap-1.5">
                      <span>{formatActiveCurrency(prop.pricePKR)}</span>
                      {activeCurrency !== "PKR" && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({formatPKR(prop.pricePKR)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-semibold text-[#EE6427]">{prop.type}</span>
                        <span className="font-mono">{prop.areaSize}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#EE6427] transition-colors">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {prop.location}, {prop.society}
                      </p>
                    </div>

                    {/* Specs / Features */}
                    {(prop.bedrooms || prop.bathrooms) && (
                      <div className="flex items-center gap-4 py-2 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        {prop.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5 text-slate-400" />
                            {prop.bedrooms} Beds
                          </span>
                        )}
                        {prop.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-slate-400" />
                            {prop.bathrooms} Baths
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                          {prop.areaSize}
                        </span>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={agent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={agent?.name || "Agent"}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {agent?.name.split(" ")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/tax-calculator?price=${prop.pricePKR}&society=${encodeURIComponent(prop.society)}&size=${encodeURIComponent(prop.areaSize)}&type=${encodeURIComponent(prop.type)}&title=${encodeURIComponent(prop.title)}`}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Calculate FBR Section 236C/K Taxes & Transfer Costs"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setSelectedShareProperty(prop)}
                          className="p-1.5 text-[#EE6427] hover:text-[#DE5518] hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Generate Overseas Client Dossier (UK, UAE, US, Saudi Arabia)"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(prop)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {isManager && (
                          <>
                            <button
                              onClick={() => setEditingProperty(prop)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Listing (Manager/Owner Only)"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPropToDelete(prop)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete Listing (Manager/Owner Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Type & Area</th>
                <th className="py-3 px-4">Society & City</th>
                <th className="py-3 px-4">Price (PKR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Consultant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProperties.map((prop) => {
                const statusCfg = getPropertyStatusConfig(prop.status);
                const agent = agents.find((a) => a.id === prop.assignedAgentId);

                return (
                  <tr key={prop.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prop.imageUrl}
                          alt={prop.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">{prop.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{prop.type}</span>
                      <p className="text-[11px] text-slate-500 font-mono">{prop.areaSize}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 dark:text-slate-200">{prop.society}</span>
                      <p className="text-[11px] text-slate-500">{prop.city}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div>{formatActiveCurrency(prop.pricePKR)}</div>
                      {activeCurrency !== "PKR" && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {formatPKR(prop.pricePKR)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{agent?.name}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/tax-calculator?price=${prop.pricePKR}&society=${encodeURIComponent(prop.society)}&size=${encodeURIComponent(prop.areaSize)}&type=${encodeURIComponent(prop.type)}&title=${encodeURIComponent(prop.title)}`}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md cursor-pointer"
                          title="Calculate FBR Section 236C/K Taxes & Transfer Costs"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setSelectedShareProperty(prop)}
                          className="p-1.5 text-[#EE6427] hover:text-[#DE5518] hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-md cursor-pointer"
                          title="Generate Overseas Client Dossier (UK, UAE, US, Saudi Arabia)"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(prop)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {isManager && (
                          <>
                            <button
                              onClick={() => setEditingProperty(prop)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                              title="Edit Listing (Manager/Owner Only)"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPropToDelete(prop)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer"
                              title="Delete Listing (Manager/Owner Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Delete Confirmation */}
      {propToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Property Listing?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-white">{propToDelete.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPropToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProperty(propToDelete.id);
                  setPropToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Property Listing</h3>
              <button
                onClick={() => setEditingProperty(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProperty(editingProperty.id, {
                  title: editingProperty.title,
                  pricePKR: Number(editingProperty.pricePKR),
                  status: editingProperty.status,
                  description: editingProperty.description,
                });
                setEditingProperty(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Property Title
                </label>
                <input
                  type="text"
                  required
                  value={editingProperty.title}
                  onChange={(e) =>
                    setEditingProperty({ ...editingProperty, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Price (PKR)
                    </label>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatPKR(editingProperty.pricePKR)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={editingProperty.pricePKR}
                    onChange={(e) =>
                      setEditingProperty({
                        ...editingProperty,
                        pricePKR: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={editingProperty.status}
                    onChange={(e) =>
                      setEditingProperty({
                        ...editingProperty,
                        status: e.target.value as PropertyStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="available">Available</option>
                    <option value="under_negotiation">Under Negotiation</option>
                    <option value="reserved">Token Reserved</option>
                    <option value="sold">Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Features
                </label>
                <textarea
                  rows={3}
                  value={editingProperty.description}
                  onChange={(e) =>
                    setEditingProperty({
                      ...editingProperty,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overseas Share Modal */}
      {selectedShareProperty && (
        <ShareOverseasModal
          property={selectedShareProperty}
          isOpen={!!selectedShareProperty}
          onClose={() => setSelectedShareProperty(null)}
        />
      )}
    </div>
  );
}
