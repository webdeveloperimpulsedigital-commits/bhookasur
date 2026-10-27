'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.replace('/admin');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin');
      } else {
        setErrorMessage(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setErrorMessage('Network error occurred. Please check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-[#0d0703] to-[#1a0c04] flex flex-col justify-center items-center p-4 relative overflow-hidden text-white">
      {/* Glow Effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-orange-500/20 text-xs font-semibold text-stone-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Food Tour</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-600/30 border border-amber-400/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Bakasur Admin Portal</h1>
            <p className="text-xs text-stone-400 mt-1">
              Secure campaign management &amp; live database analytics
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-black/60 border border-orange-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/80 flex flex-col gap-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-300">Username</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-stone-900/80 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-stone-900/80 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 hover:brightness-110 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {process.env.NODE_ENV !== 'production' && (
            <div className="pt-2 border-t border-stone-800/80 text-center text-[11px] text-stone-500">
              Default credentials: <span className="text-amber-400 font-mono">admin</span> / <span className="text-amber-400 font-mono">admin123</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
