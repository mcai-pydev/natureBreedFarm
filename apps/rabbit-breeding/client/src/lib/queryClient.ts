import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export type ApiRequestOptions = {
  on401?: 'redirect' | 'returnNull';
};

export const getQueryFn =
  (options?: ApiRequestOptions) =>
  async <T>({ queryKey }: { queryKey: string[] }): Promise<T> => {
    // Get URL by string or array query key
    const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    try {
      const res = await fetch(url);
      if (res.status === 401 && options?.on401 === 'returnNull') {
        return null as T;
      }
      if (!res.ok) {
        throw new Error(
          `API error: ${res.status} ${res.statusText} - ${await res.text()}`
        );
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  body?: object
): Promise<Response> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
};