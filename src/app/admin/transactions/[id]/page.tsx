'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/data-table';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/dashboard/loading-spinner';

// ─── Types ───────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  total: string;
  product: { id: number; name: string; sku: string };
}

interface Order {
  id: number;
  orderNumber: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusVariant(status: string): 'active' | 'completed' | 'low-stock' | 'out-of-stock' {
  switch (status) {
    case 'completed':
      return 'active';
    case 'refunded':
      return 'low-stock';
    case 'voided':
      return 'out-of-stock';
    default:
      return 'completed';
  }
}

// ─── Page ────────────────────────────────────────────────────────

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }

      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Transaction not found');
          } else {
            setError('Failed to load transaction');
          }
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch {
        setError('Failed to load transaction');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params.id, router]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer>
        <PageHeader
          title="Transaction Not Found"
          description={error || 'The requested transaction could not be found'}
          actions={
            <Button variant="outline" onClick={() => router.push('/admin/transactions')}>
              Back to Transactions
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Transaction ${order.orderNumber}`}
        description={`Completed on ${formatDate(order.createdAt)}`}
        actions={
          <Button variant="outline" onClick={() => router.push('/admin/transactions')}>
            Back to Transactions
          </Button>
        }
      />

      {/* Order summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge variant={getStatusVariant(order.status)} label={order.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{order.paymentMethod}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{order.items.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals summary */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
