'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ProductForm } from '@/components/product-form';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/dashboard/loading-spinner';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Package } from 'lucide-react';

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
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  if (notFound) {
    return (
      <PageContainer>
        <EmptyState
          icon={Package}
          title="Product not found"
          description="The product you're looking for doesn't exist."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Product"
        description="Update product information"
      />
      {initialData && (
        <ProductForm
          mode="edit"
          productId={productId as string}
          initialData={initialData}
          categories={categories}
        />
      )}
    </PageContainer>
  );
}
