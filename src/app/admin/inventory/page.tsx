'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, StatusBadge, DataTablePagination } from '@/components/ui/data-table';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';
import AdjustmentDialog from '@/components/inventory/adjustment-dialog';
import AdjustmentHistory from '@/components/inventory/adjustment-history';
import { cn } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  category: { id: number; name: string } | null;
  price: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

// ─── Stock Status Logic ──────────────────────────────────────────

function getStockStatus(product: InventoryProduct): { variant: 'active' | 'low-stock' | 'out-of-stock'; label: string } {
  if (product.stock === 0) return { variant: 'out-of-stock', label: 'Out of Stock' };
  if (product.stock >= 1 && product.stock <= 10) return { variant: 'low-stock', label: 'Low Stock' };
  return { variant: 'active', label: 'Healthy' };
}

// ─── Page ────────────────────────────────────────────────────────

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalPages: 0,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchInventory = useCallback(async (page: number, pageSize = 20) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (lowStockFilter) params.set('lowStock', 'true');

      const res = await fetch(`/api/inventory?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, lowStockFilter]);

  // Auth guard
  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }
      fetchInventory(1);
    }
    init();
  }, [router, fetchInventory]);

  // Refetch when lowStockFilter changes
  useEffect(() => {
    async function refetch() {
      await fetchInventory(1);
    }
    refetch();
  }, [lowStockFilter, fetchInventory]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim() === '') {
      fetchInventory(1);
      return;
    }
    debounceTimer.current = setTimeout(() => fetchInventory(1), 300);
  }

  function handleLowStockToggle() {
    setLowStockFilter((prev) => !prev);
  }

  const columns: ColumnDef<InventoryProduct, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
              {row.original.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {row.original.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        accessorFn: (row) => row.category?.name || '—',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() as string}</span>
        ),
        meta: { className: 'hidden md:table-cell' },
      },
      {
        accessorKey: 'stock',
        header: () => <div className="text-right">Stock</div>,
        cell: ({ getValue }) => {
          const stock = getValue() as number;
          return (
            <div className={cn(
              'text-right text-sm font-medium tabular-nums',
              stock === 0 && 'text-red-600',
              stock > 0 && stock <= 10 && 'text-amber-600'
            )}>
              {stock}
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { variant, label } = getStockStatus(row.original);
          return <StatusBadge variant={variant} label={label} />;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProduct(row.original);
              setAdjustDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adjust
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Monitor and adjust stock levels"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'stock' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('stock')}
        >
          Stock Levels
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('history')}
        >
          Adjustment History
        </Button>
      </div>

      {activeTab === 'stock' && (
        <>
          {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 pl-9 pr-4 text-sm bg-background"
          />
        </div>

        {/* Low Stock Toggle */}
        <Button
          variant={lowStockFilter ? 'default' : 'outline'}
          size="sm"
          onClick={handleLowStockToggle}
        >
          Show Low Stock Only
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        skeletonRows={8}
      />

      {/* Pagination */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <DataTablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(p) => fetchInventory(p, pagination.pageSize)}
          onPageSizeChange={(size) => fetchInventory(1, size)}
        />
      </div>
        </>
      )}

      {activeTab === 'history' && (
        <AdjustmentHistory />
      )}

      <AdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        product={
          selectedProduct
            ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                sku: selectedProduct.sku,
                stock: selectedProduct.stock,
              }
            : null
        }
        onAdjustmentCreated={() => {
          fetchInventory(pagination.page, pagination.pageSize);
          setAdjustDialogOpen(false);
          setSelectedProduct(null);
        }}
      />
    </PageContainer>
  );
}
