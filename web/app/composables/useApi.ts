// API client composable for authenticated requests using axios
import { apiClient, type ApiResponse } from '~/utils/api';

export function useApi() {
  const config = useRuntimeConfig();
  
  // Set base URL from config (for SSR compatibility)
  if (import.meta.client) {
    apiClient.defaults.baseURL = config.public.apiBase as string;
  }

  const request = async <T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      data?: unknown;
    } = {}
  ): Promise<T> => {
    const { method = 'GET', data } = options;
    
    const response = await apiClient.request<ApiResponse<T>>({
      url: endpoint,
      method,
      data,
    });
    
    const result = response.data;
    
    if (!result.success) {
      throw new Error(result.message || 'Request failed');
    }
    
    return result.data as T;
  };

  const get = <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' });
  
  const post = <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', data });

  const patch = <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', data });

  const del = <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' });

  return { get, post, patch, del };
}
