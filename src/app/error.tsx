"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PropStackly App Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 font-bold text-xl">
          !
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Application Error</h2>
        <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 break-words mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.stack && (
          <details className="mb-4 text-[11px] text-slate-400">
            <summary className="cursor-pointer hover:text-slate-300">View stack trace</summary>
            <pre className="mt-2 p-2 bg-slate-950 rounded text-[10px] overflow-auto max-h-40 font-mono">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-2 px-4 bg-[#EE6427] hover:bg-[#DE5518] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.clear();
                window.location.href = "/dashboard";
              }
            }}
            className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Clear Cache & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
