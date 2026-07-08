'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, StatusBadge, DataTablePagination } from '@/components/ui/data-table';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/page-header';

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

interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

export default function TransactionsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalPages: 0,
    total: 0,
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async (page: number, pageSize = 20) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (paymentMethod) params.set('paymentMethod', paymentMethod);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, paymentMethod]);

  // Auth guard
  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      const user = data.user as Record<string, unknown>;
      if (user?.role !== 'manager') { router.push('/pos'); return; }
      fetchOrders(1);
    }
    init();
  }, [router, fetchOrders]);

  // Refetch when filters change
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  function handleClearFilters() {
    setStartDate('');
    setEndDate('');
    setPaymentMethod('');
  }

  const columns: ColumnDef<Order, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: (row) => formatDateTime(row.createdAt),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: 'items',
        header: 'Items',
        accessorFn: (row) => row.items.length,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as number}</span>
        ),
      },
      {
        id: 'total',
        header: () => <div className="text-right">Total</div>,
        accessorFn: (row) => row.total,
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-right">{formatCurrency(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment',
        cell: ({ getValue }) => {
          const method = getValue() as string;
          const label = method === 'QR' ? 'QR Pay' : method;
          return <span className="text-sm">{label}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return <StatusBadge variant={getStatusVariant(status)} label={status} />;
        },
      },
    ],
    []
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = orders.filter((o) => o.createdAt.slice(0, 10) === today).length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        description="View and manage transaction records"
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
          <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val ?? '')}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="QR">QR Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold mt-1">{pagination.total}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Today&apos;s Transactions</p>
          <p className="text-2xl font-bold mt-1">{todayCount}</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        skeletonRows={8}
        onRowClick={(order) => router.push(`/admin/transactions/${order.id}`)}
      />

      {/* Pagination */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">
        <DataTablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(p) => fetchOrders(p, pagination.pageSize)}
          onPageSizeChange={(size) => fetchOrders(1, size)}
        />
      </div>
    </PageContainer>
  );
}
