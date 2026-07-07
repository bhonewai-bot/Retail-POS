import { type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — consistent empty/error state across all pages.
 *
 * One icon size, one opacity, one layout, one text hierarchy.
 * Used in tables, grids, and any content area.
 *
 * Usage:
 * <EmptyState
 *   icon={Package}
 *   title="No products found"
 *   description="Add your first product to get started"
 *   action={<Button>Add Product</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-xl bg-muted p-3">
        <Icon className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
