import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PageContainer — wraps all admin page content.
 * Provides consistent vertical spacing between sections.
 *
 * Usage:
 * <PageContainer>
 *   <PageHeader ... />
 *   <div>toolbar</div>
 *   <DataTable ... />
 * </PageContainer>
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
