"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Zap,
  Clock,
  ShieldAlert,
  UserCheck,
  Bell,
  Settings,
  Check,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { SpeedToLeadConfig } from "@/types/sla";

interface SLAConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SpeedToLeadConfig;
  onSave: (newConfig: SpeedToLeadConfig) => void;
}

export function SLAConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
}: SLAConfigModalProps) {
  const [form, setForm] = useState<SpeedToLeadConfig>(config);

  useEffect(() => {
    setForm(config);
  }, [config, isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Cross Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-300/80 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 group"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 pr-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Speed-to-Lead SLA Policy & Escalation Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure first-response targets, agent warning timers, manager escalation, and auto-reassign
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Enable Speed-to-Lead SLA Engine
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                Automatically monitors incoming inquiries from Facebook, WhatsApp, Zameen, and Website forms.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EE6427]"></div>
            </label>
          </div>

          {/* SLA Time Milestones */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#EE6427]" />
              <span>1. First-Response Time Targets & Warning Thresholds</span>
            </h4>

            {/* Target Response Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Target SLA (Minutes)
                </span>
                <p className="text-[11px] text-slate-500">Industry standard is 5 mins for web leads</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={form.firstResponseTargetMinutes}
                    onChange={(e) =>
                      setForm({ ...form, firstResponseTargetMinutes: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Minutes</span>
                </div>
                {/* Presets */}
                <div className="flex gap-1.5 pt-1">
                  {[5, 10, 15, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, firstResponseTargetMinutes: m })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        form.firstResponseTargetMinutes === m
                          ? "bg-[#EE6427] text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Warning Time */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Agent Warning Time
                </span>
                <p className="text-[11px] text-slate-500">Alerts agent when countdown nears end</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={form.firstResponseTargetMinutes}
                    value={form.agentWarningMinutes}
                    onChange={(e) =>
                      setForm({ ...form, agentWarningMinutes: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Minutes</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[2, 3, 5, 8].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, agentWarningMinutes: m })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        form.agentWarningMinutes === m
                          ? "bg-amber-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Manager Escalation Time */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <span className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Manager Escalation
                </span>
                <p className="text-[11px] text-slate-500">Pushes breach alert to Sales Manager / CEO</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={form.firstResponseTargetMinutes}
                    max={180}
                    value={form.managerEscalationMinutes}
                    onChange={(e) =>
                      setForm({ ...form, managerEscalationMinutes: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center"
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Minutes</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[10, 15, 20, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, managerEscalationMinutes: m })}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                        form.managerEscalationMinutes === m
                          ? "bg-purple-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Reassignment Rules */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>2. Optional Auto-Reassignment to Another Agent</span>
            </h4>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    Auto-reassign neglected leads
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    If an agent does not call or WhatsApp the lead within the cutoff time, take lead away and hand off.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoReassignEnabled}
                    onChange={(e) => setForm({ ...form, autoReassignEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {form.autoReassignEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cutoff Time for Reassignment
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={form.autoReassignMinutes}
                        onChange={(e) =>
                          setForm({ ...form, autoReassignMinutes: Number(e.target.value) })
                        }
                        className="w-24 px-2 py-1 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-600 dark:text-slate-400">minutes of inactivity</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reassignment Strategy
                    </label>
                    <select
                      value={form.reassignStrategy}
                      onChange={(e) => setForm({ ...form, reassignStrategy: e.target.value as any })}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="round_robin">Round-Robin (Next in Rotation)</option>
                      <option value="least_busy">Least Busy Agent (Smallest Lead Load)</option>
                      <option value="senior_first">Senior Agent / Top Performer Priority</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alert Channels & Business Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Notification Channels */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#EE6427]" />
                <span>Alert Channels</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.notifyChannels.inApp}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notifyChannels: { ...form.notifyChannels, inApp: e.target.checked },
                    })
                  }
                  className="w-3.5 h-3.5 text-[#EE6427] rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">In-App Floating Banner & Popups</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyChannels.whatsappAlert}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notifyChannels: { ...form.notifyChannels, whatsappAlert: e.target.checked },
                    })
                  }
                  className="w-3.5 h-3.5 text-[#EE6427] rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">WhatsApp Dispatch Alert to Agent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyChannels.soundChime}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notifyChannels: { ...form.notifyChannels, soundChime: e.target.checked },
                    })
                  }
                  className="w-3.5 h-3.5 text-[#EE6427] rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">Urgent Audio Chime upon Lead Inflow</span>
              </label>
            </div>

            {/* Operating Hours */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Business Hours Window</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Pause SLA clock outside operating hours so agents aren&apos;t penalized for midnight leads.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="time"
                  value={form.businessHoursStart}
                  onChange={(e) => setForm({ ...form, businessHoursStart: e.target.value })}
                  className="px-2 py-1 border rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="time"
                  value={form.businessHoursEnd}
                  onChange={(e) => setForm({ ...form, businessHoursEnd: e.target.value })}
                  className="px-2 py-1 border rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#EE6427] hover:bg-[#d9551c] text-white shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save SLA Policy</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
