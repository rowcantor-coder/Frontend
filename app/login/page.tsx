'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cantor-backend.onrender.com';
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid username or password');
      }

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('username', username);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong while logging in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 pb-5">
          <h1 className="text-2xl font-serif font-medium text-gray-900">Login</h1>
          <p className="text-sm font-serif text-gray-500 mt-1">
            Enter your credentials to access your account.
          </p>

          {error && (
            <div className="mt-4 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs">
              {error}
            </div>
          )}

          <form id="login-form" onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-serif text-gray-800 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-serif text-gray-800 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-400"
              />
            </div>
          </form>
        </div>

        <div className="bg-gray-50/70 border-t border-gray-100 px-6 py-4 text-center">
          <button
            type="submit"
            form="login-form"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#141414] hover:bg-black disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-3.5 text-xs font-serif text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline text-gray-900 hover:text-black">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}