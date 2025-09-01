// Release Notes types
import { BaseEntity } from './index'

export enum ProductType {
  ATLASSIAN_PRODUCT = "atlassian_product",
  MARKETPLACE_APP = "marketplace_app"
}

export enum ImpactLevel {
  HIGH = "high",
  MEDIUM = "medium", 
  LOW = "low"
}

export enum ReleaseCategory {
  BUG_FIX = "bug_fix",
  NEW_FEATURE = "new_feature",
  ENHANCEMENT = "enhancement",
  SECURITY = "security",
  DEPRECATION = "deprecation",
  PERFORMANCE = "performance"
}

export interface ReleaseNote extends BaseEntity {
  product_name: string
  product_type: ProductType
  product_id?: string
  version: string
  build_number?: string
  release_date: string
  release_summary?: string
  release_notes?: string
  release_notes_url?: string
  download_url?: string
  is_major_release: boolean
  is_security_release: boolean
  ai_summary?: string
  ai_key_changes?: string[]
  ai_impact_level?: ImpactLevel
  ai_categories?: ReleaseCategory[]
}

export interface ReleaseNoteSummary {
  id: number
  product_name: string
  product_type: ProductType
  version: string
  release_date: string
  ai_summary?: string
  ai_impact_level?: ImpactLevel
  is_major_release: boolean
  is_security_release: boolean
}

export interface ReleaseNoteFilters {
  product_type?: ProductType
  product_name?: string
  days_back?: number
  major_releases_only?: boolean
  security_releases_only?: boolean
  impact_level?: ImpactLevel
  skip?: number
  limit?: number
}

export interface ReleaseNoteStats {
  total_releases: number
  product_type_breakdown: Record<string, number>
  major_releases: number
  security_releases: number
  top_products: Array<{
    product: string
    count: number
  }>
  recent_releases: Array<{
    id: number
    product_name: string
    version: string
    release_date: string
    is_major: boolean
    is_security: boolean
  }>
  days_back: number
}

export interface ProductInfo {
  name: string
  type: ProductType
  release_count: number
}

// UI-specific types
export interface ReleaseNoteCardProps {
  release: ReleaseNote | ReleaseNoteSummary
  showFullDetails?: boolean
  onAnalyze?: (id: number) => void
}

export interface ReleaseNoteFiltersProps {
  filters: ReleaseNoteFilters
  onFiltersChange: (filters: ReleaseNoteFilters) => void
  availableProducts: ProductInfo[]
  isLoading?: boolean
}

export interface ReleaseNoteListProps {
  releases: ReleaseNote[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

// API request/response types
export interface ReleaseNotesApiResponse {
  releases: ReleaseNote[]
  total: number
  skip: number
  limit: number
}

export interface ScrapeReleaseNotesRequest {
  days_back?: number
}

export interface ScrapeReleaseNotesResponse {
  message: string
  days_back: number
  status: string
}