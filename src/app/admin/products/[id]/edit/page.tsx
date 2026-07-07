'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ProductForm } from '@/components/product-form';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    categoryId: '',
    stock: '',
    lowStockThreshold: '',
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
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/categories'),
        ]);

        if (productRes.status === 404) { setNotFound(true); return; }

        const product = await productRes.json();
        const catsData = await categoriesRes.json();

        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          price: product.price || '',
          cost: product.cost || '',
          categoryId: product.categoryId?.toString() || '',
          stock: product.stock?.toString() || '0',
          lowStockThreshold: product.lowStockThreshold?.toString() || '10',
          barcode: product.barcode || '',
          isActive: product.isActive ?? true,
        });

        setCategories(catsData.categories || []);
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, productId]);

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

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.status === 409) { setError('SKU already exists'); return; }
      if (!res.ok) { setError(data.error || 'Failed to update product'); return; }
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

  if (notFound) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Product not found</p></div>;
  }

  return (
    <ProductForm
      mode="edit"
      productId={productId as string}
      initialData={formData}
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
