import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

interface ApiResponse<T = unknown> {
  data: T | null;
  success: boolean;
  message: string;
}

interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  config: InternalAxiosRequestConfig;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (token) {
      request.config.headers.Authorization = `Bearer ${token}`;
      request.resolve(apiClient(request.config));
    }
  });
  failedQueue = [];
};

const getApiBase = (): string => {
  if (import.meta.client) {
    return (window as unknown as { __NUXT__?: { config?: { public?: { apiBase?: string } } } }).__NUXT__?.config?.public?.apiBase || 'http://localhost:3000';
  }
  return 'http://localhost:3000';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBase(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.client) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this was the refresh request itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Clear tokens and redirect to login
        if (import.meta.client) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = import.meta.client ? localStorage.getItem('refresh_token') : null;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post<ApiResponse<{ token: string }>>(
          `${getApiBase()}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.data.success && response.data.data?.token) {
          const newToken = response.data.data.token;
          
          if (import.meta.client) {
            localStorage.setItem('auth_token', newToken);
          }
          
          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          
          return apiClient(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        // Clear tokens and redirect to login
        if (import.meta.client) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        processQueue(refreshError as Error, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
export type { ApiResponse };
