'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { authClient } from '@/lib/auth-client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

function getStatusBadge(product: Product) {
  if (!product.isActive) {
    return <Badge variant="secondary">Inactive</Badge>;
  }
  if (product.stock === 0) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        Out of Stock
      </Badge>
    );
  }
  if (product.stock <= 10) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        Low Stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
      Active
    </Badge>
  );
}

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

  const fetchProducts = useCallback(async (page: number) => {
    try {
      const res = await fetch(`/api/products?page=${page}&pageSize=20`);
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
    setLoading(true);
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
        toast.success('Product deactivated', {
          description: 'The product has been marked as inactive.',
        });
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

  const columns: ColumnDef<Product, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground sm:hidden">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue() as string}
          </span>
        ),
        meta: { className: 'hidden sm:table-cell' },
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) => row.category?.name || '—',
        meta: { className: 'hidden md:table-cell' },
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-right">Price</div>,
        cell: ({ getValue }) => (
          <div className="text-right font-medium">
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
              'text-right',
              stock === 0 && 'text-red-600 font-medium',
              stock > 0 && stock <= 10 && 'text-amber-600 font-medium'
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
        cell: ({ row }) => getStatusBadge(row.original),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex items-center justify-center size-8 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {product.isActive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeactivateId(product.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        skeletonRows={5}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
            <span className="hidden sm:inline"> · {pagination.total} products</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      <AlertDialog open={deactivateId !== null} onOpenChange={() => setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this product? It will no longer
              appear in the product list for cashiers.
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
    </div>
  );
}
