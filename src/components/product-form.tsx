'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  cost: z.coerce.number().min(0).optional().or(z.literal('')),
  categoryId: z.string().optional(),
  stock: z.coerce.number().min(0).optional(),
  lowStockThreshold: z.coerce.number().min(0).optional(),
  barcode: z.string().optional(),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: number;
  name: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: ProductFormData;
  categories: Category[];
}

export function ProductForm({ mode, productId, initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const isSubmitting = false;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData || {
      name: '',
      sku: '',
      description: '',
      price: 0,
      cost: '',
      categoryId: '',
      stock: 0,
      lowStockThreshold: 10,
      barcode: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  async function onSubmit(data: ProductFormData) {
    const body = {
      name: data.name.trim(),
      sku: data.sku.trim(),
      description: data.description || undefined,
      price: data.price,
      cost: data.cost || undefined,
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      stock: data.stock ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 10,
      barcode: data.barcode || undefined,
      isActive: data.isActive,
    };

    try {
      const url =
        mode === 'create'
          ? '/api/products'
          : `/api/products/${productId}`;

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.status === 409) {
        toast.error('SKU already exists', {
          description: 'A product with this SKU is already in the system.',
        });
        return;
      }

      if (!res.ok) {
        toast.error(result.error || 'Something went wrong');
        return;
      }

      const verb = mode === 'create' ? 'created' : 'updated';
      toast.success('Product ' + verb, {
        description: data.name + ' has been ' + verb + ' in your catalog.',
      });
      router.push('/admin/products');
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Basic Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Core product details for your catalog
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Organic Whole Milk"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="e.g. PROD-001"
                  {...register('sku')}
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Optional product description"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('description')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  value={watch('categoryId') || ''}
                  onChange={(e) => setValue('categoryId', e.target.value)}
                  className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Optional barcode"
                  {...register('barcode')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Pricing</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set selling price and cost
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register('price')}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('cost')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Inventory */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Inventory</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Stock levels and alert thresholds
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register('stock')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  placeholder="10"
                  {...register('lowStockThreshold')}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when stock falls below this number
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? 'This product is visible and available'
                    : 'This product is hidden from the system'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={formSubmitting}>
          {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Product' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
