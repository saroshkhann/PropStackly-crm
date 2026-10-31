"use client";

import React, { useState } from "react";
import { CRMProvider } from "@/context/CRMContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastContainer } from "../ui/ToastContainer";
import { AddLeadModal } from "../leads/AddLeadModal";
import { TrialExpiredBanner } from "../trial/TrialExpiredBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  return (
    <CRMProvider>
      <div className="flex h-screen overflow-hidden bg-[#F7F7F5] dark:bg-[#0E1217] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Topbar */}
          <Topbar
            onMobileOpen={() => setMobileSidebarOpen(true)}
            onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
          />

          {/* Sticky Trial Expired Banner */}
          <TrialExpiredBanner />

          {/* Main scrollable body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F7F7F5] dark:bg-[#0E1217] transition-colors duration-200">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>

        {/* Global Notifications */}
        <ToastContainer />

        {/* Global New Lead Modal */}
        <AddLeadModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
        />
      </div>
    </CRMProvider>
  );
}
