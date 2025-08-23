import { BaseEntity, DateRange } from './index'
import { SentimentLabel, PostCategory } from './post'

// Daily analytics entity
export interface DailyAnalytics extends BaseEntity {
  date: string
  total_posts: number
  total_authors: number
  sentiment_breakdown: Record<SentimentLabel, number>
  top_topics: string[]
  most_active_category: PostCategory
  average_sentiment: number
}

// Sentiment trend over time
export interface SentimentTrend {
  date: string
  positive_count: number
  negative_count: number
  neutral_count: number
  average_sentiment: number
}

// Topic trend analysis
export interface TopicTrend {
  topic: string
  count: number
  sentiment_average: number
  trending_score: number
  last_seen: string
  categories?: PostCategory[]
  growth_rate?: number
  peak_date?: string
}

// Analytics range query response
export interface AnalyticsRange {
  start_date: string
  end_date: string
  total_days: number
  analytics: DailyAnalytics[]
}

// Sentiment trends response
export interface SentimentTrendsResponse {
  period: string
  start_date: string
  end_date: string
  trends: SentimentTrend[]
  summary: {
    overall_trend: 'improving' | 'stable' | 'declining'
    average_sentiment_change: number
    total_posts: number
  }
}

// Topic trends response
export interface TopicTrendsResponse {
  total_topics: number
  min_score_filter: number
  topics: TopicTrend[]
  time_period: string
}

// Topic history
export interface TopicHistory {
  topic: string
  period_days: number
  data_points: number
  history: Array<{
    date: string
    count: number
    sentiment_average: number
    trending_score: number
    categories: PostCategory[]
    last_seen: string
  }>
}

// Forum comparison
export interface ForumComparison {
  period_days: number
  total_forums: number
  comparison: Record<PostCategory, ForumStats>
  summary: {
    most_active: PostCategory
    total_posts: number
    total_unique_authors: number
  }
}

export interface ForumStats {
  post_count: number
  author_count: number
  average_sentiment: number
  posts_per_author: number
  activity_trend?: 'increasing' | 'stable' | 'decreasing'
  top_topics?: string[]
}

// Comprehensive analytics summary
export interface AnalyticsSummary {
  period: string
  start_date: string
  end_date: string
  summary: {
    total_posts: number
    total_authors: number
    average_sentiment: number
    sentiment_breakdown: Record<SentimentLabel, number>
    top_topics: string[]
    category_activity: Record<PostCategory, number>
  }
  daily_average: {
    posts_per_day: number
    authors_per_day: number
  }
  trends: {
    sentiment_trend: 'improving' | 'stable' | 'declining'
    activity_trend: 'increasing' | 'stable' | 'decreasing'
    engagement_trend: 'up' | 'stable' | 'down'
  }
}

// Real-time analytics
export interface RealTimeAnalytics {
  current_online_users?: number
  posts_this_hour: number
  posts_today: number
  active_discussions: number
  trending_now: string[]
  sentiment_pulse: {
    current: number
    trend: 'up' | 'down' | 'stable'
    change_percent: number
  }
}

// Performance metrics
export interface PerformanceMetrics {
  response_time_avg: number
  community_health_score: number
  engagement_rate: number
  resolution_rate: number
  satisfaction_score: number
  activity_score: number
}

// Predictive analytics
export interface PredictiveInsights {
  predicted_volume: {
    next_hour: number
    next_day: number
    next_week: number
    confidence: number
  }
  emerging_topics: Array<{
    topic: string
    growth_rate: number
    predicted_peak: string
  }>
  risk_indicators: Array<{
    indicator: string
    risk_level: 'low' | 'medium' | 'high'
    description: string
  }>
}

// Time series data point
export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  label?: string
  metadata?: Record<string, any>
}

// Aggregated metrics
export interface AggregatedMetrics {
  time_period: 'hour' | 'day' | 'week' | 'month'
  metrics: Array<{
    name: string
    value: number
    change: number
    change_percent: number
    trend: 'up' | 'down' | 'stable'
  }>
}

// Analytics query options
export interface AnalyticsQuery {
  date_range?: DateRange
  categories?: PostCategory[]
  metrics?: string[]
  granularity?: 'hour' | 'day' | 'week' | 'month'
  include_predictions?: boolean
  include_comparisons?: boolean
}

// Export options for analytics
export interface AnalyticsExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf'
  query: AnalyticsQuery
  include_charts: boolean
  include_raw_data: boolean
  email_recipients?: string[]
}

// Alert configuration
export interface AnalyticsAlert {
  id: string
  name: string
  metric: string
  condition: 'above' | 'below' | 'change'
  threshold: number
  enabled: boolean
  recipients: string[]
  frequency: 'immediate' | 'hourly' | 'daily'
}

// Analytics widget configuration
export interface AnalyticsWidgetConfig {
  id: string
  type: 'chart' | 'metric' | 'table' | 'list'
  title: string
  position: { x: number; y: number; width: number; height: number }
  query: AnalyticsQuery
  refresh_interval: number
  visible: boolean
}