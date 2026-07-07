'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, LogOut, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function POSPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const { data } = await authClient.getSession();
        if (!data) { router.push('/login'); return; }
        setSession(data as unknown as SessionData);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [router]);

  async function handleLogout() {
    try {
      await authClient.signOut();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            R
          </div>
          <span className="font-semibold text-foreground">Retail POS</span>
        </div>
        <nav className="flex-1 p-2">
          <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            <ShoppingCart className="h-4 w-4" />
            POS Terminal
          </div>
        </nav>
        <Separator />
        <div className="p-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6">
          <h1 className="text-lg font-semibold text-foreground">POS Terminal</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-2xl bg-muted p-6 mb-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              POS Terminal
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              The checkout interface will be built here. This is where cashiers
              will scan products, manage carts, and process payments.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
