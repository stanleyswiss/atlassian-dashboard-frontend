import { 
  Post, 
  PostFilters, 
  PostStatistics,
  BulkPostOperation,
  BulkOperationResult
} from './post'
import { 
  DailyAnalytics,
  TopicHistory,
  ForumComparison,
  AnalyticsSummary
} from './analytics'
import { DashboardOverview } from './dashboard'

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data: T
  status: number
  message?: string
  timestamp: string
}

// Generic error response
export interface ApiErrorResponse {
  detail: string
  status_code: number
  error_type?: string
  timestamp: string
}

// Pagination response wrapper
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
  has_next: boolean
  has_previous: boolean
  page: number
  total_pages: number
}

// API endpoint configurations
export interface ApiEndpoints {
  // Health and info
  health: '/health'
  root: '/'
  
  // Dashboard endpoints
  dashboard: {
    overview: '/api/dashboard/overview'
    recentPosts: '/api/dashboard/recent-posts'
    trendingTopics: '/api/dashboard/trending-topics'
    sentimentTimeline: '/api/dashboard/sentiment-timeline'
    refreshData: '/api/dashboard/refresh-data'
    healthScore: '/api/dashboard/health-score'
  }
  
  // Posts endpoints
  posts: {
    list: '/api/posts/'
    create: '/api/posts/'
    getById: '/api/posts/:id'
    update: '/api/posts/:id'
    delete: '/api/posts/:id'
    search: '/api/posts/search/by-content'
    summary: '/api/posts/stats/summary'
    categories: '/api/posts/categories/'
    sentiments: '/api/posts/sentiments/'
  }
  
  // Analytics endpoints
  analytics: {
    daily: '/api/analytics/daily/:date'
    range: '/api/analytics/range'
    sentimentTrends: '/api/analytics/sentiment-trends'
    topicTrends: '/api/analytics/topic-trends'
    topicHistory: '/api/analytics/topic/:topic/history'
    forumComparison: '/api/analytics/forum-comparison'
    summary: '/api/analytics/summary'
    generateDaily: '/api/analytics/generate-daily/:date'
  }
}

// Request/Response types for each endpoint

// Dashboard API types
export interface DashboardOverviewResponse extends DashboardOverview {}

export interface RecentPostsParams {
  limit?: number
  category?: string
}

export interface RecentPostsResponse extends Array<Post> {}

export interface TrendingTopicsParams {
  limit?: number
  min_score?: number
}

export interface SentimentTimelineParams {
  days?: number
}

export interface RefreshDataRequest {
  max_posts_per_category?: number
  analyze_with_ai?: boolean
}

export interface RefreshDataResponse {
  status: string
  message: string
  result: {
    scraped_posts: number
    processed_posts: number
    duplicate_posts: number
    ai_analysis_enabled: boolean
  }
}

export interface HealthScoreResponse {
  overall_score: number
  factors: {
    activity_level: number
    unique_authors: number
    average_sentiment: number
    posts_this_week: number
  }
  recommendations: string[]
}

// Posts API types
export interface PostsListParams extends PostFilters {}
export interface PostsListResponse extends Array<Post> {}

export interface PostCreateResponse extends Post {}
export interface PostUpdateResponse extends Post {}

export interface PostSearchParams {
  query: string
  skip?: number
  limit?: number
}

export interface PostSearchResponse extends Array<Post> {}

export interface PostsSummaryResponse extends PostStatistics {}

export interface BulkPostRequest extends BulkPostOperation {}
export interface BulkPostResponse extends BulkOperationResult {}

// Analytics API types
export interface DailyAnalyticsParams {
  date: string
}

export interface DailyAnalyticsResponse extends DailyAnalytics {}

export interface AnalyticsRangeParams {
  start_date: string
  end_date: string
}

export interface SentimentTrendsParams {
  days?: number
}

export interface TopicTrendsParams {
  limit?: number
  min_score?: number
}

export interface TopicHistoryParams {
  topic: string
  days?: number
}

export interface TopicHistoryResponse extends TopicHistory {}

export interface ForumComparisonParams {
  days?: number
}

export interface ForumComparisonResponse extends ForumComparison {}

export interface AnalyticsSummaryParams {
  days?: number
}

export interface AnalyticsSummaryResponse extends AnalyticsSummary {}

// HTTP client configuration
export interface ApiClientConfig {
  baseURL: string
  timeout: number
  retries: number
  retryDelay: number
  headers: Record<string, string>
}

// Request interceptor types
export interface RequestInterceptor {
  onRequest: (config: any) => any
  onRequestError: (error: any) => Promise<any>
}

export interface ResponseInterceptor {
  onResponse: (response: any) => any
  onResponseError: (error: any) => Promise<any>
}

// API hook return types
export interface ApiHookState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface MutationHookState<T, P = any> {
  data: T | null
  loading: boolean
  error: string | null
  mutate: (params: P) => Promise<T>
  reset: () => void
}

// Caching types
export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number
  strategy: 'lru' | 'fifo' | 'none'
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

// WebSocket types for real-time updates
export interface WebSocketMessage<T = any> {
  type: string
  payload: T
  timestamp: string
}

export interface RealTimeUpdate {
  type: 'post_created' | 'post_updated' | 'analytics_updated' | 'health_changed'
  data: any
}

// API rate limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// Upload types for future file uploads
export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUploadRequest {
  file: File
  onProgress?: (progress: FileUploadProgress) => void
  metadata?: Record<string, any>
}

// Batch request types
export interface BatchRequest {
  requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url: string
    data?: any
  }>
}

export interface BatchResponse {
  responses: Array<{
    status: number
    data: any
    error?: string
  }>
}

// API versioning
export interface ApiVersion {
  version: string
  deprecated: boolean
  sunset_date?: string
  migration_guide?: string
}