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
import { StaffPortal } from "./components/portal/StaffPortal";
import { Toaster } from "sonner";

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
          <Events />
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
