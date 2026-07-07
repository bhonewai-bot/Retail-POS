"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import type { NavItem } from "./nav-links";

interface AppHeaderProps {
  navItems: NavItem[];
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

const segmentLabels: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  new: "New Product",
  edit: "Edit Product",
  pos: "POS Terminal",
};

function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Root: just show Dashboard
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "admin")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/admin" />}>
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.slice(1).map((segment, index) => {
          const realIndex = index + 1;
          const href = "/" + segments.slice(0, realIndex + 1).join("/");
          const label = segmentLabels[segment] || segment;
          const isLast = index === segments.slice(1).length - 1;

          return (
            <BreadcrumbItem key={href}>
              <BreadcrumbSeparator />
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={href} />}>
                  {label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppHeader({ navItems, user, onLogout }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="lg:hidden" />
          }
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <AppSidebar
            navItems={navItems}
            user={user}
            onLogout={onLogout}
          />
        </SheetContent>
      </Sheet>

      <AppBreadcrumb />

      <div className="flex-1" />
    </header>
  );
}
