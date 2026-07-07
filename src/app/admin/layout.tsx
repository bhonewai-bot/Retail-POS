'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AppShell } from '@/components/layout/app-shell';
import { managerNavItems } from '@/components/layout/nav-links';
import { Loader2 } from 'lucide-react';

interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
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
        setSession(data as unknown as SessionData);
      } catch (error) {
        console.error('Failed to fetch session:', error);
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
    <AppShell
      navItems={managerNavItems}
      user={session.user}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
