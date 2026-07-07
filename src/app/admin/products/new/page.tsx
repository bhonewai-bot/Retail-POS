'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ProductForm } from '@/components/product-form';

interface Category {
  id: number;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '0',
    cost: '',
    categoryId: '',
    stock: '0',
    lowStockThreshold: '10',
    barcode: '',
    isActive: true,
  });

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleCategoryChange(value: string) {
    setFormData((prev) => ({ ...prev, categoryId: value === 'none' ? '' : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) { setError('Name is required'); return; }
    if (!formData.sku.trim()) { setError('SKU is required'); return; }
    if (Number(formData.price) <= 0) { setError('Price must be greater than 0'); return; }

    setSubmitting(true);
    try {
      const body = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description || undefined,
        price: Number(formData.price),
        cost: formData.cost ? Number(formData.cost) : undefined,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        stock: Number(formData.stock),
        lowStockThreshold: Number(formData.lowStockThreshold),
        barcode: formData.barcode || undefined,
        isActive: formData.isActive,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.status === 409) { setError('SKU already exists'); return; }
      if (!res.ok) { setError(data.error || 'Failed to create product'); return; }
      router.push('/admin/products');
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <ProductForm
      mode="create"
      categories={categories}
      error={error}
      submitting={submitting}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onCategoryChange={handleCategoryChange}
      onActiveChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
    />
  );
}
