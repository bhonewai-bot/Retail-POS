'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ProductForm } from '@/components/product-form';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/dashboard/loading-spinner';

interface Category {
  id: number;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }

      try {
        const res = await fetch('/api/categories');
        const data2 = await res.json();
        setCategories(data2.categories || []);
      } catch {
        console.error('Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  if (loading) {
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
      />
      <ProductForm mode="create" categories={categories} />
    </PageContainer>
  );
}
