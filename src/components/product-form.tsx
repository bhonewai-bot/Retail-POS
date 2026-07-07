'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  cost: string;
  categoryId: string;
  stock: string;
  lowStockThreshold: string;
  barcode: string;
  isActive: boolean;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: ProductFormData;
  categories: Category[];
  error: string;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCategoryChange: (value: string) => void;
  onActiveChange: (checked: boolean) => void;
}

export function ProductForm({
  mode,
  initialData,
  categories,
  error,
  submitting,
  onSubmit,
  onChange,
  onCategoryChange,
  onActiveChange,
}: ProductFormProps) {
  const router = useRouter();
  const data = initialData || {
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
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {mode === 'create' ? 'New Product' : 'Edit Product'}
      </h1>

      <Card>
        <CardContent className="pt-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={data.name}
                onChange={onChange}
                placeholder="Product name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                type="text"
                required
                value={data.sku}
                onChange={onChange}
                placeholder="e.g. PROD-001"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={data.description}
                onChange={onChange}
                placeholder="Optional description"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={data.price}
                  onChange={onChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.cost}
                  onChange={onChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select value={data.categoryId} onValueChange={onCategoryChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={data.stock}
                  onChange={onChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  value={data.lowStockThreshold}
                  onChange={onChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                type="text"
                value={data.barcode}
                onChange={onChange}
                placeholder="Optional barcode"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={data.isActive}
                onChange={(e) => onActiveChange(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? mode === 'create' ? 'Creating...' : 'Saving...'
                  : mode === 'create' ? 'Create Product' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
