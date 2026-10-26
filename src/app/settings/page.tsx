"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useCRM } from "@/context/CRMContext";
import api, { BackendAutomationConfig } from "@/lib/api";
import {
  Settings,
  Building,
  Phone,
  Mail,
  MapPin,
  Save,
  RotateCcw,
  ShieldCheck,
  Bell,
  Sliders,
  DollarSign,
  Sparkles,
  Lock,
  ShieldAlert,
  Zap,
  Webhook,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Download,
  CreditCard,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { TrialUpgradeModal } from "@/components/trial/TrialUpgradeModal";

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}

function SettingsContent() {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    showToast,
    isOwner,
    currentUser,
    fetchNotifications,
    isTrialExpired,
    trialRemainingFormatted,
    resetTrial,
  } = useCRM();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Basic agency settings
  const [agencyName, setAgencyName] = useState(settings.agencyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [ntnNumber, setNtnNumber] = useState(settings.ntnNumber);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [whatsappBusinessPhone, setWhatsappBusinessPhone] = useState(
    settings.whatsappBusinessPhone
  );
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [currencyFormat, setCurrencyFormat] = useState(settings.currencyFormat);
  const [autoAssignmentRule, setAutoAssignmentRule] = useState(
    settings.autoAssignmentRule
  );
  const [enableWhatsAppNotifications, setEnableWhatsAppNotifications] = useState(
    settings.enableWhatsAppNotifications
  );
  const [enableSmsAlerts, setEnableSmsAlerts] = useState(settings.enableSmsAlerts);

  // Automation & n8n settings
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [n8nWebhookSecret, setN8nWebhookSecret] = useState("");
  const [hasWebhookSecret, setHasWebhookSecret] = useState(false);
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("welcome_lead_intro");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [followupReminderMinutes, setFollowupReminderMinutes] = useState(60);
  const [complianceNotes, setComplianceNotes] = useState<string[]>([]);

  // Action states
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  const [isRunningReminders, setIsRunningReminders] = useState(false);
  const [runRemindersResult, setRunRemindersResult] = useState<string | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 8) {
      setPassError("New password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?~`]/.test(newPassword)) {
      setPassError("Password must include uppercase, lowercase, numeric digit, and a special character");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirm password do not match");
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      setPassSuccess(res.message || "Password updated successfully");
      showToast("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err.message || "Failed to update password. Please check your current password.");
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setIsChangingPass(false);
    }
  };

  // Load automation configuration
  useEffect(() => {
    api.automations
      .getConfig()
      .then((cfg) => {
        if (cfg) {
          if (cfg.n8n_webhook_url) setN8nWebhookUrl(cfg.n8n_webhook_url);
          setHasWebhookSecret(cfg.has_webhook_secret);
          if (cfg.whatsapp_template_name) setWhatsappTemplateName(cfg.whatsapp_template_name);
          setWhatsappEnabled(Boolean(cfg.whatsapp_enabled));
          if (cfg.followup_reminder_minutes_before) {
            setFollowupReminderMinutes(cfg.followup_reminder_minutes_before);
          }
          if (cfg.official_whatsapp_compliance?.compliance_notes) {
            setComplianceNotes(cfg.official_whatsapp_compliance.compliance_notes);
          }
        }
      })
      .catch(() => {
        // Handled via defaults
      });
  }, []);

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestWebhookResult(null);
    try {
      const res = await api.automations.testWebhook({
        webhook_url: n8nWebhookUrl || undefined,
        webhook_secret: n8nWebhookSecret || undefined,
      });
      setTestWebhookResult({
        success: res.success,
        message: res.message,
        latency: res.response_time_ms,
      });
      if (res.success) {
        showToast(`Webhook ping successful (${res.response_time_ms}ms)`);
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      setTestWebhookResult({
        success: false,
        message: err.message || "Failed to test webhook",
      });
      showToast(err.message || "Failed to reach webhook", "error");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleRunRemindersNow = async () => {
    setIsRunningReminders(true);
    setRunRemindersResult(null);
    try {
      const res = await api.automations.runReminders();
      setRunRemindersResult(res.message);
      showToast(res.message, "success");
      // Refresh in-app notifications
      fetchNotifications().catch(() => {});
    } catch (err: any) {
      showToast(err.message || "Failed to run reminder job", "error");
    } finally {
      setIsRunningReminders(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Update basic agency profile
    updateSettings({
      agencyName,
      tagline,
      ntnNumber,
      contactEmail,
      contactPhone,
      whatsappBusinessPhone,
      address,
      city,
      currencyFormat: currencyFormat as any,
      autoAssignmentRule: autoAssignmentRule as any,
      enableWhatsAppNotifications,
      enableSmsAlerts,
    });

    // 2. Update automation settings if owner
    if (isOwner) {
      try {
        const patchPayload: any = {
          n8n_webhook_url: n8nWebhookUrl,
          whatsapp_template_name: whatsappTemplateName,
          whatsapp_enabled: whatsappEnabled,
          followup_reminder_minutes_before: followupReminderMinutes,
        };
        if (n8nWebhookSecret) {
          patchPayload.n8n_webhook_secret = n8nWebhookSecret;
        }
        await api.automations.updateConfig(patchPayload);
        if (n8nWebhookSecret) {
          setHasWebhookSecret(true);
          setN8nWebhookSecret(""); // Clear input once safely stored
        }
        showToast("Agency configuration & automation pipeline saved successfully.");
      } catch (err: any) {
        showToast(err.message || "Failed to save automation settings", "error");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>System Configuration</span>
            <span>•</span>
            <span className="text-[#EE6427] font-bold">PropStackly CRM v2.1</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
            Agency Profile, Notifications & Automation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure head office credentials, scheduled follow-up reminders, and official WhatsApp n8n webhooks
          </p>
        </div>

        {isOwner ? (
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Dataset
          </button>
        ) : (
          <div
            title="Reset dataset is restricted to Agency Owners"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg self-start sm:self-auto cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
            Reset Dataset (Owner Only)
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p>
            <span className="font-semibold">View-Only Access:</span> Agency profile, contact details, and automation pipeline can only be modified by the Agency Owner (current role: <span className="font-semibold uppercase text-amber-950 dark:text-amber-100">{currentUser?.role || "Manager/Agent"}</span>).
          </p>
        </div>
      )}

      {/* Subscription Plan & 3-Day Free Trial Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Agency License & Subscription Plan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your agency licensing, 3-day trial period, and Pakistani IBFT billing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#EE6427] hover:bg-[#DE5518] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.subscriptionStatus === "active" ? "Change Plan" : "Upgrade to Pro"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Current Plan</span>
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {settings.subscriptionPlan || "Starter"} Plan
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Subscription Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {settings.subscriptionStatus === "active" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle className="w-3 h-3" />
                  Active Pro License
                </span>
              ) : isTrialExpired ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  <AlertCircle className="w-3 h-3" />
                  Trial Expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  <Clock className="w-3 h-3" />
                  3-Day Free Trial ({trialRemainingFormatted})
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Next Renewal / Expiry</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {settings.subscriptionExpiresAt
                ? new Date(settings.subscriptionExpiresAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                : settings.trialEndsAt
                ? new Date(settings.trialEndsAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                : "Active Trial"}
            </span>
          </div>
        </div>

        {isOwner && settings.subscriptionStatus === "trial" && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Need to test or extend the client trial?</span>
            <button
              type="button"
              onClick={() => resetTrial(3)}
              className="text-[#EE6427] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Free Trial to 3 Days
            </button>
          </div>
        )}
      </div>

      <TrialUpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Account Security & Password Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Account Security & Credentials</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Change your login password for {currentUser?.email || "your active account"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              Signed in as: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.email || "admin@propstackly.com"}</strong>
            </span>
          </div>
        </div>

        {passSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type={showNewPass ? "text" : "password"}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Passwords should be strong and include letters and numbers.
            </span>
            <button
              type="submit"
              disabled={isChangingPass || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {isChangingPass ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agency Profile Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-5 h-5 text-[#EE6427]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Agency Identification</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official entity branding reflected on receipts, WhatsApp greetings, and reports
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Agency Name
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                FBR NTN / Registration Number
              </label>
              <input
                type="text"
                value={ntnNumber}
                onChange={(e) => setNtnNumber(e.target.value)}
                disabled={!isOwner}
                placeholder="e.g. 8491823-7"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tagline / Slogan
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              disabled={!isOwner}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Landline / Office Mobile
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Head Office Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:text-slate-500 dark:disabled:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Follow-up Reminders & Scheduled Automation */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#EE6427]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled Follow-up Reminders</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Background job automatically scans for upcoming and overdue calls/visits
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunRemindersNow}
              disabled={isRunningReminders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DE5518] dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-900/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunningReminders ? "Running Scan..." : "Run Scheduler Scan Now"}
            </button>
          </div>

          {runRemindersResult && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{runRemindersResult}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Upcoming Reminder Window
              </label>
              <select
                value={followupReminderMinutes}
                onChange={(e) => setFollowupReminderMinutes(Number(e.target.value))}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850"
              >
                <option value={15}>15 minutes before scheduled time</option>
                <option value={30}>30 minutes before scheduled time</option>
                <option value={60}>1 hour before scheduled time (Default)</option>
                <option value={120}>2 hours before scheduled time</option>
                <option value={1440}>24 hours (1 day) before scheduled time</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Agents receive an in-app alert when a task enters this lookahead window.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auto-Assignment Algorithm
              </label>
              <select
                value={autoAssignmentRule}
                onChange={(e) => setAutoAssignmentRule(e.target.value as any)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-850"
              >
                <option value="round_robin">Round Robin (Even distribution)</option>
                <option value="load_balanced">Load Balanced (Fewer active leads first)</option>
                <option value="senior_priority">Senior Priority (High budget to Principal)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Assignee receives instant in-app notification when lead is routed.
              </p>
            </div>
          </div>
        </div>

        {/* n8n & Official WhatsApp Cloud API Automation Pipeline */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">n8n Webhook & WhatsApp Business Pipeline</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trigger automated messages via authenticated n8n workflows and Meta WhatsApp Cloud API
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              HMAC-SHA256 Protected
            </span>
          </div>

          {/* WhatsApp Enable Toggle with Explicit Opt-In Warning */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                disabled={!isOwner}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600"
              />
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Enable Outbound WhatsApp Automation
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Opt-in Required
                  </span>
                </p>
                <p className="text-slate-500 leading-relaxed mt-0.5">
                  When enabled, creating a new lead with buyer opt-in consent triggers your configured n8n workflow.
                  Under PTA and Meta commercial policies, unsolicited messages are strictly prohibited.
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Business Number
              </label>
              <input
                type="text"
                value={whatsappBusinessPhone}
                onChange={(e) => setWhatsappBusinessPhone(e.target.value)}
                disabled={!isOwner}
                placeholder="+92 300 5550192"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pre-Approved WhatsApp Template
              </label>
              <select
                value={whatsappTemplateName}
                onChange={(e) => setWhatsappTemplateName(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:bg-slate-50 dark:disabled:bg-slate-850"
              >
                <option value="welcome_lead_intro">welcome_lead_intro (Utility - Approved)</option>
                <option value="site_visit_reminder_2h">site_visit_reminder_2h (Utility - Approved)</option>
                <option value="property_brochure_dispatch">property_brochure_dispatch (Marketing - Opt-in)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                n8n Outbound Webhook URL
              </label>
              <input
                type="url"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                disabled={!isOwner}
                placeholder="https://n8n.youragency.com/webhook/propstackly-new-lead"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                FastAPI posts `lead.created` event with lead contact & template parameters to this endpoint.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Webhook Secret Key (HMAC-SHA256 Signing)
              </label>
              <input
                type="password"
                value={n8nWebhookSecret}
                onChange={(e) => setN8nWebhookSecret(e.target.value)}
                disabled={!isOwner}
                placeholder={hasWebhookSecret ? "•••••••••••••••••••••••••••••••• (Secret configured)" : "Enter secret key for webhook verification"}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:bg-slate-50 dark:disabled:bg-slate-850"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to compute the `X-PropStackly-Signature` header. Never exposed to browser scripts.
              </p>
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !n8nWebhookUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Webhook className="w-3.5 h-3.5" />
                  {isTestingWebhook ? "Pinging Webhook..." : "Test Webhook Connection"}
                </button>

                <a
                  href="/propstackly_whatsapp_n8n_workflow.json"
                  download="propstackly_whatsapp_n8n_workflow.json"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#EE6427] bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors cursor-pointer"
                  title="Download ready-to-import n8n workflow file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download n8n Workflow JSON</span>
                </a>
              </div>

              {testWebhookResult && (
                <div
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                    testWebhookResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {testWebhookResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>
                    {testWebhookResult.message}
                    {testWebhookResult.latency ? ` (${testWebhookResult.latency}ms)` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Compliance & Safety Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 space-y-2 mt-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Shield className="w-4 h-4 text-[#EE6427]" />
              <span>Official WhatsApp Business Platform Requirements</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              <li>
                <strong className="text-slate-800 dark:text-slate-100">Meta Business Verification:</strong> Requires validated FBR NTN certificate and official Pakistani business documentation.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-100">24-Hour Messaging Policy:</strong> Outbound business-initiated conversations require pre-approved Meta message templates.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-100">Truth-in-Messaging:</strong> Dispatched messages remain marked as &quot;delivered to queue&quot; and only transition to &quot;confirmed&quot; when Meta returns a successful message receipt callback.
              </li>
            </ul>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isOwner ? (
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#EE6427] hover:bg-[#DE5518] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
          ) : (
            <div
              title="Agency settings can only be saved by the Agency Owner"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Save Changes (Owner Only)
            </div>
          )}
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore Initial Demo Dataset?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will restore all default mock leads, properties in DHA & Bahria, scheduled visits,
              and agents to their fresh starting state.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Yes, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
