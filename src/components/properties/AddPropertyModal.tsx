"use client";

import React, { useState } from "react";
import { X, Building2, Image as ImageIcon, DollarSign, MapPin, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { PropertyType, PropertyStatus } from "@/types/crm";
import { formatPKR } from "@/lib/formatters";
import api from "@/lib/api";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPropertyModal({ isOpen, onClose }: AddPropertyModalProps) {
  const { addProperty, agents, currentAgent } = useCRM();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<PropertyType>("House / Villa");
  const [city, setCity] = useState<"Islamabad" | "Rawalpindi" | "Lahore" | "Karachi">("Islamabad");
  const [society, setSociety] = useState("DHA Islamabad");
  const [location, setLocation] = useState("Sector J, Phase 2");
  const [pricePKR, setPricePKR] = useState<number>(45000000); // 4.5 Crore
  const [areaSize, setAreaSize] = useState("10 Marla");
  const [bedrooms, setBedrooms] = useState<number>(4);
  const [bathrooms, setBathrooms] = useState<number>(5);
  const [status, setStatus] = useState<PropertyStatus>("available");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80");
  const [description, setDescription] = useState("");
  const [assignedAgentId, setAssignedAgentId] = useState(currentAgent?.id || "agent-1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image file size must be less than 5 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }

    setUploadError(null);
    setIsUploadingImage(true);
    try {
      const res = await api.properties.uploadImage(file);
      setImageUrl(res.image_url);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Property title is required";
    if (!society.trim()) errs.society = "Society / project name is required";
    if (!location.trim()) errs.location = "Sector / street address is required";
    if (pricePKR <= 0) errs.pricePKR = "Valid price in PKR is required";
    if (!areaSize.trim()) errs.areaSize = "Area size is required (e.g. 10 Marla, 1 Kanal)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    addProperty({
      title: title.trim(),
      slug,
      type,
      city,
      society: society.trim(),
      location: location.trim(),
      pricePKR: Number(pricePKR),
      areaSize: areaSize.trim(),
      bedrooms: bedrooms > 0 ? Number(bedrooms) : undefined,
      bathrooms: bathrooms > 0 ? Number(bathrooms) : undefined,
      status,
      featured: false,
      imageUrl: imageUrl.trim(),
      description: description.trim() || `${areaSize} ${type} located in ${society}. Excellent investment opportunity.`,
      assignedAgentId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EE6427]/10 text-[#EE6427] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Add Property Inventory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">List plot, villa, apartment, or commercial floor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Listing Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 10 Marla Brand New Luxury Villa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 ${
                errors.title ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Property Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="House / Villa">House / Villa</option>
                <option value="Residential Plot">Residential Plot</option>
                <option value="Commercial Plot">Commercial Plot</option>
                <option value="Apartment / Penthouse">Apartment / Penthouse</option>
                <option value="Commercial Plaza">Commercial Plaza</option>
                <option value="Farmhouse">Farmhouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="available">Available</option>
                <option value="under_negotiation">Under Negotiation</option>
                <option value="reserved">Reserved (Token)</option>
                <option value="sold">Sold Out</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Society / Project <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. DHA Islamabad, Bahria Town, Gulberg"
                value={society}
                onChange={(e) => setSociety(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sector / Exact Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sector J, Phase 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Price (PKR) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  {formatPKR(pricePKR)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                value={pricePKR}
                onChange={(e) => setPricePKR(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Area Size (Marla/Kanal) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 10 Marla or 1 Kanal"
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Agent</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bathrooms</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Property Image Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Property Photo</label>

            {uploadError && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Property preview"
                className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs"
              />

              <div className="flex-1 w-full space-y-2">
                <label className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#DE5518] dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-900/60 rounded-lg cursor-pointer transition-colors">
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#EE6427]" />
                      <span>Uploading to Storage...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-[#EE6427]" />
                      <span>Upload Image (JPEG, PNG, WebP &le; 5MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingImage}
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 shrink-0">Or Image URL:</span>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md font-mono text-slate-600 dark:text-slate-300"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Highlight fixtures, location benefits, nearby school, park, or commercial markaz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
