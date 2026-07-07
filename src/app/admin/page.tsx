'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  session: {
    id: string;
    token: string;
  };
}

export default function AdminPage() {
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
    } catch (error) {
      console.error('Failed to sign out:', error);
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Admin Dashboard</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-foreground mb-2">
              Logged in as <span className="font-semibold">{session.user.name}</span>{' '}
              (<span className="text-sm text-muted-foreground">{session.user.role}</span>)
            </p>
            <p className="text-sm text-muted-foreground italic">Manager-only area</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/products" className={buttonVariants()}>
              Manage Products
            </Link>
          </CardContent>
        </Card>

        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
