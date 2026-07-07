'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

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
      if (!data) {
        router.push('/login');
        return;
      }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') {
        router.push('/pos');
        return;
      }

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.sku.trim()) {
      setError('SKU is required');
      return;
    }
    if (Number(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

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

      if (res.status === 409) {
        setError('SKU already exists');
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Failed to update product');
        return;
      }

      router.push('/admin/products');
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU *</label>
            <input
              id="sku"
              name="sku"
              type="text"
              required
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price *</label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Cost</label>
              <input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
              <input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">Barcode</label>
            <input
              id="barcode"
              name="barcode"
              type="text"
              value={formData.barcode}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
