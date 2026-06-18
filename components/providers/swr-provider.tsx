'use client';

import { SWRConfig } from 'swr';
import { apiFetcher } from '@/lib/utils/api-fetcher';
import { localStorageProvider } from '@/lib/swr/persistent-cache';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: apiFetcher,
        provider: localStorageProvider,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 2,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
