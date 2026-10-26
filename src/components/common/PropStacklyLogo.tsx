import React from "react";
import Image from "next/image";

interface PropStacklyLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  variant?: "image" | "svg";
  priority?: boolean;
}

/**
 * PropStackly Brand Vector SVG Mark
 * Accurately replicates the three stacked growth chevrons in brand orange (#EE6427 / #FB913B)
 * on a dark squircle tile (#0F1623).
 */
export function PropStacklyLogoIcon({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs select-none ${className}`}
      aria-label="PropStackly Logo"
    >
      <defs>
        <linearGradient id="propstackly-orange" x1="512" y1="175" x2="512" y2="831" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB913B" />
          <stop offset="100%" stopColor="#EE6427" />
        </linearGradient>
      </defs>

      {/* Dark Squircle Tile */}
      <rect width="1024" height="1024" rx="220" ry="220" fill="#0F1623" />

      {/* Top Stack Chevron */}
      <path
        d="M 244 402 L 512 226 L 780 402"
        stroke="url(#propstackly-orange)"
        strokeWidth="103"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle Stack Chevron */}
      <path
        d="M 244 590 L 512 414 L 780 590"
        stroke="url(#propstackly-orange)"
        strokeWidth="103"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Stack Chevron */}
      <path
        d="M 244 778 L 512 602 L 780 778"
        stroke="url(#propstackly-orange)"
        strokeWidth="103"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Main PropStackly Logo Component
 * Defaults to rendering the authentic 1024x1024 uploaded brand asset with Next.js optimization.
 */
export default function PropStacklyLogo({
  size = 36,
  className = "",
  showText = false,
  textClassName = "",
  subtitle = "Real Estate Suite",
  variant = "image",
  priority = false,
}: PropStacklyLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0 overflow-hidden rounded-[22%] shadow-xs"
        style={{ width: size, height: size }}
      >
        {variant === "svg" ? (
          <PropStacklyLogoIcon size={size} />
        ) : (
          <Image
            src="/propstackly-logo.png"
            alt="PropStackly Logo"
            width={size}
            height={size}
            priority={priority}
            className="w-full h-full object-cover select-none"
          />
        )}
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-black tracking-tight leading-tight text-slate-950 dark:text-white ${
              textClassName || "text-lg"
            }`}
          >
            PropStackly.
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
