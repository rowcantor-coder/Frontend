'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [tokenPreview, setTokenPreview] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('username');

    if (!token) {
      router.replace('/login');
      return;
    }

    setUsername(savedUser || 'User');
    setTokenPreview(`${token.slice(0, 24)}...`);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cantor-backend.onrender.com';
      const token = localStorage.getItem('accessToken');

      if (token) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('username');
      router.replace('/login');
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-slate-900">Auth Portal</span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition"
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            Authenticated Session Active
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {username}!
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            You have successfully signed in. Your JWT session token is stored and active.
          </p>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Access Token Preview
            </p>
            <p className="text-xs font-mono text-slate-700 mt-1 break-all">
              {tokenPreview}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}