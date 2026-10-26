"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import PropStacklyLogo from "@/components/common/PropStacklyLogo";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordLoadingShell />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordLoadingShell() {
  return (
    <div
      style={{ backgroundColor: "#FAF8F5" }}
      className="min-h-screen flex items-center justify-center dark:!bg-[#0B0F19]"
    >
      <div className="w-8 h-8 border-2 border-[#EE6427] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const [step, setStep] = useState<1 | 2 | 3>(tokenParam ? 2 : 1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(tokenParam || "");
  const [emailDispatchedNotice, setEmailDispatchedNotice] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If token arrives in URL query params, jump directly to step 2
  useEffect(() => {
    if (tokenParam) {
      setResetToken(tokenParam);
      setStep(2);
    }
  }, [tokenParam]);

  // Real-time password strength validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?~`]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  // Step 1: Request Password Reset Email (Returns generic response to prevent account enumeration)
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.auth.forgotPassword(email.trim());
      setEmailDispatchedNotice(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit New Password with single-use Token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      setErrorMessage("Reset token is required. Please check your reset link or enter your token.");
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage("Password must satisfy all security requirements (8+ characters, uppercase, lowercase, number, and special symbol).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.auth.resetPassword(resetToken.trim(), newPassword);
      setStep(3);
      setTimeout(() => {
        router.push("/login");
      }, 3500);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to reset password. The link may have expired or was already used."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: "#FAF8F5" }}
      className="min-h-screen flex flex-col dark:!bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-[#EE6427]/20 relative overflow-x-hidden"
    >
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between z-20">
        <Link href="/login" className="flex items-center gap-3">
          <PropStacklyLogo
            size={42}
            priority
            showText
            textClassName="text-2xl sm:text-[26px]"
            subtitle=""
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
          <ThemeToggle variant="circular" />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        <div
          style={{
            maxWidth: 450,
            width: "100%",
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
          }}
          className="bg-white dark:!bg-[#151B28] rounded-[32px] p-8 sm:p-10 relative z-10 transition-all border border-slate-100/80 dark:!border-slate-800"
        >
          {/* Header Title */}
          <div className="mb-6">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#EE6427] flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-950 dark:text-white leading-[1.2] tracking-tight">
              {step === 1 && "Password Recovery"}
              {step === 2 && "Set New Password"}
              {step === 3 && "Password Updated"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
              {step === 1 && "Enter your registered email address. If an account exists, a secure verified reset link will be sent to your inbox."}
              {step === 2 && "Configure your new secure password below. Password reset links expire after 15 minutes and can only be used once."}
              {step === 3 && "Your password has been successfully updated. All prior active sessions have been signed out."}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* STEP 1: Enter Email & Generic Response */}
          {step === 1 && (
            <div>
              {emailDispatchedNotice ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Instructions Dispatched</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                      If an account associated with <strong>{email}</strong> exists in our system, password reset instructions and a verified link have been dispatched.
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Please check your inbox (and spam folder). Click the link in the email to set your new password.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Already have a reset link or token? Click here
                    </button>

                    <Link
                      href="/login"
                      className="text-xs text-center text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium transition-colors py-1"
                    >
                      Return to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestToken} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registered Login Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="agent@agency.pk"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/30 focus:border-[#EE6427] dark:text-white"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      To protect user privacy, a generic response is returned regardless of account status.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      backgroundColor: "#EE6427",
                      color: "#FFFFFF",
                      boxShadow: "0 10px 25px -5px rgba(238, 100, 39, 0.4)",
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl hover:opacity-95 font-semibold text-sm transition-all disabled:opacity-70 flex items-center justify-center cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Processing Request...
                      </span>
                    ) : (
                      "Send Password Reset Email"
                    )}
                  </button>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <Link
                      href="/login"
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Remember your password? Sign in
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Set New Password & Token Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                {/* Reset Token Input (Hidden if provided via query params or editable) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Verification Reset Token *</span>
                    {tokenParam && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Verified from email link
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Paste your reset token from email"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/30 focus:border-[#EE6427] dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Secure Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/30 focus:border-[#EE6427] dark:text-white font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Password Requirements:</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber && hasSpecial ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                      {hasNumber && hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number & symbol
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 focus:outline-hidden focus:ring-2 focus:ring-[#EE6427]/30 focus:border-[#EE6427] dark:text-white font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
                  style={{
                    backgroundColor: "#EE6427",
                    color: "#FFFFFF",
                    boxShadow: "0 10px 25px -5px rgba(238, 100, 39, 0.4)",
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl hover:opacity-95 font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Updating Password...
                    </span>
                  ) : (
                    "Reset Password & Invalidate Old Sessions"
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Request a new reset link
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Reset Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your credentials have been securely updated. All previous active sessions across all devices have been signed out.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs transition-opacity hover:opacity-90 shadow-sm"
              >
                Sign In With New Password
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        © 2026 PropStackly CRM • Enterprise Security
      </footer>
    </div>
  );
}
