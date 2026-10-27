'use client';

import { useEffect } from 'react';
import { BASE_PATH } from '@/lib/basePath';

declare global {
  interface Window {
    __bhookasur_fetch_patched?: boolean;
  }
}

export function BasePathProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.__bhookasur_fetch_patched && BASE_PATH) {
      window.__bhookasur_fetch_patched = true;
      const originalFetch = window.fetch.bind(window);

      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof input === 'string') {
          if (
            (input.startsWith('/api/') || input.startsWith('/images/')) &&
            !input.startsWith(BASE_PATH)
          ) {
            input = `${BASE_PATH}${input}`;
          }
        }
        return originalFetch(input, init);
      };
    }
  }, []);

  return <>{children}</>;
}
