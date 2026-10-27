'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-2">Kuch gadbad ho gayi!</h2>
      <p className="text-slate-400 mb-4 text-center max-w-md">
        {error.message || 'Something went wrong.'}
      </p>
      <button
        onClick={() => reset()}
        type="button"
        className="px-5 py-2.5 bg-[#D4380D] hover:bg-[#ba300a] text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg"
      >
        Try Again 🔄
      </button>
    </div>
  );
}
