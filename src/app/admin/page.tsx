'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
        const setStatsFn: Stats = {
          totalProducts: products.length,
          activeProducts: products.filter((p: Product) => p.isActive).length,
          lowStockCount: products.filter((p: Product) => p.stock <= 10 && p.stock > 0).length,
          categoryCount: (categoriesData.categories || []).length,
        };

        setStats(setStatsFn);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your store inventory
          </p>
        </div>
        <Link href="/admin/products" className={buttonVariants()}>
          View Products
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

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

      {/* Recent Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Products</CardTitle>
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-foreground">No products yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first product to get started
              </p>
              <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
                Add Product
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {product.sku}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(product.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !product.isActive
                            ? 'secondary'
                            : product.stock === 0
                            ? 'destructive'
                            : product.stock <= 10
                            ? 'outline'
                            : 'default'
                        }
                        className={
                          product.isActive && product.stock > 10
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : product.isActive && product.stock <= 10 && product.stock > 0
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : ''
                        }
                      >
                        {!product.isActive
                          ? 'Inactive'
                          : product.stock === 0
                          ? 'Out of Stock'
                          : product.stock <= 10
                          ? 'Low Stock'
                          : 'Active'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
