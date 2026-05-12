/**
 * Enhanced API Client
 * Enterprise SaaS Grade with Token Refresh and Error Handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

// All API calls go through the Next.js proxy to handle cookies securely
const API_URL = '/api/';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Process queued requests after refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add auth header and track performance
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { _startTime?: number }) => {
    // Track start time for performance monitoring
    config._startTime = Date.now();
    
    // All auth is handled via HttpOnly cookies through the proxy
    // No need to manually add Authorization header here
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Process response performance logging
api.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { _startTime?: number };
    if (config._startTime) {
      const duration = Date.now() - config._startTime;
      if (duration > 1000) {
        console.warn(`[API Performance] SLOW REQUEST: ${config.method?.toUpperCase()} ${config.url} took ${duration}ms`);
      } else {
        console.debug(`[API Performance] ${config.method?.toUpperCase()} ${config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _startTime?: number };
    if (config?._startTime) {
      const duration = Date.now() - config._startTime;
      console.error(`[API Error] ${config.method?.toUpperCase()} ${config.url} failed after ${duration}ms`);
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loops
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh failed, logout user
        useAuthStore.getState().clearAuth();
        window.location.href = '/login?error=session_expired';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Attempt to refresh token
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        // Refresh successful, process queued requests
        processQueue(null, 'refreshed');
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        // Clear auth state
        useAuthStore.getState().clearAuth();

        // Show error toast
        toast.error('Session expired. Please log in again.');

        // Clear HttpOnly cookies via server route BEFORE redirecting
        // Without this, middleware sees stale refresh_token and loops back to dashboard
        try {
          await axios.post('/api/auth/logout');
        } catch {
          // Ignore logout errors — redirect regardless
        }

        window.location.href = '/login?error=session_expired';
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string };

      // Don't show toast for auth endpoints (handled separately)
      if (!originalRequest.url?.includes('/auth/')) {
        if (status === 403) {
          toast.error('You do not have permission to perform this action');
        } else if (status === 404) {
          // Silent - let component handle
        } else if (status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (data?.message) {
          toast.error(data.message);
        }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Helper to check if error is auth-related
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}

// Helper to get error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string };
    return data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
