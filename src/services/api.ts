import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiErrorResponse } from '@/types'

// API client configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000, // Increased to 2 minutes for slow queries with JSON parsing
  headers: {
    'Content-Type': 'application/json',
  },
}

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG)

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }

    return config
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('🚨 API Request Error:', error)
    }
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  (error) => {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      })
    }

    // Transform error into a consistent format
    const apiError: ApiErrorResponse = {
      detail: error.response?.data?.detail || error.message || 'An unexpected error occurred',
      status_code: error.response?.status || 500,
      error_type: error.name || 'UnknownError',
      timestamp: new Date().toISOString(),
    }

    // Handle common HTTP errors
    switch (error.response?.status) {
      case 401:
        apiError.detail = 'Authentication required'
        break
      case 403:
        apiError.detail = 'Access denied'
        break
      case 404:
        apiError.detail = 'Resource not found'
        break
      case 422:
        apiError.detail = error.response?.data?.detail || 'Validation error'
        break
      case 429:
        apiError.detail = 'Too many requests. Please try again later.'
        break
      case 500:
        apiError.detail = 'Internal server error'
        break
      case 503:
        apiError.detail = 'Service temporarily unavailable'
        break
    }

    return Promise.reject(apiError)
  }
)

// Generic API methods
class ApiClient {
  private client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  // GET request
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }

  // POST request
  async post<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  // PUT request
  async put<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // PATCH request
  async patch<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string; version: string; database: string }> {
    return this.get('/health')
  }

  // Get API info
  async getApiInfo(): Promise<{
    message: string
    version: string
    endpoints: Record<string, string>
    features: string[]
  }> {
    return this.get('/')
  }
}

// Create and export the API client instance
const api = new ApiClient(apiClient)

// Utility functions
export const buildUrl = (template: string, params: Record<string, string | number>): string => {
  let url = template
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value))
  })
  return url
}

export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  return searchParams.toString()
}

// Error handling utilities
export const isApiError = (error: any): error is ApiErrorResponse => {
  return error && typeof error.detail === 'string' && typeof error.status_code === 'number'
}

export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.detail
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Retry utility for failed requests
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      // Don't retry on certain errors
      if (isApiError(error) && [400, 401, 403, 404, 422].includes(error.status_code)) {
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Cache utility (simple in-memory cache)
class ApiCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

export const apiCache = new ApiCache()

// Cached request wrapper
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cachedData = apiCache.get(key)
  
  if (cachedData) {
    return cachedData
  }
  
  const data = await fn()
  apiCache.set(key, data, ttl)
  
  return data
}

export default api
export { apiClient }