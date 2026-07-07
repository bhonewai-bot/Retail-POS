'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

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
    } catch (error) {
      console.error('Failed to sign out:', error);
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Retail POS
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{session.user.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {session.user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-8">{children}</main>
    </div>
  );
}
