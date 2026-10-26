"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api, { BackendPublicDossier } from "@/lib/api";
import { ClientPortalView } from "./ClientPortalView";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export function PortalPageClient({ token }: { token: string }) {
  const [dossier, setDossier] = useState<BackendPublicDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDossier() {
      try {
        setLoading(true);
        setError(null);
        // Call public share endpoint
        const res = await fetch(`/api/backend/public/share/${token}`);
        if (!res.ok) {
          throw new Error("This exclusive property link is expired or does not exist.");
        }
        const data = await res.json();
        if (isMounted) {
          setDossier(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load property dossier");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      loadDossier();
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-8 h-8 text-[#EE6427] animate-spin mb-3" />
        <h2 className="text-sm font-semibold tracking-wide">
          Loading Exclusive Overseas Property Dossier...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Fetching live interbank exchange rates & verified legal status
        </p>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Dossier Link Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || "This property link may have expired or is no longer accessible."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EE6427] hover:bg-orange-50 dark:hover:bg-orange-950/400 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to PropStackly
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ClientPortalView dossier={dossier} />;
}
