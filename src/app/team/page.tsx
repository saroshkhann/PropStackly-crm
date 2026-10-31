"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import { formatPKR, formatPhoneNumber } from "@/lib/formatters";
import { Agent } from "@/types/crm";
import api from "@/lib/api";
import {
  Award,
  Plus,
  Phone,
  Mail,
  TrendingUp,
  Target,
  UserCheck,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  Lock,
  Trash2,
  Power,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Check,
} from "lucide-react";

export default function TeamPage() {
  return (
    <AppShell>
      <TeamContent />
    </AppShell>
  );
}

function TeamContent() {
  const {
    agents,
    addAgent,
    removeAgent,
    toggleAgentStatus,
    currentAgent,
    setCurrentAgentId,
    leads,
    showToast,
    isOwner,
    isManager,
    isAgent,
    settings,
  } = useCRM();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset password modal state
  const [selectedAgentForReset, setSelectedAgentForReset] = useState<Agent | null>(null);
  const [isResetAgentModalOpen, setIsResetAgentModalOpen] = useState(false);
  const [resetAgentPassword, setResetAgentPassword] = useState("Agent123!");
  const [showAgentResetPass, setShowAgentResetPass] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Form state for creating new agent account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Agent123!");
  const [systemRole, setSystemRole] = useState<"agent" | "manager">("agent");
  const [phone, setPhone] = useState("+92 300 ");
  const [role, setRole] = useState<any>("Property Consultant");
  const [monthlyTargetPKR, setMonthlyTargetPKR] = useState(80000000); // 8 Crore
  const [avatar, setAvatar] = useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  );

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast("Please provide both name and login email", "error");
      return;
    }

    addAgent({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password.trim() || "Agent123!",
      systemRole,
      role,
      avatar,
      monthlyTargetPKR: Number(monthlyTargetPKR),
      status: "active",
    });

    setIsAddModalOpen(false);
    setName("");
    setEmail("");
    setPassword("Agent123!");
    setPhone("+92 300 ");
  };

  const handleRemove = (agent: Agent) => {
    if (agent.id === currentAgent?.id) {
      showToast("You cannot remove your own active master account", "error");
      return;
    }
    const confirm = window.confirm(
      `Are you sure you want to revoke CRM access and remove ${agent.name}? Their assigned leads will remain safe.`
    );
    if (confirm) {
      removeAgent(agent.id);
    }
  };

  const handleSaveAgentResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForReset) return;
    const pass = resetAgentPassword.trim();
    if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/[0-9]/.test(pass) || !/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?~`]/.test(pass)) {
      showToast("Password must be at least 8 chars with uppercase, lowercase, number, and symbol", "error");
      return;
    }

    setIsSubmittingReset(true);
    try {
      await api.team.resetPassword(selectedAgentForReset.id, resetAgentPassword.trim());
      showToast(`Password for ${selectedAgentForReset.name} updated to "${resetAgentPassword.trim()}"`);
      setIsResetAgentModalOpen(false);
      setSelectedAgentForReset(null);
    } catch (err: any) {
      showToast(err.message || "Failed to reset password", "error");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // If user is a sales agent, access to confidential team quotas and all agents is restricted
  if (isAgent) {
    return (
      <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team Directory Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Agency sales targets, quotas, and personnel rosters are restricted to Agency Managers and Owners. As a Sales Consultant, you can view your active leads and scheduled follow-ups.
        </p>
        <div className="pt-2">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EE6427] hover:bg-[#DE5518] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Go to My Assigned Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight font-normal">
            Team & Agents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{agents.length} active agency consultants & brokers</span>
            <span>•</span>
            <span>Access control, quota targets & credential management.</span>
            <span className="text-[#EE6427] font-bold">✨</span>
          </p>
        </div>

        {isOwner ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-950 dark:bg-white dark:text-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Create Agent Account</span>
          </button>
        ) : (
          <div
            title="Only Agency Owners can create new login accounts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl self-start sm:self-auto cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Owner Only</span>
          </div>
        )}
      </div>

      {/* Owner Security Information Pill */}
      {isOwner && (
        <div className="p-4.5 rounded-2xl bg-amber-50/70 dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Direct Agency Ownership & Credential Authority
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                As the Agency Owner, you have full authority to create agent login credentials, set passwords, assign roles (Manager vs Agent), and instantly deactivate accounts if an agent leaves your firm. Agents are strictly restricted to their own assigned leads.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 font-mono text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-300/60 dark:border-amber-800/60">
            <span>Active Agency: {settings?.agencyName || "PropStackly Prime"}</span>
          </div>
        </div>
      )}

      {/* Agents Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const isCurrentUser = agent.id === currentAgent?.id;
          const assignedLeads = leads.filter((l) => l.assignedAgentId === agent.id).length;
          const targetProgress = Math.min(
            Math.round((agent.totalSalesVolumePKR / (agent.monthlyTargetPKR || 1)) * 100),
            100
          );
          const isDeactivated = agent.status === "offline";
          const agentSystemRole = agent.systemRole || (agent.role.toLowerCase().includes("principal") || agent.role.toLowerCase().includes("broker") ? "owner" : agent.role.toLowerCase().includes("manager") ? "manager" : "agent");

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-2xs ${
                isCurrentUser
                  ? "border-[#EE6427] ring-2 ring-[#EE6427]/20"
                  : isDeactivated
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-80"
                  : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Profile Top */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className={`w-12 h-12 rounded-full object-cover ring-2 ${
                          isDeactivated ? "ring-slate-200 dark:ring-slate-700 grayscale" : "ring-slate-100 dark:ring-slate-800"
                        }`}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          isDeactivated
                            ? "bg-slate-400"
                            : agent.status === "active"
                            ? "bg-emerald-500"
                            : agent.status === "on_site"
                            ? "bg-purple-500"
                            : "bg-amber-500"
                        }`}
                        title={`Status: ${agent.status}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{agent.name}</h3>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-[#DE5518] dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.5 rounded-sm">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{agent.role}</p>
                    </div>
                  </div>

                  {/* System Role Badge */}
                  <div className="flex flex-col items-end gap-1">
                    {agentSystemRole === "owner" ? (
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                        Owner
                      </span>
                    ) : agentSystemRole === "manager" ? (
                      <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 px-2 py-0.5 rounded-md">
                        Manager
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-md">
                        Sales Agent
                      </span>
                    )}

                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                        isDeactivated
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                          : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                      }`}
                    >
                      {isDeactivated ? "Deactivated" : "Active"}
                    </span>
                  </div>
                </div>

                {/* Contact Links & Credentials */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-1.5 hover:text-[#EE6427] transition-colors truncate text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                      title={agent.email}
                    >
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{agent.email}</span>
                    </a>
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-1 hover:text-[#EE6427] transition-colors font-mono text-[11px] shrink-0 text-slate-700 dark:text-slate-300"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      {formatPhoneNumber(agent.phone)}
                    </a>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Leads</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{assignedLeads}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Deals Won</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {agent.closedDealsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Conv. Rate</p>
                    <p className="text-sm font-bold text-[#EE6427] dark:text-orange-400 mt-0.5">
                      {agent.conversionRate}%
                    </p>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
                      <Target className="w-3 h-3 text-slate-400" />
                      Monthly Target
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                      {formatPKR(agent.totalSalesVolumePKR)} / {formatPKR(agent.monthlyTargetPKR)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#EE6427] rounded-full transition-all"
                      style={{ width: `${targetProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Owner Controls + Profile Switching */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {/* Owner Specific Controls */}
                {isOwner && !isCurrentUser && (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAgentStatus(agent.id)}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                        isDeactivated
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                      title={isDeactivated ? "Reactivate Agent Account" : "Temporarily Deactivate Agent"}
                    >
                      <Power className="w-3 h-3" />
                      {isDeactivated ? "Reactivate" : "Deactivate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgentForReset(agent);
                        setResetAgentPassword("Agent123!");
                        setIsResetAgentModalOpen(true);
                      }}
                      className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Set new login password for this agent"
                    >
                      <KeyRound className="w-3 h-3 text-slate-500" />
                      <span>Reset Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(agent)}
                      className="py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors cursor-pointer"
                      title="Permanently remove agent from agency"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}

                {/* Profile Switch Button */}
                <button
                  type="button"
                  onClick={() => setCurrentAgentId(agent.id)}
                  disabled={isCurrentUser}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isCurrentUser
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
                      : "bg-orange-50 dark:bg-orange-950/40 text-[#DE5518] dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/60 cursor-pointer"
                  }`}
                >
                  {isCurrentUser ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Currently Active Profile
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Switch to this Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Team Member Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate CRM credentials and configure permissions for your agent
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agent Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daniyal Sheikh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/20 focus:border-[#EE6427]"
                />
              </div>

              {/* Login Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Login Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="agent@agency.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/20 focus:border-[#EE6427]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used to log into the CRM dashboard</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/20 focus:border-[#EE6427]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used for customer WhatsApp click-to-chat</p>
                </div>
              </div>

              {/* Login Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Initial Login Password *</span>
                  <span className="text-[10px] font-normal text-slate-400">Agent can change this later</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/20 focus:border-[#EE6427]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* System Security Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  CRM Access Role & Security Permissions *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSystemRole("agent")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      systemRole === "agent"
                        ? "border-[#EE6427] bg-orange-50/50 dark:bg-orange-950/30 ring-1 ring-[#EE6427]"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Sales Consultant</span>
                      {systemRole === "agent" && <Check className="w-3.5 h-3.5 text-[#EE6427]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Restricted to only viewing and calling their own assigned leads. Cannot view agency quotas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSystemRole("manager")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      systemRole === "manager"
                        ? "border-[#EE6427] bg-orange-50/50 dark:bg-orange-950/30 ring-1 ring-[#EE6427]"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Sales Manager</span>
                      {systemRole === "manager" && <Check className="w-3.5 h-3.5 text-[#EE6427]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Full access to reassign leads, monitor all agents, inspect deal pipelines, and review sales.
                    </p>
                  </button>
                </div>
              </div>

              {/* Designation & Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Designation
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/20 focus:border-[#EE6427]"
                  >
                    <option value="Senior Sales Manager">Senior Sales Manager</option>
                    <option value="Property Consultant">Property Consultant</option>
                    <option value="Lead Specialist">Lead Specialist</option>
                    <option value="Investment Advisor">Investment Advisor</option>
                    <option value="Principal Broker">Principal Broker</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Monthly Target
                    </label>
                    <span className="text-xs font-bold text-[#DE5518] dark:text-orange-400 font-mono">
                      {formatPKR(monthlyTargetPKR)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={monthlyTargetPKR}
                    onChange={(e) => setMonthlyTargetPKR(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/20 focus:border-[#EE6427]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Create Account & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Agent Password Modal (Owner Only) */}
      {isResetAgentModalOpen && selectedAgentForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Reset Agent Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set a new password for <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAgentForReset.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetAgentModalOpen(false);
                  setSelectedAgentForReset(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgentResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agent Login Email
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedAgentForReset.email}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showAgentResetPass ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    value={resetAgentPassword}
                    onChange={(e) => setResetAgentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/30 focus:border-[#EE6427]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAgentResetPass(!showAgentResetPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showAgentResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Provide this new password to the agent so they can sign in.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetAgentModalOpen(false);
                    setSelectedAgentForReset(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {isSubmittingReset ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
