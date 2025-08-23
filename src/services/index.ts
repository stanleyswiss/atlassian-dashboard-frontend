// Main API client and utilities
import apiInstance, { apiCache as cache } from './api'
export { default as api, apiClient, apiCache } from './api'
export * from './api'

// Service instances
import dashboardServiceInstance from './dashboard'
import postsServiceInstance from './posts'
import analyticsServiceInstance from './analytics'

export { dashboardService, default as defaultDashboardService } from './dashboard'
export { postsService, default as defaultPostsService } from './posts'
export { analyticsService, default as defaultAnalyticsService } from './analytics'

// Individual service exports with utilities
export * from './dashboard'
export * from './posts'
export * from './analytics'

// Re-export commonly used functions
export {
  buildUrl,
  createQueryString,
  withCache,
  withRetry,
  isApiError,
  getErrorMessage
} from './api'

// Service collection for easy access
export const services = {
  dashboard: dashboardServiceInstance,
  posts: postsServiceInstance,
  analytics: analyticsServiceInstance
} as const

// API endpoints configuration (matches backend)
export const API_ENDPOINTS = {
  // Health and info
  health: '/health',
  root: '/',
  
  // Dashboard endpoints
  dashboard: {
    overview: '/api/dashboard/overview',
    recentPosts: '/api/dashboard/recent-posts',
    trendingTopics: '/api/dashboard/trending-topics',
    sentimentTimeline: '/api/dashboard/sentiment-timeline',
    refreshData: '/api/dashboard/refresh-data',
    healthScore: '/api/dashboard/health-score'
  },
  
  // Posts endpoints
  posts: {
    list: '/api/posts/',
    create: '/api/posts/',
    getById: '/api/posts/:id',
    update: '/api/posts/:id',
    delete: '/api/posts/:id',
    search: '/api/posts/search/by-content',
    summary: '/api/posts/stats/summary',
    categories: '/api/posts/categories/',
    sentiments: '/api/posts/sentiments/'
  },
  
  // Analytics endpoints
  analytics: {
    daily: '/api/analytics/daily/:date',
    range: '/api/analytics/range',
    sentimentTrends: '/api/analytics/sentiment-trends',
    topicTrends: '/api/analytics/topic-trends',
    topicHistory: '/api/analytics/topic/:topic/history',
    forumComparison: '/api/analytics/forum-comparison',
    summary: '/api/analytics/summary',
    generateDaily: '/api/analytics/generate-daily/:date'
  }
} as const

// Service status checker
export const checkServiceHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'down'
  services: {
    api: boolean
    dashboard: boolean
    posts: boolean
    analytics: boolean
  }
  response_times: {
    api: number
    dashboard?: number
    posts?: number
    analytics?: number
  }
}> => {
  const results: {
    status: 'healthy' | 'degraded' | 'down'
    services: {
      api: boolean
      dashboard: boolean
      posts: boolean
      analytics: boolean
    }
    response_times: {
      api: number
      dashboard?: number
      posts?: number
      analytics?: number
    }
  } = {
    status: 'healthy',
    services: {
      api: false,
      dashboard: false,
      posts: false,
      analytics: false
    },
    response_times: {
      api: 0
    }
  }

  try {
    // Test main API health
    const apiStart = Date.now()
    await apiInstance.healthCheck()
    results.services.api = true
    results.response_times.api = Date.now() - apiStart

    // Test dashboard service
    try {
      const dashboardStart = Date.now()
      await dashboardServiceInstance.getOverview()
      results.services.dashboard = true
      results.response_times.dashboard = Date.now() - dashboardStart
    } catch (error) {
      console.warn('Dashboard service check failed:', error)
    }

    // Test posts service
    try {
      const postsStart = Date.now()
      await postsServiceInstance.getCategories()
      results.services.posts = true
      results.response_times.posts = Date.now() - postsStart
    } catch (error) {
      console.warn('Posts service check failed:', error)
    }

    // Test analytics service (with a simple call)
    try {
      const analyticsStart = Date.now()
      const today = new Date().toISOString().split('T')[0]
      await analyticsServiceInstance.getDailyAnalytics({ date: today })
      results.services.analytics = true
      results.response_times.analytics = Date.now() - analyticsStart
    } catch (error) {
      console.warn('Analytics service check failed:', error)
    }

    // Determine overall status
    const healthyServices = Object.values(results.services).filter(Boolean).length
    const totalServices = Object.keys(results.services).length

    if (healthyServices === totalServices) {
      results.status = 'healthy'
    } else if (healthyServices >= totalServices / 2) {
      results.status = 'degraded'
    } else {
      results.status = 'down'
    }

  } catch (error) {
    console.error('Service health check failed:', error)
    results.status = 'down'
  }

  return results
}

// Global error handler for services
export const handleServiceError = (error: any, context?: string): void => {
  // Simple error message extraction
  const message = error?.detail || error?.message || 'Unknown error'
  const errorContext = context ? `[${context}]` : '[Service]'
  
  console.error(`${errorContext} Error:`, {
    message,
    error,
    timestamp: new Date().toISOString()
  })

  // In a real app, you might want to:
  // - Send error to monitoring service
  // - Show toast notification
  // - Update global error state
}

// Service configuration
export const SERVICE_CONFIG = {
  retries: {
    default: 3,
    critical: 5
  },
  timeouts: {
    fast: 5000,    // 5 seconds
    normal: 15000, // 15 seconds
    slow: 30000    // 30 seconds
  },
  cache: {
    short: 1 * 60 * 1000,      // 1 minute
    medium: 5 * 60 * 1000,     // 5 minutes
    long: 30 * 60 * 1000,      // 30 minutes
    extraLong: 60 * 60 * 1000  // 1 hour
  }
} as const

// Development utilities
export const devUtils = {
  // Log all API calls in development
  enableApiLogging: () => {
    if (import.meta.env.DEV) {
      console.log('🔧 API logging enabled')
    }
  },
  
  // Clear all service caches
  clearAllCaches: () => {
    cache.clear()
    dashboardServiceInstance.clearCache()
    analyticsServiceInstance.clearCache()
    console.log('🗑️ All service caches cleared')
  },
  
  // Test all services
  testAllServices: async () => {
    return checkServiceHealth()
  }
}