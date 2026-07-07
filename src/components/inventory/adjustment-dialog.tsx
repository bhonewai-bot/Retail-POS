'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// ─── Types ───────────────────────────────────────────────────────

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: number; name: string; sku: string; stock: number } | null;
  onAdjustmentCreated: () => void;
}

const ADJUSTMENT_TYPES = [
  { value: 'stock-receipt', label: 'Stock Receipt' },
  { value: 'damage', label: 'Damage' },
  { value: 'count-adjustment', label: 'Count Adjustment' },
  { value: 'return', label: 'Return' },
  { value: 'other', label: 'Other' },
] as const;

type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number]['value'];

// ─── Component ───────────────────────────────────────────────────

export default function AdjustmentDialog({
  open,
  onOpenChange,
  product,
  onAdjustmentCreated,
}: AdjustmentDialogProps) {
  const [type, setType] = useState<AdjustmentType>('stock-receipt');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setType('stock-receipt');
    setQuantity('');
    setReason('');
    setError('');
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = parseInt(quantity, 10);
    if (Number.isNaN(parsed) || parsed === 0) {
      setError('Quantity must be a non-zero integer');
      return;
    }

    if (!product) return;

    setLoading(true);
    try {
      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity: parsed,
          reason: reason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create adjustment');
        return;
      }

      resetForm();
      onAdjustmentCreated();
      onOpenChange(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Adjust Stock &mdash; {product.name}
          </DialogTitle>
        </DialogHeader>

        {/* Product info */}
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">SKU</span>
            <span className="font-mono text-foreground">{product.sku}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Current Stock</span>
            <span className="font-medium text-foreground">{product.stock}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">Adjustment Type</Label>
            <select
              id="adjustment-type"
              value={type}
              onChange={(e) => setType(e.target.value as AdjustmentType)}
              className="flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              {ADJUSTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-quantity">Quantity</Label>
            <Input
              id="adjustment-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10 or -5"
              required
            />
            <p className="text-xs text-muted-foreground">
              Positive to add stock, negative to remove.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-reason">Reason (optional)</Label>
            <Textarea
              id="adjustment-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment..."
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
