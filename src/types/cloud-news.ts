// Cloud News types
import { BaseEntity } from './index'

export enum FeatureType {
  NEW_THIS_WEEK = "NEW_THIS_WEEK",
  COMING_SOON = "COMING_SOON"
}

export enum TargetAudience {
  ADMINISTRATORS = "administrators",
  END_USERS = "end_users",
  DEVELOPERS = "developers",
  ALL_USERS = "all_users"
}

export interface CloudNews extends BaseEntity {
  source_url: string
  blog_date: string
  blog_title: string
  feature_title: string
  feature_content: string
  feature_type: FeatureType
  product_area?: string
  ai_summary?: string
  ai_impact_description?: string
  ai_target_audience?: TargetAudience
  ai_tags?: string[]
}

export interface CloudNewsSummary {
  id: number
  feature_title: string
  feature_type: FeatureType
  product_area?: string
  blog_date: string
  ai_summary?: string
  ai_target_audience?: TargetAudience
}

export interface CloudNewsFilters {
  feature_type?: FeatureType
  product_area?: string
  days_back?: number
  target_audience?: TargetAudience
  skip?: number
  limit?: number
  search?: string
}

export interface CloudNewsStats {
  total_features: number
  new_this_week: number
  coming_soon: number
  product_breakdown: Record<string, number>
  recent_updates: CloudNewsSummary[]
}

export interface ProductArea {
  name: string
  feature_count: number
}

export interface CloudNewsGroupedByType {
  new_this_week: Array<{
    id: number
    feature_title: string
    product_area?: string
    blog_date: string
    ai_summary?: string
  }>
  coming_soon: Array<{
    id: number
    feature_title: string
    product_area?: string
    blog_date: string
    ai_summary?: string
  }>
  days_back: number
}

// UI-specific types
export interface CloudNewsCardProps {
  news: CloudNews | CloudNewsSummary
  showFullDetails?: boolean
  onAnalyze?: (id: number) => void
}

export interface CloudNewsFiltersProps {
  filters: CloudNewsFilters
  onFiltersChange: (filters: CloudNewsFilters) => void
  availableProductAreas: ProductArea[]
  isLoading?: boolean
}

export interface CloudNewsListProps {
  newsItems: CloudNews[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export interface CloudNewsTabsProps {
  groupedNews: CloudNewsGroupedByType
  isLoading?: boolean
}

// API request/response types
export interface CloudNewsApiResponse {
  news: CloudNews[]
  total: number
  skip: number
  limit: number
}

export interface ScrapeCloudNewsRequest {
  days_back?: number
}

export interface ScrapeCloudNewsResponse {
  message: string
  days_back: number
  status: string
}

export interface CloudNewsSearchParams {
  query: string
  feature_type?: FeatureType
  product_area?: string
  skip?: number
  limit?: number
}

// Dashboard integration types
export interface CloudNewsOverviewProps {
  stats: CloudNewsStats
  recentUpdates: CloudNewsSummary[]
  onViewAll: () => void
  isLoading?: boolean
}