'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    setAuthenticated(true);
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cantor-backend.onrender.com';
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

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between pb-5 border-b border-gray-200">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-md transition cursor-pointer"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="text-base font-serif font-medium text-gray-900">
            Welcome back!
          </h2>
          <p className="text-sm font-serif text-gray-500 mt-1.5">
            You are authenticated. Your active JWT session is stored in LocalStorage.
          </p>
        </div>
      </div>
    </div>
  );
}