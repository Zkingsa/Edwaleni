/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/home/Hero";
import { Ministries } from "./components/home/Ministries";
import { Events } from "./components/home/Events";
import { AppointmentSection } from "./components/home/AppointmentSection";
import { DonationPortal } from "./components/home/DonationPortal";
import { AboutPastor } from "./components/home/AboutPastor";
import { AuthModal } from "./components/auth/AuthModal";
import { PasswordChangeModal } from "./components/auth/PasswordChangeModal";
import { PasswordSetupModal } from "./components/auth/PasswordSetupModal";
import { StaffPortal } from "./components/portal/StaffPortal";
import { Toaster } from "sonner";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

function SiteErrorReporter() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const report = (message: string, source: string, stack?: string) => {
      void fetch("/api/site-errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, source, stack }),
      }).then(async (response) => {
        if (!response.ok) {
          console.error("Could not submit a site error report:", await response.text());
        }
      }).catch((error: unknown) => {
        console.error("Could not submit a site error report:", error);
      });
    };
    const onError = (event: ErrorEvent) => {
      report(
        event.message || "Uncaught browser error",
        event.filename || window.location.pathname,
        event.error instanceof Error ? event.error.stack : undefined
      );
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      report(
        reason instanceof Error ? reason.message : String(reason ?? "Unhandled promise rejection"),
        window.location.pathname,
        reason instanceof Error ? reason.stack : undefined
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [token]);

  return null;
}

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [staffPortalOpen, setStaffPortalOpen] = useState(false);

  const handleOpenLogin = () => {
    setAuthModalTab("login");
    setAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalTab("register");
    setAuthModalOpen(true);
  };

  return (
    <AuthProvider>
      <SiteErrorReporter />
      <div className="min-h-screen bg-church-cream font-sans selection:bg-church-gold selection:text-white">
        <Navbar 
          onOpenLogin={handleOpenLogin}
          onOpenRegister={handleOpenRegister}
          onOpenStaffPortal={() => setStaffPortalOpen(true)}
        />
        <main>
          <Hero />
          <Ministries />
          <AboutPastor />
          <Events onOpenLogin={handleOpenLogin} />
          <AppointmentSection onOpenLogin={handleOpenLogin} />
          <DonationPortal />
        </main>
        <Footer />

        {/* Authentication Modal (Login / Register) */}
        <AuthModal 
          isOpen={authModalOpen}
          initialTab={authModalTab}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* Forced First-Login Password Change Modal for Default Admin & New Staff */}
        <PasswordChangeModal />
        <PasswordSetupModal />

        {/* Department & Staff RBAC Management Portal */}
        <StaffPortal 
          isOpen={staffPortalOpen}
          onClose={() => setStaffPortalOpen(false)}
        />

        <Toaster position="top-center" richColors />
      </div>
    </AuthProvider>
  );
}
