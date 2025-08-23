// Re-export all types for convenient importing
export * from './post'
export * from './analytics'
export * from './dashboard'
export * from './api'

// Common utility types
export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

export interface ApiError {
  detail: string
  status_code?: number
}

export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface FilterParams {
  category?: string
  author?: string
  sentiment?: string
  search?: string
}

export interface DateRange {
  start_date: string
  end_date: string
}

export interface LoadingState<T = null> {
  status: Status
  data: T | null
  error: string | null
}

// Chart data interfaces
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface SentimentChartData {
  date: string
  positive: number
  negative: number
  neutral: number
}

export interface CategoryChartData {
  category: string
  count: number
  percentage: number
  color?: string
}

// Theme and styling types
export type ColorScheme = 'light' | 'dark' | 'auto'

export type SentimentColor = 'positive' | 'negative' | 'neutral'

export interface ThemeConfig {
  colorScheme: ColorScheme
  primaryColor: string
  accentColor: string
}

// Component prop types
export interface WithChildren {
  children: React.ReactNode
}

export interface WithClassName {
  className?: string
}

export interface WithTestId {
  'data-testid'?: string
}

// Generic component props
export type ComponentProps<T = {}> = T & WithChildren & WithClassName & WithTestId