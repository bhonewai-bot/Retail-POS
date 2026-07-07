'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { authClient } from '@/lib/auth-client';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable, StatusBadge } from '@/components/ui/data-table';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: number;
  isActive: boolean;
}

interface Stats {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  categoryCount: number;
}

function getStatus(product: Product) {
  if (!product.isActive) return { variant: "inactive" as const, label: "Inactive" };
  if (product.stock === 0) return { variant: "out-of-stock" as const, label: "Out of Stock" };
  if (product.stock <= 10) return { variant: "low-stock" as const, label: "Low Stock" };
  return { variant: "active" as const, label: "Active" };
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }

      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?pageSize=100'),
          fetch('/api/categories'),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        const products = productsData.products || [];
        setStats({
          totalProducts: products.length,
          activeProducts: products.filter((p: Product) => p.isActive).length,
          lowStockCount: products.filter((p: Product) => p.stock <= 10 && p.stock > 0).length,
          categoryCount: (categoriesData.categories || []).length,
        });
        setRecentProducts(products.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const statCards = stats
    ? [
        { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-primary' },
        { label: 'Active Products', value: stats.activeProducts, icon: CheckCircle2, color: 'text-emerald-600' },
        { label: 'Low Stock', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-amber-600' },
        { label: 'Categories', value: stats.categoryCount, icon: Tag, color: 'text-violet-600' },
      ]
    : [];

  const columns: ColumnDef<Product, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-right">Price</div>,
        cell: ({ getValue }) => (
          <div className="text-right text-sm font-medium tabular-nums">
            ${Number(getValue() as string).toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'stock',
        header: () => <div className="text-right">Stock</div>,
        cell: ({ getValue }) => (
          <div className="text-right text-sm tabular-nums">{getValue() as number}</div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { variant, label } = getStatus(row.original);
          return <StatusBadge variant={variant} label={label} />;
        },
      },
    ],
    []
  );

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your store inventory"
        actions={
          <Link href="/admin/products" className={buttonVariants({ size: 'sm' })}>
            View Products
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.label} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent Products — uses shared DataTable */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Recent Products</h2>
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <DataTable
          columns={columns}
          data={recentProducts}
          loading={loading}
          skeletonRows={5}
          onRowClick={(product) => router.push(`/admin/products/${product.id}/edit`)}
        />
      </div>
    </PageContainer>
  );
}
