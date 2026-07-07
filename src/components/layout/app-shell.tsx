"use client";

import { type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import type { NavItem } from "./nav-links";

interface AppShellProps {
  navItems: NavItem[];
  user: { name: string; email: string; role: string };
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({ navItems, user, onLogout, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <AppSidebar
        navItems={navItems}
        user={user}
        onLogout={onLogout}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          navItems={navItems}
          user={user}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
