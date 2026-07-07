import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LoadingSpinner — consistent full-page or section loading indicator.
 *
 * Used in: admin layout, POS page, any auth-gated page.
 *
 * Usage:
 * <LoadingSpinner />                    // full-screen centered
 * <LoadingSpinner className="py-24" />  // within a container
 */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[200px]",
        className
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
