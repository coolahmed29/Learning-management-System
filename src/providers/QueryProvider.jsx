/**
 * Wraps the app with TanStack Query's QueryClientProvider so every feature can use
 * useQuery/useMutation without each one creating its own client.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { queryClient };
