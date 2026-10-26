"use client";

import React, { useState, useEffect } from "react";
import { X, Edit, Building, Phone, Mail } from "lucide-react";
import { useCRM } from "@/context/CRMContext";
import { Lead, LeadPriority, LeadSource, PropertyType, LeadStatus } from "@/types/crm";
import { formatPKR } from "@/lib/formatters";

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditLeadModal({ lead, isOpen, onClose }: EditLeadModalProps) {
  const { updateLead, agents } = useCRM();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState<any>("Islamabad");
  const [source, setSource] = useState<LeadSource>("Facebook Ads");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [priority, setPriority] = useState<LeadPriority>("high");
  const [assignedAgentId, setAssignedAgentId] = useState("");
  const [propertyTypeInterest, setPropertyTypeInterest] = useState<PropertyType>("House / Villa");
  const [budgetPKR, setBudgetPKR] = useState<number>(35000000);
  const [preferredLocation, setPreferredLocation] = useState("");
  const [purpose, setPurpose] = useState<any>("Own Residence");

  useEffect(() => {
    if (lead) {
      setFullName(lead.fullName);
      setPhone(lead.phone);
      setEmail(lead.email || "");
      setCity(lead.city);
      setSource(lead.source);
      setStatus(lead.status);
      setPriority(lead.priority);
      setAssignedAgentId(lead.assignedAgentId);
      setPropertyTypeInterest(lead.propertyTypeInterest);
      setBudgetPKR(lead.budgetPKR);
      setPreferredLocation(lead.preferredLocations[0] || "");
      setPurpose(lead.purpose);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLead(lead.id, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city,
      source,
      status,
      priority,
      assignedAgentId,
      budgetPKR: Number(budgetPKR),
      propertyTypeInterest,
      preferredLocations: [preferredLocation.trim()],
      purpose,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EE6427]/10 text-[#EE6427] flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Edit Lead Record</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update requirements, budget, or stage</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="new">New Enquiry</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="follow_up">Follow-up Due</option>
                <option value="site_visit_scheduled">Site Visit Scheduled</option>
                <option value="negotiation">Under Negotiation</option>
                <option value="won">Deal Closed (Won)</option>
                <option value="lost">Lost / Dropped</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Budget (PKR)</label>
                <span className="text-xs font-bold text-[#DE5518] dark:text-orange-400 font-mono">
                  {formatPKR(budgetPKR)}
                </span>
              </div>
              <input
                type="number"
                step="any"
                value={budgetPKR}
                onChange={(e) => setBudgetPKR(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Preferred Location</label>
              <input
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
