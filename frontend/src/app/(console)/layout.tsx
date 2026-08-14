"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { SplitPanelProvider, useSplitPanel } from "@/context/SplitPanelContext";
import { BreadcrumbProvider } from "@/context/BreadcrumbContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TopNav } from "@/components/layout/TopNav";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { RecordSplitPanel } from "@/components/ui/RecordSplitPanel";

// ── Auth Guard: protects all (console) routes ──────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // While session check is in progress → blank to prevent flash
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F2F3F3" }}>
        <span style={{
          display: "block",
          width: 28,
          height: 28,
          border: "3px solid #D5D5D5",
          borderTopColor: "#FF9900",
          borderRadius: "50%",
          animation: "aws-guard-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes aws-guard-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated yet (redirect in flight) → render nothing
  if (!user) return null;

  return <>{children}</>;
}
// ────────────────────────────────────────────────────────────────────────────────

function ConsoleLayoutContent({ children }: { children: React.ReactNode }) {
  const [navigationOpen, setNavigationOpen] = useState(true);
  const { selectedRecord, setSelectedRecord, splitPanelOpen, setSplitPanelOpen } = useSplitPanel();

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F3F3] dark:bg-[#0F1B2A]">
      {/* Top Navigation & Full-Width Breadcrumb Bar */}
      <div id="aws-header">
        <TopNav onToggleSidebar={() => setNavigationOpen(!navigationOpen)} />
        <Breadcrumbs onToggleSidebar={() => setNavigationOpen(!navigationOpen)} />
      </div>

      {/* Cloudscape AppLayout with Side SplitPanel */}
      <div className="flex-1 flex flex-col min-h-0">
        <AppLayout
          headerSelector="#aws-header"
          navigationOpen={navigationOpen}
          onNavigationChange={(e) => setNavigationOpen(e.detail.open)}
          navigation={<Sidebar />}
          content={children}
          splitPanel={
            <RecordSplitPanel
              zoneId={selectedRecord?.hosted_zone_id}
              record={selectedRecord}
              onClose={() => setSelectedRecord(null)}
            />
          }
          splitPanelOpen={splitPanelOpen}
          onSplitPanelToggle={(e) => setSplitPanelOpen(e.detail.open)}
          splitPanelPreferences={{ position: "side" }}
          toolsHide={true}
        />
      </div>

      {/* Bottom Console Footer Bar */}
      <Footer />
    </div>
  );
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SplitPanelProvider>
            <BreadcrumbProvider>
              <AuthGuard>
                <ConsoleLayoutContent>{children}</ConsoleLayoutContent>
              </AuthGuard>
            </BreadcrumbProvider>
          </SplitPanelProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
