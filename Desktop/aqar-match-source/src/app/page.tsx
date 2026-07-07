"use client";

import { useState } from "react";
import { Header, NavKey } from "@/components/platform/Header";
import { Footer } from "@/components/platform/Footer";
import { HomePage } from "@/components/platform/HomePage";
import { PublishFlow } from "@/components/platform/PublishFlow";
import { SearchFlow } from "@/components/platform/SearchFlow";
import {
  AccountPage,
  DashboardPage,
} from "@/components/platform/AccountDashboard";
import { LoginPage } from "@/components/platform/LoginPage";
import { AuthProvider } from "@/components/platform/AuthContext";

type View = NavKey | "login";

export default function Home() {
  const [view, setView] = useState<View>("home");

  const goHome = () => setView("home");

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header current={view === "login" ? "account" : view} onNavigate={(k) => setView(k)} />

        <div className="flex-1">
          {view === "home" && (
            <HomePage
              onStartPublish={() => setView("publish")}
              onStartSearch={() => setView("search")}
            />
          )}
          {view === "publish" && <PublishFlow onBackHome={goHome} />}
          {view === "search" && <SearchFlow onBackHome={goHome} />}
          {view === "account" && (
            <AccountPage
              onGoToLogin={() => setView("login")}
              onGoToPublish={() => setView("publish")}
              onGoToSearch={() => setView("search")}
            />
          )}
          {view === "dashboard" && <DashboardPage />}
          {view === "login" && (
            <LoginPage
              onBackHome={goHome}
              onAuthSuccess={(role) => {
                // توجيه ذكي حسب الدور
                setView(role === "owner" ? "dashboard" : "search");
              }}
            />
          )}
        </div>

        <Footer />
      </div>
    </AuthProvider>
  );
}
