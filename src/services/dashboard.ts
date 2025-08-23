import api, { withCache, withRetry } from './api'
import {
  DashboardOverview,
  Post,
  TopicTrend,
  SentimentTrend,
  RefreshDataRequest,
  RefreshDataResponse,
  HealthScoreResponse,
  PostCategory,
  RecentPostsParams,
  TrendingTopicsParams,
  SentimentTimelineParams
} from '@/types'

// Dashboard service class
class DashboardService {
  // Get dashboard overview with community metrics
  async getOverview(): Promise<DashboardOverview> {
    return withCache(
      'dashboard:overview',
      () => withRetry(() => api.get<DashboardOverview>('/api/dashboard/overview')),
      2 * 60 * 1000 // 2 minutes cache
    )
  }

  // Get recent posts with optional filtering
  async getRecentPosts(params: RecentPostsParams = {}): Promise<Post[]> {
    const { limit = 10, category } = params
    
    const queryParams: Record<string, any> = { limit }
    if (category) {
      queryParams.category = category
    }

    const cacheKey = `dashboard:recent-posts:${JSON.stringify(queryParams)}`
    
    return withCache(
      cacheKey,
      () => withRetry(() => api.get<Post[]>('/api/dashboard/recent-posts', queryParams)),
      60 * 1000 // 1 minute cache
    )
  }

  // Get trending topics and keywords
  async getTrendingTopics(params: TrendingTopicsParams = {}): Promise<TopicTrend[]> {
    const { limit = 10, min_score = 0.0 } = params
    
    const queryParams = { limit, min_score }
    const cacheKey = `dashboard:trending-topics:${JSON.stringify(queryParams)}`
    
    return withCache(
      cacheKey,
      () => withRetry(() => api.get<TopicTrend[]>('/api/dashboard/trending-topics', queryParams)),
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Get sentiment timeline over specified days
  async getSentimentTimeline(params: SentimentTimelineParams = {}): Promise<SentimentTrend[]> {
    const { days = 7 } = params
    
    const queryParams = { days }
    const cacheKey = `dashboard:sentiment-timeline:${days}`
    
    return withCache(
      cacheKey,
      () => withRetry(() => api.get<SentimentTrend[]>('/api/dashboard/sentiment-timeline', queryParams)),
      10 * 60 * 1000 // 10 minutes cache
    )
  }

  // Trigger manual data collection and refresh
  async refreshData(params: RefreshDataRequest = {}): Promise<RefreshDataResponse> {
    const { max_posts_per_category = 20, analyze_with_ai = false } = params
    
    const requestData = {
      max_posts_per_category,
      analyze_with_ai
    }

    // Clear relevant caches after refresh
    const response = await api.post<RefreshDataResponse>('/api/dashboard/refresh-data', requestData)
    
    // Clear cached data since we just refreshed
    this.clearCache()
    
    return response
  }

  // Get detailed community health score
  async getHealthScore(): Promise<HealthScoreResponse> {
    return withCache(
      'dashboard:health-score',
      () => withRetry(() => api.get<HealthScoreResponse>('/api/dashboard/health-score')),
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Clear all dashboard-related cache
  clearCache(): void {
    // Note: This is a simplified implementation. In a real app, you'd want
    // a more sophisticated cache management system
    const cacheKeys = [
      'dashboard:overview',
      'dashboard:health-score',
    ]
    
    // Clear specific keys (cache implementation would need to support this)
    if (import.meta.env.DEV) {
      console.log('🗑️ Clearing dashboard cache keys:', cacheKeys)
    }
  }

  // Get dashboard summary for quick overview
  async getSummary(): Promise<{
    overview: DashboardOverview
    recentPosts: Post[]
    trendingTopics: TopicTrend[]
    healthScore: HealthScoreResponse
  }> {
    // Fetch all data in parallel
    const [overview, recentPosts, trendingTopics, healthScore] = await Promise.all([
      this.getOverview(),
      this.getRecentPosts({ limit: 5 }),
      this.getTrendingTopics({ limit: 5 }),
      this.getHealthScore()
    ])

    return {
      overview,
      recentPosts,
      trendingTopics,
      healthScore
    }
  }

  // Get recent activity by category
  async getRecentPostsByCategory(): Promise<Record<PostCategory, Post[]>> {
    const categories = Object.values(PostCategory)
    
    const categoryPosts = await Promise.allSettled(
      categories.map(category => 
        this.getRecentPosts({ limit: 3, category })
      )
    )

    const result: Record<PostCategory, Post[]> = {} as Record<PostCategory, Post[]>
    
    categories.forEach((category, index) => {
      const posts = categoryPosts[index]
      result[category] = posts.status === 'fulfilled' ? posts.value : []
    })

    return result
  }

  // Get dashboard statistics
  async getStatistics(): Promise<{
    totalPostsToday: number
    totalPostsWeek: number
    healthScore: number
    sentimentBreakdown: Record<string, number>
    activityChange: number
  }> {
    const overview = await this.getOverview()
    
    return {
      totalPostsToday: overview.total_posts_today,
      totalPostsWeek: overview.total_posts_week,
      healthScore: overview.community_health_score,
      sentimentBreakdown: overview.sentiment_breakdown,
      activityChange: overview.recent_activity_change
    }
  }

  // Poll for real-time updates (simplified version)
  startPolling(callback: (data: DashboardOverview) => void, interval: number = 30000): () => void {
    const pollFunction = async () => {
      try {
        const data = await this.getOverview()
        callback(data)
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }

    // Initial fetch
    pollFunction()
    
    // Set up interval
    const intervalId = setInterval(pollFunction, interval)
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId)
    }
  }
}

// Create and export service instance
export const dashboardService = new DashboardService()
export default dashboardService

// Export additional utilities for dashboard
export const getDashboardCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  return `dashboard:${endpoint}${params ? `:${JSON.stringify(params)}` : ''}`
}

// Helper function to format health score
export const formatHealthScore = (score: number): { 
  value: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  color: string 
} => {
  let status: 'excellent' | 'good' | 'warning' | 'critical'
  let color: string

  if (score >= 90) {
    status = 'excellent'
    color = 'text-green-600'
  } else if (score >= 75) {
    status = 'good'
    color = 'text-blue-600'
  } else if (score >= 50) {
    status = 'warning'
    color = 'text-yellow-600'
  } else {
    status = 'critical'
    color = 'text-red-600'
  }

  return { value: score, status, color }
}

// Helper function to format activity change
export const formatActivityChange = (change: number): {
  value: number
  direction: 'up' | 'down' | 'stable'
  color: string
  icon: string
} => {
  const direction = change > 1 ? 'up' : change < -1 ? 'down' : 'stable'
  
  let color: string
  let icon: string

  switch (direction) {
    case 'up':
      color = 'text-green-600'
      icon = '↗'
      break
    case 'down':
      color = 'text-red-600'
      icon = '↘'
      break
    default:
      color = 'text-gray-600'
      icon = '→'
  }

  return { value: Math.abs(change), direction, color, icon }
}