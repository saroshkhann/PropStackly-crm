"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Send,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import PropStacklyLogo from "@/components/common/PropStacklyLogo";

export default function LoginPage() {
  return (
    <div
      style={{ backgroundColor: "#FAF8F5" }}
      className="min-h-screen flex flex-col dark:!bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-[#EE6427]/20 relative overflow-x-hidden"
    >
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between z-20">
        {/* Brand Logo & Wordmark */}
        <PropStacklyLogo
          size={42}
          priority
          showText
          textClassName="text-2xl sm:text-[26px]"
          subtitle=""
        />

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Instagram Button */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:scale-105 active:scale-95 transition-all shadow-2xs"
          >
            <InstagramIcon className="w-5 h-5" />
          </a>

          {/* Telegram / Paper Plane Button */}
          <a
            href="https://telegram.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Direct Message"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Send className="w-4 h-4 -rotate-12 translate-x-0.5 -translate-y-0.5" />
          </a>

          {/* Dark / Light Theme Toggle (Matching Circular Button) */}
          <ThemeToggle variant="circular" />
        </div>
      </header>

      {/* Main Hero & Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        {/* Relative Card Composition Wrapper */}
        <div className="relative flex items-center justify-center w-full my-auto">
          {/* Flanking Left Vector Illustration: Character seated on gold cubes */}
          <div className="hidden lg:block absolute right-[calc(50%+210px)] bottom-2 translate-x-14 xl:translate-x-8 z-0 pointer-events-none select-none">
            <LeftCharacterIllustration />
          </div>

          {/* Flanking Right Vector Illustration: Stepped growth podium */}
          <div className="hidden lg:block absolute left-[calc(50%+210px)] bottom-2 -translate-x-12 xl:-translate-x-6 z-0 pointer-events-none select-none">
            <RightPodiumIllustration />
          </div>

          {/* Central Card with STRICT maxWidth to prevent horizontal stretching */}
          <Suspense fallback={<LoginCardShell />}>
            <LoginFormCard />
          </Suspense>
        </div>
      </main>

      {/* Subtle Bottom Bar */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        © 2026 PropStackly CRM • Enterprise Real Estate Management
      </footer>
    </div>
  );
}

/**
 * Interactive Form Card connected to real FastAPI Authentication
 */
function LoginFormCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("admin@propstackly.com");
  const [password, setPassword] = useState("Admin123!");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await api.auth.login(loginEmail, loginPass);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }
    executeLogin(email, password);
  };

  const handlePersonaSelect = (personaEmail: string, personaPass: string) => {
    setEmail(personaEmail);
    setPassword(personaPass);
    executeLogin(personaEmail, personaPass);
  };

  return (
    <div
      style={{
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
      }}
      className="bg-white dark:!bg-[#151B28] rounded-[32px] p-8 sm:p-10 relative z-10 transition-all border border-slate-100/80 dark:!border-slate-800"
    >
      {/* Title & Subtitle */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-[34px] font-bold text-slate-950 dark:text-white leading-[1.15] tracking-tight">
          Welcome Back,
          <br />
          Start Closing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-normal">
          Sign in to your agency portal
        </p>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            {errorMessage.toLowerCase().includes("failed login") && (
              <p className="mt-1 text-[11px] opacity-90">
                Rate limit active: Please wait 60s before trying again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Login / Sign Up Form */}
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        {/* Email Field */}
        <div
          style={{ backgroundColor: "#F4F4F5" }}
          className="rounded-2xl dark:!bg-[#1F2636] border border-transparent focus-within:!border-[#EE6427]/60 focus-within:!bg-white dark:focus-within:!bg-[#1F2636] px-4 py-3.5 flex items-center gap-3 transition-all"
        >
          <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email"
            autoComplete="email"
            className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          />
        </div>

        {/* Password Field */}
        <div
          style={{ backgroundColor: "#F4F4F5" }}
          className="rounded-2xl dark:!bg-[#1F2636] border border-transparent focus-within:!border-[#EE6427]/60 focus-within:!bg-white dark:focus-within:!bg-[#1F2636] px-4 py-3.5 flex items-center gap-3 transition-all"
        >
          <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your Password"
            autoComplete="current-password"
            className="bg-transparent border-0 outline-none text-slate-900 dark:text-white text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium font-mono"
          />
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end pr-1 -mt-1">
          <Link
            href="/forgot-password"
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#EE6427] dark:hover:text-[#EE6427] transition-colors font-medium"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Primary CTA (Terracotta / Orange #EE6427 with explicit inline background) */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: "#EE6427",
            color: "#FFFFFF",
            boxShadow: "0 10px 25px -5px rgba(238, 100, 39, 0.4)",
          }}
          className="w-full mt-2 py-3.5 px-6 rounded-2xl hover:opacity-95 font-semibold text-base active:scale-[0.99] transition-all disabled:opacity-70 flex items-center justify-center cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <Link
          href="/signup"
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>Don&apos;t have an agency account?</span>
          <span className="font-bold text-[#EE6427] hover:underline underline-offset-2">
            Start 3-Day Free Trial →
          </span>
        </Link>
      </div>

      {/* Sleek One-Click Role Demo Logins Drawer */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowDemoDrawer(!showDemoDrawer)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#EE6427] dark:hover:text-[#EE6427] transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#EE6427]" />
            <span>One-Click Role Demo Logins</span>
          </span>
          {showDemoDrawer ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showDemoDrawer && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePersonaSelect("admin@propstackly.com", "Admin123!")}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E2533] hover:bg-orange-50/80 dark:hover:bg-[#EE6427]/15 border border-slate-200 dark:border-slate-700/80 hover:border-[#EE6427]/40 text-left transition-all text-xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427]">
                    Hamza M.
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    Owner
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Apex Properties ISB
                </p>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePersonaSelect("ayesha@propstackly.com", "Agent123!")}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E2533] hover:bg-orange-50/80 dark:hover:bg-[#EE6427]/15 border border-slate-200 dark:border-slate-700/80 hover:border-[#EE6427]/40 text-left transition-all text-xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427]">
                    Ayesha K.
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                    Manager
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sales Director
                </p>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePersonaSelect("bilal@propstackly.com", "Agent123!")}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E2533] hover:bg-orange-50/80 dark:hover:bg-[#EE6427]/15 border border-slate-200 dark:border-slate-700/80 hover:border-[#EE6427]/40 text-left transition-all text-xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427]">
                    Bilal T.
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    Agent
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Assigned Leads Only
                </p>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePersonaSelect("tariq@lahorerealestate.pk", "Lahore123!")}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E2533] hover:bg-orange-50/80 dark:hover:bg-[#EE6427]/15 border border-slate-200 dark:border-slate-700/80 hover:border-[#EE6427]/40 text-left transition-all text-xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#EE6427]">
                    Tariq S.
                  </span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                    Lahore
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Al-Haram Isolation
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Clean Shell placeholder during Next.js client initialization
 */
function LoginCardShell() {
  return (
    <div
      style={{ maxWidth: 420, width: "100%" }}
      className="bg-white dark:bg-[#151B28] rounded-[32px] p-8 sm:p-10 relative z-10 animate-pulse border border-slate-100 dark:border-slate-800"
    >
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24 mb-2" />
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-3" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-56 mb-8" />
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3.5" />
      <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3.5" />
      <div style={{ backgroundColor: "#EE6427" }} className="h-12 rounded-2xl mb-3.5 opacity-40" />
    </div>
  );
}

{/* ============================================================== */}
{/* VECTOR ARTWORK COMPONENTS MATCHING REFERENCE DESIGN             */}
{/* ============================================================== */}

/**
 * Left Illustration: Minimalist ink line art of character on gold cubes with laptop
 */
function LeftCharacterIllustration() {
  return (
    <svg
      width="360"
      height="300"
      viewBox="0 0 360 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      {/* Ground Baseline Line extending across bottom */}
      <line
        x1="10"
        y1="280"
        x2="350"
        y2="280"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />

      {/* Left White Cube with Upward Growth Arrow */}
      <rect
        x="65"
        y="190"
        width="80"
        height="90"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.5"
        className="dark:fill-[#151B28] dark:stroke-slate-400"
      />
      {/* Hand-drawn Growth Arrow inside left cube */}
      <path
        d="M 85 260 C 98 245 108 225 118 205"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />
      <path
        d="M 106 207 L 119 204 L 120 217"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-slate-400"
      />

      {/* Right Yellow Cube (#FBD873) */}
      <rect
        x="145"
        y="155"
        width="72"
        height="125"
        fill="#FBD873"
        stroke="#1E293B"
        strokeWidth="2.5"
        className="dark:stroke-slate-400"
      />

      {/* Character Seated on the Yellow Cube */}
      {/* Radiating Motion Lines above head (\ | /) */}
      <line
        x1="126"
        y1="58"
        x2="114"
        y2="44"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />
      <line
        x1="145"
        y1="50"
        x2="145"
        y2="34"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />
      <line
        x1="162"
        y1="56"
        x2="174"
        y2="42"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />

      {/* Character Hair Bun & Head */}
      <ellipse
        cx="136"
        cy="78"
        rx="8"
        ry="7"
        fill="#1E293B"
        className="dark:fill-slate-200"
      />
      <path
        d="M 132 84 C 126 69 138 60 153 64 C 166 68 172 80 166 94 C 158 96 145 94 132 84 Z"
        fill="#1E293B"
        className="dark:fill-slate-200"
      />
      {/* Face profile line looking towards laptop */}
      <path
        d="M 158 88 C 164 90 167 96 165 102 L 157 106"
        stroke="#1E293B"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="dark:stroke-slate-400"
      />

      {/* Torso: Black Patterned Top with White Brushstrokes */}
      <path
        d="M 140 108 C 150 108 165 108 178 112 C 172 134 168 159 160 172 C 150 172 140 170 135 154 Z"
        fill="#1E293B"
        className="dark:fill-slate-900"
      />
      {/* Pattern tick marks on shirt */}
      <line x1="148" y1="116" x2="152" y2="121" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line x1="162" y1="118" x2="167" y2="124" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line x1="144" y1="134" x2="150" y2="139" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line x1="156" y1="136" x2="162" y2="142" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line x1="148" y1="152" x2="153" y2="157" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      {/* White Pants & Legs */}
      <path
        d="M 145 159 C 160 159 180 162 206 172 C 220 179 228 194 220 219 L 210 244 C 205 256 195 258 190 244 L 195 214 C 185 214 170 209 160 189 C 150 179 142 169 145 159 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.5"
        className="dark:fill-[#151B28] dark:stroke-slate-400"
      />
      {/* Dangling Second Leg behind */}
      <path
        d="M 215 199 C 230 209 235 229 242 249 L 235 254 C 228 239 220 219 210 212 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.5"
        className="dark:fill-[#151B28] dark:stroke-slate-400"
      />

      {/* Shoes (Black stylish pointed boots) */}
      <path
        d="M 188 244 C 188 244 196 262 190 266 C 182 270 178 259 182 250 Z"
        fill="#1E293B"
        className="dark:fill-slate-300"
      />
      <path
        d="M 235 252 C 235 252 248 264 255 260 C 260 256 250 244 240 246 Z"
        fill="#1E293B"
        className="dark:fill-slate-300"
      />

      {/* Left Arm reaching to laptop */}
      <path
        d="M 166 116 C 178 126 195 136 205 148 L 198 152 C 188 142 174 132 164 122 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2"
        className="dark:fill-[#151B28] dark:stroke-slate-400"
      />

      {/* Vibrant Orange Laptop on Lap */}
      <path
        d="M 188 159 L 225 168 L 222 172 L 185 163 Z"
        fill="#EE6427"
      />
      {/* Laptop Screen angled up */}
      <path
        d="M 215 166 L 228 126 L 232 127 L 220 167 Z"
        fill="#EE6427"
      />
    </svg>
  );
}

/**
 * Right Illustration: Stepped growth podium pillars with cloud doodle
 */
function RightPodiumIllustration() {
  return (
    <svg
      width="300"
      height="300"
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      {/* Ground Baseline Line extending across bottom */}
      <line
        x1="10"
        y1="280"
        x2="280"
        y2="280"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />

      {/* Cloud / Foliage Doodle behind the yellow pillar */}
      <path
        d="M 165 220 C 150 195 160 165 185 160 C 190 135 218 125 240 140 C 265 135 282 155 278 180 C 290 200 282 225 260 232 C 265 255 245 272 225 270"
        fill="none"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="dark:stroke-slate-400"
      />

      {/* Left Shorter White Podium */}
      <rect
        x="30"
        y="195"
        width="80"
        height="85"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.5"
        className="dark:fill-[#151B28] dark:stroke-slate-400"
      />

      {/* Right Taller Yellow Podium (#FBD873) */}
      <rect
        x="110"
        y="150"
        width="80"
        height="130"
        fill="#FBD873"
        stroke="#1E293B"
        strokeWidth="2.5"
        className="dark:stroke-slate-400"
      />
    </svg>
  );
}

/**
 * Clean Instagram Outline Icon
 */
function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
