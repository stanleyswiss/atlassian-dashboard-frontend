import { SentimentLabel, PostCategory } from './post'

// Main dashboard overview interface
export interface DashboardOverview {
  total_posts_today: number
  total_posts_week: number
  community_health_score: number
  most_active_forum: PostCategory
  sentiment_breakdown: Record<SentimentLabel, number>
  recent_activity_change: number
  top_issues: string[]
}

// Dashboard widget interfaces
export interface Widget {
  id: string
  type: WidgetType
  title: string
  size: WidgetSize
  position: WidgetPosition
  data: any
  config: WidgetConfig
  loading: boolean
  error?: string
}

export enum WidgetType {
  STATS_CARD = 'stats_card',
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  RECENT_POSTS = 'recent_posts',
  TRENDING_TOPICS = 'trending_topics',
  SENTIMENT_GAUGE = 'sentiment_gauge',
  ACTIVITY_FEED = 'activity_feed',
  HEALTH_MONITOR = 'health_monitor'
}

export enum WidgetSize {
  SMALL = 'small',      // 1x1
  MEDIUM = 'medium',    // 2x1 or 1x2
  LARGE = 'large',      // 2x2
  XLARGE = 'xlarge'     // 3x2 or 2x3
}

export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface WidgetConfig {
  refreshInterval?: number
  showHeader?: boolean
  showFooter?: boolean
  colorScheme?: string
  customSettings?: Record<string, any>
}

// Stats card specific types
export interface StatsCardData {
  value: string | number
  label: string
  change?: {
    value: number
    percentage: number
    direction: 'up' | 'down' | 'stable'
    period: string
  }
  trend?: Array<{ date: string; value: number }>
  color?: string
  icon?: string
}

// Chart data types
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
  options?: ChartOptions
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  fill?: boolean
  tension?: number
}

export interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: Record<string, any>
  scales?: Record<string, any>
}

// Activity feed types
export interface ActivityFeedItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  user?: string
  category?: PostCategory
  sentiment?: SentimentLabel
  metadata?: Record<string, any>
}

export enum ActivityType {
  POST_CREATED = 'post_created',
  POST_UPDATED = 'post_updated',
  SENTIMENT_ALERT = 'sentiment_alert',
  TREND_DETECTED = 'trend_detected',
  HEALTH_CHANGE = 'health_change',
  MILESTONE_REACHED = 'milestone_reached'
}

// Health monitor types
export interface HealthMonitorData {
  current_score: number
  previous_score: number
  trend: 'improving' | 'stable' | 'declining'
  factors: HealthFactor[]
  alerts: HealthAlert[]
  last_updated: string
}

export interface HealthFactor {
  name: string
  current_value: number
  target_value: number
  weight: number
  status: 'good' | 'warning' | 'critical'
  description: string
}

export interface HealthAlert {
  id: string
  severity: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
  acknowledged: boolean
  action_required?: string
}

// Dashboard layout and customization
export interface DashboardLayout {
  id: string
  name: string
  widgets: Widget[]
  settings: DashboardSettings
  created_at: string
  updated_at: string
}

export interface DashboardSettings {
  theme: 'light' | 'dark' | 'auto'
  refresh_interval: number
  auto_refresh: boolean
  compact_mode: boolean
  show_grid: boolean
  grid_size: number
  animations_enabled: boolean
}

// Dashboard filters
export interface DashboardFilters {
  date_range: {
    start: string
    end: string
    preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  }
  categories: PostCategory[]
  sentiment: SentimentLabel[]
  authors: string[]
}

// KPI (Key Performance Indicator) types
export interface KPI {
  id: string
  name: string
  value: number
  target: number
  unit: string
  format: 'number' | 'percentage' | 'currency' | 'duration'
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
}

// Notification types
export interface DashboardNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    url: string
  }
}

// Time range selector
export interface TimeRange {
  label: string
  value: string
  start: string
  end: string
  custom: boolean
}

// Export/share options
export interface DashboardExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv'
  widgets: string[]
  include_data: boolean
  include_charts: boolean
  date_range: TimeRange
}

export interface ShareDashboardOptions {
  type: 'link' | 'embed' | 'email'
  permissions: 'view' | 'edit'
  expires_at?: string
  password_protected?: boolean
}

// Real-time updates
export interface RealTimeMetrics {
  active_users: number
  posts_per_minute: number
  current_sentiment: number
  trending_topics: string[]
  alerts_count: number
  system_status: 'operational' | 'degraded' | 'down'
}

// Dashboard performance
export interface DashboardPerformance {
  load_time: number
  render_time: number
  api_response_times: Record<string, number>
  error_rate: number
  cache_hit_rate: number
}

// Widget interactions
export interface WidgetInteraction {
  widget_id: string
  action: 'click' | 'hover' | 'resize' | 'move' | 'configure'
  timestamp: string
  user_id?: string
  metadata?: Record<string, any>
}

// Comparison periods
export interface ComparisonPeriod {
  current: TimeRange
  comparison: TimeRange
  metrics: Array<{
    name: string
    current_value: number
    comparison_value: number
    change: number
    change_percentage: number
  }>
}

// Dashboard templates
export interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: 'overview' | 'analytics' | 'monitoring' | 'custom'
  widgets: Widget[]
  preview_image?: string
  tags: string[]
  created_by: string
  usage_count: number
}