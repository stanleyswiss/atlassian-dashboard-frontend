import api, { buildUrl, createQueryString, withCache, withRetry } from './api'
import {
  DailyAnalytics,
  AnalyticsRange,
  SentimentTrendsResponse,
  TopicTrendsResponse,
  TopicHistory,
  ForumComparison,
  AnalyticsSummary,
  DailyAnalyticsParams,
  AnalyticsRangeParams,
  SentimentTrendsParams,
  TopicTrendsParams,
  TopicHistoryParams,
  ForumComparisonParams,
  AnalyticsSummaryParams
} from '@/types'

// Analytics service class
class AnalyticsService {
  // Get analytics for a specific date
  async getDailyAnalytics(params: DailyAnalyticsParams): Promise<DailyAnalytics> {
    const { date } = params
    const url = buildUrl('/api/analytics/daily/:date', { date })
    
    return withCache(
      `analytics:daily:${date}`,
      () => withRetry(() => api.get<DailyAnalytics>(url)),
      30 * 60 * 1000 // 30 minutes cache for daily data
    )
  }

  // Get analytics for a date range
  async getAnalyticsRange(params: AnalyticsRangeParams): Promise<AnalyticsRange> {
    const queryString = createQueryString(params)
    const url = `/api/analytics/range?${queryString}`
    
    const cacheKey = `analytics:range:${JSON.stringify(params)}`
    
    return withCache(
      cacheKey,
      () => withRetry(() => api.get<AnalyticsRange>(url)),
      15 * 60 * 1000 // 15 minutes cache for range data
    )
  }

  // Get sentiment trends over time
  async getSentimentTrends(params: SentimentTrendsParams = {}): Promise<SentimentTrendsResponse> {
    const { days = 30 } = params
    const queryString = createQueryString({ days })
    const url = `/api/analytics/sentiment-trends?${queryString}`
    
    return withCache(
      `analytics:sentiment-trends:${days}`,
      () => withRetry(() => api.get<SentimentTrendsResponse>(url)),
      10 * 60 * 1000 // 10 minutes cache
    )
  }

  // Get trending topics with scores
  async getTopicTrends(params: TopicTrendsParams = {}): Promise<TopicTrendsResponse> {
    const { limit = 20, min_score = 0.0 } = params
    const queryString = createQueryString({ limit, min_score })
    const url = `/api/analytics/topic-trends?${queryString}`
    
    const cacheKey = `analytics:topic-trends:${JSON.stringify(params)}`
    
    return withCache(
      cacheKey,
      () => withRetry(() => api.get<TopicTrendsResponse>(url)),
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Get historical data for a specific topic
  async getTopicHistory(params: TopicHistoryParams): Promise<TopicHistory> {
    const { topic, days = 30 } = params
    const url = buildUrl('/api/analytics/topic/:topic/history', { topic: encodeURIComponent(topic) })
    const queryString = createQueryString({ days })
    const fullUrl = `${url}?${queryString}`
    
    const cacheKey = `analytics:topic-history:${topic}:${days}`
    
    return withCache(
      cacheKey,
      () => withRetry(() => api.get<TopicHistory>(fullUrl)),
      15 * 60 * 1000 // 15 minutes cache
    )
  }

  // Compare activity across different forums/categories
  async getForumComparison(params: ForumComparisonParams = {}): Promise<ForumComparison> {
    const { days = 7 } = params
    const queryString = createQueryString({ days })
    const url = `/api/analytics/forum-comparison?${queryString}`
    
    return withCache(
      `analytics:forum-comparison:${days}`,
      () => withRetry(() => api.get<ForumComparison>(url)),
      10 * 60 * 1000 // 10 minutes cache
    )
  }

  // Get comprehensive analytics summary
  async getAnalyticsSummary(params: AnalyticsSummaryParams = {}): Promise<AnalyticsSummary> {
    const { days = 7 } = params
    const queryString = createQueryString({ days })
    const url = `/api/analytics/summary?${queryString}`
    
    return withCache(
      `analytics:summary:${days}`,
      () => withRetry(() => api.get<AnalyticsSummary>(url)),
      10 * 60 * 1000 // 10 minutes cache
    )
  }

  // Manually trigger daily analytics generation
  async generateDailyAnalytics(date: string): Promise<{
    message: string
    analytics_id?: number
    total_posts: number
    total_authors: number
  }> {
    const url = buildUrl('/api/analytics/generate-daily/:date', { date })
    return api.post(url)
  }

  // Get analytics for current week
  async getCurrentWeekAnalytics(): Promise<AnalyticsRange> {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)
    
    const start_date = weekStart.toISOString().split('T')[0]
    const end_date = today.toISOString().split('T')[0]
    
    return this.getAnalyticsRange({ start_date, end_date })
  }

  // Get analytics for current month
  async getCurrentMonthAnalytics(): Promise<AnalyticsRange> {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const start_date = monthStart.toISOString().split('T')[0]
    const end_date = today.toISOString().split('T')[0]
    
    return this.getAnalyticsRange({ start_date, end_date })
  }

  // Compare two time periods
  async compareTimePeriods(
    currentStart: string,
    currentEnd: string,
    compareStart: string,
    compareEnd: string
  ): Promise<{
    current: AnalyticsRange
    comparison: AnalyticsRange
    changes: {
      total_posts: { value: number; percentage: number }
      total_authors: { value: number; percentage: number }
      average_sentiment: { value: number; percentage: number }
    }
  }> {
    const [current, comparison] = await Promise.all([
      this.getAnalyticsRange({ start_date: currentStart, end_date: currentEnd }),
      this.getAnalyticsRange({ start_date: compareStart, end_date: compareEnd })
    ])

    // Calculate totals for comparison
    const currentTotals = this.calculateTotals(current.analytics)
    const comparisonTotals = this.calculateTotals(comparison.analytics)

    const changes = {
      total_posts: {
        value: currentTotals.total_posts - comparisonTotals.total_posts,
        percentage: comparisonTotals.total_posts > 0 
          ? ((currentTotals.total_posts - comparisonTotals.total_posts) / comparisonTotals.total_posts) * 100 
          : 0
      },
      total_authors: {
        value: currentTotals.total_authors - comparisonTotals.total_authors,
        percentage: comparisonTotals.total_authors > 0 
          ? ((currentTotals.total_authors - comparisonTotals.total_authors) / comparisonTotals.total_authors) * 100 
          : 0
      },
      average_sentiment: {
        value: currentTotals.average_sentiment - comparisonTotals.average_sentiment,
        percentage: comparisonTotals.average_sentiment !== 0 
          ? ((currentTotals.average_sentiment - comparisonTotals.average_sentiment) / Math.abs(comparisonTotals.average_sentiment)) * 100 
          : 0
      }
    }

    return { current, comparison, changes }
  }

  // Get top performing topics
  async getTopPerformingTopics(limit: number = 10): Promise<Array<{
    topic: string
    score: number
    sentiment: number
    count: number
    growth: number
  }>> {
    const topics = await this.getTopicTrends({ limit: limit * 2, min_score: 0.1 })
    
    // Sort by trending score and sentiment
    return topics.topics
      .map(topic => ({
        topic: topic.topic,
        score: topic.trending_score,
        sentiment: topic.sentiment_average,
        count: topic.count,
        growth: topic.trending_score // Simplified growth calculation
      }))
      .sort((a, b) => (b.score * (1 + b.sentiment)) - (a.score * (1 + a.sentiment)))
      .slice(0, limit)
  }

  // Get sentiment insights
  async getSentimentInsights(days: number = 30): Promise<{
    overall_trend: 'improving' | 'stable' | 'declining'
    current_sentiment: number
    sentiment_change: number
    positive_topics: string[]
    negative_topics: string[]
  }> {
    const [trends, topics] = await Promise.all([
      this.getSentimentTrends({ days }),
      this.getTopicTrends({ limit: 20, min_score: 0.1 })
    ])

    const sentimentData = trends.trends
    const currentSentiment = sentimentData[sentimentData.length - 1]?.average_sentiment || 0
    const previousSentiment = sentimentData[sentimentData.length - 7]?.average_sentiment || 0
    
    const sentimentChange = currentSentiment - previousSentiment
    let overall_trend: 'improving' | 'stable' | 'declining' = 'stable'
    
    if (Math.abs(sentimentChange) < 0.05) {
      overall_trend = 'stable'
    } else if (sentimentChange > 0) {
      overall_trend = 'improving'
    } else {
      overall_trend = 'declining'
    }

    const positive_topics = topics.topics
      .filter(topic => topic.sentiment_average > 0.1)
      .slice(0, 5)
      .map(topic => topic.topic)

    const negative_topics = topics.topics
      .filter(topic => topic.sentiment_average < -0.1)
      .slice(0, 5)
      .map(topic => topic.topic)

    return {
      overall_trend,
      current_sentiment: currentSentiment,
      sentiment_change: sentimentChange,
      positive_topics,
      negative_topics
    }
  }

  // Export analytics data
  async exportAnalytics(
    start_date: string,
    end_date: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const data = await this.getAnalyticsRange({ start_date, end_date })
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    }
    
    // CSV export
    const csvRows = [
      'Date,Total Posts,Total Authors,Average Sentiment,Most Active Category,Top Topics'
    ]
    
    data.analytics.forEach(day => {
      const row = [
        day.date,
        day.total_posts,
        day.total_authors,
        day.average_sentiment.toFixed(2),
        day.most_active_category,
        day.top_topics.join(';')
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  // Helper method to calculate totals from analytics array
  private calculateTotals(analytics: DailyAnalytics[]): {
    total_posts: number
    total_authors: number
    average_sentiment: number
  } {
    const totals = analytics.reduce(
      (acc, day) => ({
        total_posts: acc.total_posts + day.total_posts,
        total_authors: acc.total_authors + day.total_authors,
        sentiment_sum: acc.sentiment_sum + (day.average_sentiment * day.total_posts),
        sentiment_posts: acc.sentiment_posts + day.total_posts
      }),
      { total_posts: 0, total_authors: 0, sentiment_sum: 0, sentiment_posts: 0 }
    )

    return {
      total_posts: totals.total_posts,
      total_authors: totals.total_authors,
      average_sentiment: totals.sentiment_posts > 0 ? totals.sentiment_sum / totals.sentiment_posts : 0
    }
  }

  // Clear analytics cache
  clearCache(): void {
    if (import.meta.env.DEV) {
      console.log('🗑️ Clearing analytics cache')
    }
    // Implementation would depend on cache system
  }
}

// Create and export service instance
export const analyticsService = new AnalyticsService()
export default analyticsService

// Utility functions for analytics data formatting
export const formatAnalyticsDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export const formatTrendingScore = (score: number): string => {
  return `${(score * 100).toFixed(1)}%`
}

export const formatSentimentScore = (score: number): {
  value: string
  color: string
  label: string
} => {
  const value = score.toFixed(2)
  let color: string
  let label: string

  if (score > 0.3) {
    color = 'text-green-600'
    label = 'Very Positive'
  } else if (score > 0.1) {
    color = 'text-green-500'
    label = 'Positive'
  } else if (score > -0.1) {
    color = 'text-gray-600'
    label = 'Neutral'
  } else if (score > -0.3) {
    color = 'text-red-500'
    label = 'Negative'
  } else {
    color = 'text-red-600'
    label = 'Very Negative'
  }

  return { value, color, label }
}

export const calculateGrowthRate = (current: number, previous: number): {
  value: number
  percentage: string
  direction: 'up' | 'down' | 'stable'
  color: string
} => {
  const change = current - previous
  const percentage = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0
  
  let direction: 'up' | 'down' | 'stable' = 'stable'
  let color = 'text-gray-600'

  if (Math.abs(percentage) < 1) {
    direction = 'stable'
  } else if (percentage > 0) {
    direction = 'up'
    color = 'text-green-600'
  } else {
    direction = 'down'
    color = 'text-red-600'
  }

  return {
    value: change,
    percentage: `${percentage.toFixed(1)}%`,
    direction,
    color
  }
}