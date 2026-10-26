"use client";

import React, { useState } from "react";
import { X, UserPlus, Sparkles, Building, Phone, Mail, DollarSign, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { LeadPriority, LeadSource, PropertyType, LeadStatus } from "@/types/crm";
import { formatPKR } from "@/lib/formatters";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const { addLead, agents, currentAgent, addNote } = useCRM();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+92 ");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState<"Islamabad" | "Rawalpindi" | "Lahore" | "Karachi" | "Overseas">("Islamabad");
  const [source, setSource] = useState<LeadSource>("Facebook Ads");
  const [priority, setPriority] = useState<LeadPriority>("high");
  const [assignedAgentId, setAssignedAgentId] = useState(currentAgent?.id || "agent-1");
  const [propertyTypeInterest, setPropertyTypeInterest] = useState<PropertyType>("House / Villa");
  const [budgetPKR, setBudgetPKR] = useState<number>(35000000); // 3.5 Crore default
  const [preferredLocation, setPreferredLocation] = useState("DHA Islamabad Phase 2");
  const [purpose, setPurpose] = useState<"Investment" | "Own Residence" | "Commercial Rental">("Own Residence");
  const [initialNoteText, setInitialNoteText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Lead full name is required";
    if (!phone.trim() || phone.trim() === "+92") newErrors.phone = "Valid phone number is required";
    if (budgetPKR <= 0) newErrors.budgetPKR = "Budget must be greater than 0";
    if (!preferredLocation.trim()) newErrors.preferredLocation = "Preferred location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newId = await addLead({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city,
        source,
        status: "new" as LeadStatus,
        priority,
        assignedAgentId,
        budgetPKR: Number(budgetPKR),
        propertyTypeInterest,
        preferredLocations: [preferredLocation.trim()],
        purpose,
      });

      if (initialNoteText.trim()) {
        addNote(newId, initialNoteText.trim());
      }

      onClose();
    } catch (err: any) {
      setServerError(err.message || "Failed to register lead. Phone number may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EE6427]/10 text-[#EE6427] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Register New Lead</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log an incoming buyer enquiry with Pakistani location & budget details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {serverError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Register Lead</p>
                <p className="mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Row 1: Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sardar Naveed Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 ${
                  errors.fullName ? "border-rose-300 dark:border-rose-800 bg-rose-50/30" : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 font-mono ${
                    errors.phone ? "border-rose-300 dark:border-rose-800 bg-rose-50/30" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Row 2: Email & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Location / City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
              >
                <option value="Islamabad">Islamabad</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Overseas">Overseas Pakistani (UK / UAE / US)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Source & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
              >
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Zameen.com">Zameen.com</option>
                <option value="WhatsApp">WhatsApp Direct</option>
                <option value="Phone Call">Phone Inbound</option>
                <option value="Graana">Graana.com</option>
                <option value="Website Form">Website Form</option>
                <option value="Walk-in">Walk-in Client</option>
                <option value="Referral">Client Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
              >
                <option value="high">High (Hot - ready to visit)</option>
                <option value="medium">Medium (Warm - exploring)</option>
                <option value="low">Low (Cold - general enquiry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Agent
              </label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role.split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Property Requirements */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Property Requirements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyTypeInterest}
                  onChange={(e) => setPropertyTypeInterest(e.target.value as PropertyType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                >
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="House / Villa">House / Villa</option>
                  <option value="Commercial Plot">Commercial Plot</option>
                  <option value="Apartment / Penthouse">Apartment / Penthouse</option>
                  <option value="Commercial Plaza">Commercial Plaza</option>
                  <option value="Farmhouse">Farmhouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Buying Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
                >
                  <option value="Own Residence">Own Residence</option>
                  <option value="Investment">Investment / Capital Gain</option>
                  <option value="Commercial Rental">Commercial Rental Yield</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Budget (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-[#DE5518] dark:text-orange-400 font-mono">
                    {formatPKR(budgetPKR)}
                  </span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={budgetPKR}
                  onChange={(e) => setBudgetPKR(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Society / Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHA Islamabad Phase 2, Bahria Town"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 ${
                    errors.preferredLocation ? "border-rose-300 dark:border-rose-800" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {errors.preferredLocation && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.preferredLocation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Initial Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Note / Requirement Details (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Looking for 10 Marla brand new corner house, ready for possession within 2 months..."
              value={initialNoteText}
              onChange={(e) => setInitialNoteText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Registering..." : "Save & Register Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
