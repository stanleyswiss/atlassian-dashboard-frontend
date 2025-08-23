import { BaseEntity } from './index'

// Enums matching backend models
export enum SentimentLabel {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

export enum PostCategory {
  JIRA = 'jira',
  JSM = 'jsm',
  CONFLUENCE = 'confluence',
  ROVO = 'rovo',
  ANNOUNCEMENTS = 'announcements'
}

// Base post interface
export interface PostBase {
  title: string
  content: string
  author: string
  category: PostCategory
  url: string
  excerpt: string
  date: string
  sentiment_score?: number | null
  sentiment_label?: SentimentLabel | null
}

// Full post entity (from API responses)
export interface Post extends PostBase, BaseEntity {}

// Post creation payload
export interface CreatePostRequest extends Omit<PostBase, 'date'> {
  date?: string // Optional for creation
}

// Post update payload
export interface UpdatePostRequest extends Partial<PostBase> {}

// Post filter options
export interface PostFilters {
  category?: PostCategory
  author?: string
  sentiment?: SentimentLabel
  search?: string
  skip?: number
  limit?: number
}

// Post list response
export interface PostListResponse {
  posts: Post[]
  total: number
  skip: number
  limit: number
  has_more: boolean
}

// Post statistics
export interface PostStatistics {
  total_posts: number
  total_authors: number
  category_breakdown: Record<PostCategory, number>
  sentiment_breakdown: Record<SentimentLabel, number>
  average_sentiment: number
  top_authors: Array<{
    author: string
    post_count: number
  }>
}

// Post search results
export interface PostSearchResult {
  posts: Post[]
  query: string
  total_results: number
  search_time_ms: number
}

// AI Analysis results for posts
export interface PostAnalysis {
  post_id: number
  sentiment_score: number
  sentiment_label: SentimentLabel
  confidence: number
  key_emotions: string[]
  extracted_topics: string[]
  analysis_timestamp: string
}

// Recent post activity
export interface RecentActivity {
  posts_last_hour: number
  posts_last_24h: number
  posts_last_week: number
  trending_authors: string[]
  most_discussed_topics: string[]
}

// Post engagement metrics
export interface PostEngagement {
  post_id: number
  view_count?: number
  reply_count?: number
  like_count?: number
  share_count?: number
  engagement_score: number
}

// Bulk post operations
export interface BulkPostOperation {
  action: 'delete' | 'update_sentiment' | 'update_category'
  post_ids: number[]
  payload?: UpdatePostRequest
}

export interface BulkOperationResult {
  success_count: number
  error_count: number
  errors: Array<{
    post_id: number
    error: string
  }>
}

// Post export options
export interface PostExportOptions {
  format: 'json' | 'csv' | 'xlsx'
  filters?: PostFilters
  include_content: boolean
  include_analysis: boolean
  date_range?: {
    start: string
    end: string
  }
}

// Sentiment distribution
export interface SentimentDistribution {
  positive: {
    count: number
    percentage: number
  }
  negative: {
    count: number
    percentage: number
  }
  neutral: {
    count: number
    percentage: number
  }
}

// Category activity
export interface CategoryActivity {
  category: PostCategory
  post_count: number
  author_count: number
  average_sentiment: number
  recent_posts: Post[]
  activity_trend: 'increasing' | 'stable' | 'decreasing'
}

// Author profile
export interface AuthorProfile {
  name: string
  total_posts: number
  categories: PostCategory[]
  average_sentiment: number
  most_active_category: PostCategory
  recent_posts: Post[]
  join_date?: string
  reputation_score?: number
}