'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { authClient } from '@/lib/auth-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, StatusBadge, DataTablePagination } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  Package,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  cost: string | null;
  stock: number;
  isActive: boolean;
  categoryId: number | null;
  category: Category | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

// ─── Status Logic ────────────────────────────────────────────────

function getProductStatus(product: Product): { variant: "active" | "inactive" | "low-stock" | "out-of-stock"; label: string } {
  if (!product.isActive) return { variant: "inactive", label: "Inactive" };
  if (product.stock === 0) return { variant: "out-of-stock", label: "Out of Stock" };
  if (product.stock <= 10) return { variant: "low-stock", label: "Low Stock" };
  return { variant: "active", label: "Active" };
}

// ─── Page ────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalPages: 0,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchProducts = useCallback(async (page: number, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setProducts(data.products);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        totalPages: 1,
        total: data.products.length,
      }));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }

      const [catsRes] = await Promise.all([fetch('/api/categories')]);
      const catsData = await catsRes.json();
      setCategories(catsData.categories || []);
      fetchProducts(1);
    }
    init();
  }, [router, fetchProducts]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim() === '') {
      fetchProducts(1);
      return;
    }
    debounceTimer.current = setTimeout(() => searchProducts(value), 300);
  }

  async function handleDeactivate() {
    if (!deactivateId) return;
    try {
      const res = await fetch(`/api/products/${deactivateId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === deactivateId ? { ...p, isActive: false } : p))
        );
        toast.success('Product deactivated');
      }
    } catch {
      toast.error('Failed to deactivate product');
    } finally {
      setDeactivateId(null);
    }
  }

  const filteredProducts = categoryFilter === 'all'
    ? products
    : products.filter((p) => p.categoryId === Number(categoryFilter));

  const activeFilters = [
    searchQuery && { label: 'Search: "' + searchQuery + '"', onClear: () => { setSearchQuery(''); fetchProducts(1); } },
    categoryFilter !== 'all' && {
      label: categories.find((c) => c.id === Number(categoryFilter))?.name || categoryFilter,
      onClear: () => setCategoryFilter('all'),
    },
  ].filter(Boolean) as { label: string; onClear: () => void }[];

  const columns: ColumnDef<Product, unknown>[] = useMemo(
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
        accessorKey: 'price',
        header: () => <div className="text-right">Price</div>,
        cell: ({ getValue }) => (
          <div className="text-right text-sm font-semibold tabular-nums">
            ${Number(getValue() as string).toFixed(2)}
          </div>
        ),
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
        meta: { className: 'hidden sm:table-cell' },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { variant, label } = getProductStatus(row.original);
          return <StatusBadge variant={variant} label={label} />;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                  'opacity-0 group-hover:opacity-100'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); router.push(`/admin/products/${product.id}/edit`); }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {product.isActive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={(e) => { e.stopPropagation(); setDeactivateId(product.id); }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your product catalog"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(pagination.page, pagination.pageSize)}
            >
              <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Link href="/admin/products/new" className={buttonVariants({ size: 'sm' })}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Product
            </Link>
          </>
        }
      />

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

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-44"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <Separator orientation="vertical" className="hidden sm:block h-6" />

        {/* Export */}
        <Button variant="outline" size="sm" className="h-9">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={filter.onClear}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {filter.label}
              <span className="ml-0.5 text-muted-foreground">&times;</span>
            </button>
          ))}
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter('all'); fetchProducts(1); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        skeletonRows={8}
        onRowClick={(product) => router.push(`/admin/products/${product.id}/edit`)}
      />

      {/* Pagination */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <DataTablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(p) => fetchProducts(p, pagination.pageSize)}
          onPageSizeChange={(size) => fetchProducts(1, size)}
        />
      </div>

      {/* Deactivate Confirmation */}
      <AlertDialog open={deactivateId !== null} onOpenChange={() => setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Product</AlertDialogTitle>
            <AlertDialogDescription>
              This product will no longer appear in the POS terminal for cashiers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
