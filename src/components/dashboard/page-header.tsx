import { type ReactNode } from "react";

/**
 * PageHeader — consistent page title area across all admin pages.
 *
 * Layout: stacks on mobile, row on desktop.
 * Always: title (h1) + optional description + optional actions.
 *
 * Usage:
 * <PageHeader
 *   title="Products"
 *   description="Manage your product catalog"
 *   actions={<Button>Add Product</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
