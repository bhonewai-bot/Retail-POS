"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  admin: "Admin",
  products: "Products",
  new: "New Product",
  edit: "Edit Product",
  pos: "POS Terminal",
};

function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

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
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const label = segmentLabels[segment] || segment;
          const isLast = index === segments.length - 1;

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

      {/* Desktop sidebar toggle (visual consistency) */}
      <div className="hidden lg:block">
        <AppBreadcrumb />
      </div>

      {/* Mobile: just show current page */}
      <div className="lg:hidden">
        <AppBreadcrumb />
      </div>

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:flex" })}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
