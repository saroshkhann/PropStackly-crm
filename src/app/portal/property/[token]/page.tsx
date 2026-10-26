import React, { Suspense } from "react";
import { PortalPageClient } from "./PortalPageClient";

export function generateStaticParams() {
  return [{ token: "preview" }];
}

interface PageProps {
  params: Promise<{ token: string }>;
}

async function PortalWrapper({
  paramsPromise,
}: {
  paramsPromise: Promise<{ token: string }>;
}) {
  const { token } = await paramsPromise;
  return <PortalPageClient token={token} />;
}

export default function PropertyPortalPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading property dossier...
        </div>
      }
    >
      <PortalWrapper paramsPromise={params} />
    </Suspense>
  );
}
