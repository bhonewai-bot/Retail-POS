'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { CartProvider, useCart, type CartItem, type CartAction } from '@/components/pos/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt, type ReceiptOrderData } from '@/components/pos/receipt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search,
  Barcode,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Loader2,
  LogOut,
  Package,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: number;
  isActive: boolean;
  categoryId: number | null;
  category: { id: number; name: string } | null;
}

// ─── Product Grid ────────────────────────────────────────────────

function ProductGrid({
  products,
  categories,
  loading,
  onAddToCart,
}: {
  products: Product[];
  categories: { id: number; name: string }[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchBuffer = useRef('');

  // Auto-focus search
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Barcode scanner: detect rapid input and add to cart directly
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement === searchRef.current &&
        e.key !== 'Enter'
      ) {
        return;
      }

      // If not focused on search, listen for barcode scanner input
      if (document.activeElement !== searchRef.current) {
        searchBuffer.current += e.key;
        clearTimeout((searchBuffer as unknown as { timer: ReturnType<typeof setTimeout> }).timer);
        (searchBuffer as unknown as { timer: ReturnType<typeof setTimeout> }).timer = setTimeout(() => {
          searchBuffer.current = '';
        }, 100);

        if (e.key === 'Enter' && searchBuffer.current.length > 3) {
          const barcode = searchBuffer.current.replace('Enter', '');
          searchBuffer.current = '';
          const found = products.find(
            (p) => p.sku === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
          );
          if (found) {
            onAddToCart(found);
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, onAddToCart]);

  // Keyboard shortcut: Ctrl+F or / to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === 'f') || (e.key === '/' && document.activeElement !== searchRef.current)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.isActive);
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.categoryId === Number(activeCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, activeCategory, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b bg-card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search products or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-12 pr-24 text-base rounded-xl"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">/</kbd>
            <span>to focus</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b bg-card">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id.toString())}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.id.toString()
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-foreground">No products found</p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search' : 'No products in this category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={product.stock === 0}
                className="group flex flex-col items-start p-4 rounded-xl border bg-card text-left transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[144px]"
              >
                <div className="flex-1 w-full">
                  <p className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {product.sku}
                  </p>
                </div>
                <div className="w-full mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {product.stock <= 10 && product.stock > 0 && (
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                      {product.stock} left
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Out of stock
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Cart Panel ──────────────────────────────────────────────────

function CartPanel({ onPayment }: { onPayment: () => void }) {
  const { state, subtotal, tax, total, itemCount, dispatch } = useCart();

  return (
    <div className="flex flex-col h-full bg-card border-l">
      {/* Cart Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-foreground" />
          <h2 className="font-semibold text-foreground">Cart</h2>
          {itemCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {itemCount}
            </Badge>
          )}
        </div>
        {state.items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => dispatch({ type: 'CLEAR' })}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        {state.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Cart is empty</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Click a product to add it
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {state.items.map((item) => (
              <CartItemRow key={item.id} item={item} dispatch={dispatch} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals & Payment */}
      <div className="border-t">
        {/* Discount */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {state.discount > 0 ? `-$${state.discount.toFixed(2)}` : '$0.00'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const val = prompt('Enter discount amount:');
                  if (val) dispatch({ type: 'SET_DISCOUNT', discount: Number(val) || 0 });
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Summary */}
        <div className="px-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Button */}
        <div className="p-4">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold rounded-xl"
            disabled={state.items.length === 0}
            onClick={onPayment}
          >
            Pay ${total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item Row ───────────────────────────────────────────────

function CartItemRow({
  item,
  dispatch,
}: {
  item: CartItem;
  dispatch: React.Dispatch<CartAction>;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => dispatch({ type: 'DECREMENT', id: item.id })}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={item.quantity >= item.stock}
          onClick={() => dispatch({ type: 'INCREMENT', id: item.id })}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Line Total */}
      <span className="text-sm font-semibold text-foreground w-16 text-right">
        ${(item.price * item.quantity).toFixed(2)}
      </span>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Payment Dialog ──────────────────────────────────────────────

function PaymentDialog({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const { state, subtotal, tax, total, dispatch } = useCart();
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [success, setSuccess] = useState<ReceiptOrderData | null>(null);

  async function handlePay(paymentMethod: string) {
    setMethod(paymentMethod);
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          tax,
          total,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error('Payment failed', {
          description: errorData.error || 'Failed to create order',
        });
        setProcessing(false);
        setMethod(null);
        return;
      }

      const order = await response.json();

      setProcessing(false);
      dispatch({ type: 'CLEAR' });
      onOpenChange(false);
      setMethod(null);

      // Show receipt dialog
      setSuccess({
        orderNumber: order.orderNumber,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.items.map((item: { quantity: number; price: number; total: number; product: { name: string; sku: string } }) => ({
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          product: item.product,
        })),
      });
    } catch {
      toast.error('Payment failed', {
        description: 'Network error — please try again',
      });
      setProcessing(false);
      setMethod(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Payment Method</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-3xl font-bold text-center mb-6">
              ${total.toFixed(2)}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePay('Cash')}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 active:scale-95 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  {processing && method === 'Cash' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Banknote className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm font-medium">Cash</span>
              </button>

              <button
                onClick={() => handlePay('Card')}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 active:scale-95 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {processing && method === 'Card' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <CreditCard className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm font-medium">Card</span>
              </button>

              <button
                onClick={() => handlePay('QR')}
                disabled={processing}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 active:scale-95 disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  {processing && method === 'QR' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <QrCode className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm font-medium">QR Pay</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Receipt
        open={!!success}
        onOpenChange={(open) => {
          if (!open) {
            setSuccess(null);
            onComplete();
          }
        }}
        orderData={success}
      />
    </>
  );
}

// ─── Main POS Page ───────────────────────────────────────────────

function POSPageContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ user: { name: string; role: string } } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { dispatch } = useCart();

  const fetchProducts = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?pageSize=200'),
        fetch('/api/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData.products || []);
      setCategories(catData.categories || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data } = await authClient.getSession();
      if (!data) { router.push('/login'); return; }
      setSession(data as unknown as { user: { name: string; role: string } });
      await fetchProducts();
      setLoading(false);
    }
    init();
  }, [router, fetchProducts]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      dispatch({
        type: 'ADD_ITEM',
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          stock: product.stock,
        },
      });
      toast(`${product.name} added to cart`, {
        duration: 1000,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });
    },
    [dispatch]
  );

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            R
          </div>
          <h1 className="font-semibold text-foreground">POS Terminal</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session?.user?.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Two-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Products (65%) */}
        <div className="w-[65%] flex flex-col overflow-hidden">
          <ProductGrid
            products={products}
            categories={categories}
            loading={loading}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Right Panel: Cart (35%) */}
        <div className="w-[35%] flex flex-col overflow-hidden">
          <CartPanel onPayment={() => setPaymentOpen(true)} />
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onComplete={fetchProducts}
      />
    </div>
  );
}

// ─── Exported Page ───────────────────────────────────────────────

export default function POSPage() {
  return (
    <CartProvider>
      <POSPageContent />
    </CartProvider>
  );
}
