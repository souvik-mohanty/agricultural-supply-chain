import { QueryClient } from '@tanstack/react-query';
import { shouldRetry } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: { retry: false },
  },
});
