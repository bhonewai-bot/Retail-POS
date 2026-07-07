'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTablePagination } from '@/components/ui/data-table';

// ─── Types ───────────────────────────────────────────────────────

interface Adjustment {
  id: number;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { id: number; name: string; sku: string };
  user: { id: string; name: string };
}

interface AdjustmentHistoryProps {
  productId?: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

const TYPE_LABELS: Record<string, string> = {
  'stock-receipt': 'Stock Receipt',
  damage: 'Damage',
  'count-adjustment': 'Count Adjustment',
  return: 'Return',
  other: 'Other',
};

// ─── Component ───────────────────────────────────────────────────

export default function AdjustmentHistory({ productId }: AdjustmentHistoryProps) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalPages: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAdjustments = useCallback(
    async (page: number, pageSize = 10) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (productId) {
          params.set('productId', String(productId));
        }

        const res = await fetch(`/api/inventory/adjustments?${params.toString()}`);
        const data = await res.json();
        setAdjustments(data.adjustments);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to fetch adjustments:', error);
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    fetchAdjustments(1);
  }, [fetchAdjustments]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (loading && adjustments.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Loading adjustments...</p>
      </div>
    );
  }

  if (!loading && adjustments.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No adjustments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 first:pl-5">
                  Date
                </th>
                {!productId && (
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Product
                  </th>
                )}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Adjusted By
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 last:pr-5">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj, index) => (
                <tr
                  key={adj.id}
                  className={`border-b border-border/30 transition-colors duration-150 ${
                    index % 2 === 1 ? 'bg-muted/20' : ''
                  } hover:bg-accent/50`}
                >
                  <td className="px-4 py-3 first:pl-5 text-sm text-foreground">
                    {formatDate(adj.createdAt)}
                  </td>
                  {!productId && (
                    <td className="px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[160px]">
                          {adj.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {adj.product.sku}
                        </p>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-foreground">
                    {TYPE_LABELS[adj.type] || adj.type}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium tabular-nums">
                    <span className={adj.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {adj.quantity >= 0 ? '+' : ''}{adj.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {adj.user.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground last:pr-5">
                    {adj.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <DataTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={(p) => fetchAdjustments(p, pagination.pageSize)}
          />
        </div>
      )}
    </div>
  );
}
