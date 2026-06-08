'use client';

import { SWRConfig } from 'swr';
import { apiFetcher } from '@/lib/utils/api-fetcher';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: apiFetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
