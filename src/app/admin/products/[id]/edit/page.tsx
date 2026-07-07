'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ProductForm } from '@/components/product-form';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: number;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }

      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/categories'),
        ]);

        if (productRes.status === 404) {
          setNotFound(true);
          return;
        }

        const product = await productRes.json();
        const catsData = await categoriesRes.json();

        setInitialData({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          price: Number(product.price) || 0,
          cost: product.cost ? Number(product.cost) : '',
          categoryId: product.categoryId?.toString() || '',
          stock: product.stock ?? 0,
          lowStockThreshold: product.lowStockThreshold ?? 10,
          barcode: product.barcode || '',
          isActive: product.isActive ?? true,
        });

        setCategories(catsData.categories || []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, productId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-foreground">Product not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Product
        </h1>
        <p className="text-sm text-muted-foreground">
          Update product information
        </p>
      </div>
      {initialData && (
        <ProductForm
          mode="edit"
          productId={productId as string}
          initialData={initialData}
          categories={categories}
        />
      )}
    </div>
  );
}
