"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NavLink, type NavItem } from "./nav-links";

interface AppSidebarProps {
  navItems: NavItem[];
  user: { name: string; email: string; role: string };
  onLogout: () => void;
  headerSlot?: ReactNode;
}

export function AppSidebar({ navItems, user, onLogout, headerSlot }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo + Collapse */}
      <div className="flex h-14 items-center gap-2 border-b px-3">
        {!collapsed && (
          <Link
            href="/admin"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              R
            </div>
            <span className="text-sm font-semibold">Retail POS</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              R
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.role}
              </p>
            </div>
          )}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" onClick={onLogout} />
                }
              >
                <LogOut className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          )}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" onClick={onLogout} />
                }
              >
                <LogOut className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
