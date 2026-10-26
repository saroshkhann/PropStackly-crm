"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import PropStacklyLogo from "@/components/common/PropStacklyLogo";

export default function SignupPage() {
  return (
    <div
      style={{ backgroundColor: "#FAF8F5" }}
      className="min-h-screen flex flex-col justify-between dark:!bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-[#EE6427]/20 relative"
    >
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between z-20">
        <PropStacklyLogo
          size={38}
          priority
          showText
          textClassName="text-xl sm:text-2xl"
          subtitle=""
        />

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-[#EE6427] dark:hover:text-[#EE6427] transition-colors"
          >
            Already registered?{" "}
            <span className="text-[#EE6427] dark:text-[#EE6427] underline underline-offset-4 font-bold">
              Sign In
            </span>
          </Link>
          <ThemeToggle variant="circular" />
        </div>
      </header>

      {/* Main Content: Form ONLY in the Middle */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10">
        <div className="w-full max-w-[500px]">
          <Suspense fallback={<SignupCardShell />}>
            <SignupFormCard />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        © 2026 PropStackly CRM • 72-Hour Free Trial for Real Estate Agencies
      </footer>
    </div>
  );
}

function SignupFormCard() {
  const router = useRouter();

  const [agencyName, setAgencyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Islamabad");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const PAKISTANI_CITIES = [
    "Islamabad",
    "Rawalpindi",
    "Lahore",
    "Karachi",
    "Peshawar",
    "Multan",
    "Faisalabad",
    "Gujranwala",
    "Sialkot",
    "Abbottabad",
    "Gwadar",
  ];

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agencyName.trim()) {
      setErrorMessage("Please enter your agency or brokerage name.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (phone.replace(/[^0-9]/g, "").length < 10) {
      setErrorMessage("Please enter a valid Pakistani mobile number (e.g. 0300 1234567).");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-check.");
      return;
    }

    try {
      setIsLoading(true);
      await api.auth.register({
        agency_name: agencyName.trim(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city,
        password,
      });

      // Successful registration & session cookie established
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create agency account.");
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        boxShadow:
          "0 20px 45px -10px rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04)",
      }}
      className="w-full bg-white dark:!bg-[#151B28] rounded-3xl p-6 sm:p-8 relative z-10 transition-all border border-slate-200/90 dark:!border-slate-800"
    >
      {/* Top Header Pill */}
      <div className="flex items-center justify-between mb-5">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/60 text-[#EE6427] dark:text-orange-400 border border-orange-200/70 dark:border-orange-800/80 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          3-Day Free Trial
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          No credit card needed
        </span>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Register Your Agency
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Get instant 72-hour access to all CRM tools and society plot maps.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSignupSubmit} className="space-y-4">
        {/* Agency Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Agency / Brokerage Name
          </label>
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Apex Properties"
              className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Principal Broker Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Managing Broker / Owner Name
          </label>
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Chaudhry Kamran"
              className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Two-Column Grid: Official Email & WhatsApp Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Official Email
            </label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="broker@agency.pk"
                className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              WhatsApp Mobile
            </label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium font-mono"
              />
            </div>
          </div>
        </div>

        {/* Head Office City */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Head Office City
          </label>
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full font-medium cursor-pointer"
            >
              {PAKISTANI_CITIES.map((c) => (
                <option key={c} value={c} className="text-slate-900 dark:text-slate-900 bg-white">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Two-Column Grid: Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password (8+ chars)
            </label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 focus-within:border-[#EE6427] focus-within:ring-2 focus-within:ring-[#EE6427]/15 transition-all">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-xs sm:text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: "#EE6427",
            color: "#FFFFFF",
            boxShadow: "0 10px 25px -5px rgba(238, 100, 39, 0.4)",
          }}
          className="w-full mt-2 py-3.5 px-6 rounded-xl hover:opacity-95 font-bold text-sm sm:text-base active:scale-[0.99] transition-all disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Setting up agency workspace...
            </span>
          ) : (
            <>
              <span>Start 3-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Subtle Microcopy */}
      <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
        By registering, you get 72 hours of full enterprise access. No commitment.
      </p>
    </div>
  );
}

function SignupCardShell() {
  return (
    <div className="w-full max-w-[500px] h-[580px] bg-white dark:bg-[#151B28] rounded-3xl p-8 animate-pulse border border-slate-200 dark:border-slate-800" />
  );
}
