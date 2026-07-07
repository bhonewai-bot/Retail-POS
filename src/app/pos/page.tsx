'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function POSPage() {
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
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">POS Terminal</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-700">
            Logged in as <span className="font-semibold">{session.user.name}</span>{' '}
            (<span className="text-sm text-gray-500">{session.user.role}</span>)
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
