'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

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

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, totalPages: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
      setPagination((prev) => ({ ...prev, page: 1, totalPages: 1, total: data.products.length }));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth check on mount
  useEffect(() => {
    async function checkAuth() {
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
      fetchProducts(1);
    }
    checkAuth();
  }, [router, fetchProducts]);

  // Handle search with debounce
  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setLoading(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim() === '') {
      fetchProducts(1);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  }

  // Handle deactivate
  async function handleDeactivate(id: number) {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: false } : p))
      );
    } catch (error) {
      console.error('Failed to deactivate product:', error);
    }
  }

  // Handle pagination
  function goToPage(page: number) {
    setLoading(true);
    fetchProducts(page);
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          New Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{product.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">${Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{product.cost ? `$${Number(product.cost).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    {product.isActive && (
                      <button
                        onClick={() => handleDeactivate(product.id)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
