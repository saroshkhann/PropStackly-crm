"use client";

import React, { useState } from "react";
import { useCRM } from "@/context/CRMContext";
import { CurrencyCode, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { ChevronDown, Globe, Info } from "lucide-react";

interface CurrencySelectorProps {
  compact?: boolean;
  className?: string;
  onChangeOverride?: (curr: CurrencyCode) => void;
  activeOverride?: CurrencyCode;
}

export function CurrencySelector({
  compact = false,
  className = "",
  onChangeOverride,
  activeOverride,
}: CurrencySelectorProps) {
  const { activeCurrency: ctxCurrency, setActiveCurrency: ctxSetCurrency } = useCRM();
  const [isOpen, setIsOpen] = useState(false);

  const activeCurrency = activeOverride || ctxCurrency;
  const setActiveCurrency = onChangeOverride || ctxSetCurrency;

  const currentMeta = SUPPORTED_CURRENCIES[activeCurrency];

  const currencies: CurrencyCode[] = ["PKR", "USD", "GBP", "AED", "SAR"];

  if (compact) {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          title={`Active Currency: ${currentMeta.name}`}
        >
          <span className="text-sm leading-none">{currentMeta.flag}</span>
          <span>{currentMeta.code}</span>
          <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-1.5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Interbank Rates</span>
                <Globe className="w-3 h-3" />
              </div>
              <div className="pt-1 space-y-0.5">
                {currencies.map((code) => {
                  const m = SUPPORTED_CURRENCIES[code];
                  const isSel = activeCurrency === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setActiveCurrency(code);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSel
                          ? "bg-orange-50 dark:bg-orange-950/40 text-[#DE5518] dark:text-orange-400 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">{m.flag}</span>
                        <span>{m.code}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          ({m.symbol})
                        </span>
                      </span>
                      {code !== "PKR" && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Rs. {m.rateToPKR}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full segmented button pill mode
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {currencies.map((code) => {
        const m = SUPPORTED_CURRENCIES[code];
        const isSel = activeCurrency === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setActiveCurrency(code)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isSel
                ? "bg-white dark:bg-slate-700 text-[#EE6427] dark:text-orange-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
            title={`${m.name} (${m.symbol})`}
          >
            <span>{m.flag}</span>
            <span>{code}</span>
          </button>
        );
      })}
    </div>
  );
}
