import React, { Suspense } from "react";
import { initialLeads } from "@/data/mockData";
import { LeadDetailClient } from "./LeadDetailClient";

export function generateStaticParams() {
  return initialLeads.map((lead) => ({
    id: lead.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const resolved = await params;

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading lead record...
        </div>
      }
    >
      <LeadDetailClient leadId={resolved.id} />
    </Suspense>
  );
}
