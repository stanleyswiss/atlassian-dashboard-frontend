import api, { buildUrl, createQueryString, withRetry } from './api'
import {
  ReleaseNote,
  ReleaseNoteSummary,
  ReleaseNoteFilters,
  ReleaseNoteStats,
  ProductInfo,
  ProductType,
  ImpactLevel,
  ScrapeReleaseNotesRequest,
  ScrapeReleaseNotesResponse
} from '@/types'

// Release Notes service class
class ReleaseNotesService {
  private cacheKeyPrefix = 'release-notes'

  // Get release notes with filtering and pagination
  async getReleaseNotes(filters: ReleaseNoteFilters = {}): Promise<ReleaseNote[]> {
    const queryString = createQueryString(filters)
    const url = `/api/release-notes/${queryString ? `?${queryString}` : ''}`
    
    return withRetry(() => api.get<ReleaseNote[]>(url))
  }

  // Get summarized release notes for dashboard display
  async getReleaseNotesSummary(filters: Partial<ReleaseNoteFilters> = {}): Promise<ReleaseNoteSummary[]> {
    const queryString = createQueryString(filters)
    const url = `/api/release-notes/summary${queryString ? `?${queryString}` : ''}`
    
    return withRetry(() => api.get<ReleaseNoteSummary[]>(url))
  }

  // Get a single release note by ID
  async getReleaseNote(id: number): Promise<ReleaseNote> {
    const url = buildUrl('/api/release-notes/:id', { id })
    return withRetry(() => api.get<ReleaseNote>(url))
  }

  // Get release notes statistics
  async getReleaseNotesStats(daysBack: number = 7): Promise<ReleaseNoteStats> {
    const url = `/api/release-notes/stats/overview?days_back=${daysBack}`
    return withRetry(() => api.get<ReleaseNoteStats>(url))
  }

  // Get available products
  async getAvailableProducts(): Promise<ProductInfo[]> {
    return withRetry(() => api.get<ProductInfo[]>('/api/release-notes/products/list'))
  }

  // Trigger release notes scraping
  async triggerScrape(request: ScrapeReleaseNotesRequest = {}): Promise<ScrapeReleaseNotesResponse> {
    const queryString = createQueryString(request)
    const url = `/api/release-notes/scrape${queryString ? `?${queryString}` : ''}`
    
    return api.post<ScrapeReleaseNotesResponse>(url, {})
  }

  // Trigger AI analysis for a specific release note
  async analyzeReleaseNote(id: number): Promise<{ message: string; release: any }> {
    return api.post(`/api/release-notes/${id}/analyze`, {})
  }

  // Get recent release notes (last N releases)
  async getRecentReleaseNotes(limit: number = 10, productType?: ProductType): Promise<ReleaseNote[]> {
    const filters: ReleaseNoteFilters = { 
      limit, 
      skip: 0, 
      days_back: 30, // Look back 30 days for "recent"
      product_type: productType 
    }
    return this.getReleaseNotes(filters)
  }

  // Get major releases only
  async getMajorReleases(limit: number = 20, daysBack: number = 30): Promise<ReleaseNote[]> {
    const filters: ReleaseNoteFilters = { 
      limit, 
      skip: 0, 
      days_back: daysBack,
      major_releases_only: true
    }
    return this.getReleaseNotes(filters)
  }

  // Get security releases only
  async getSecurityReleases(limit: number = 20, daysBack: number = 90): Promise<ReleaseNote[]> {
    const filters: ReleaseNoteFilters = { 
      limit, 
      skip: 0, 
      days_back: daysBack,
      security_releases_only: true
    }
    return this.getReleaseNotes(filters)
  }

  // Get releases by product
  async getReleasesByProduct(productName: string, limit: number = 20): Promise<ReleaseNote[]> {
    const filters: ReleaseNoteFilters = { 
      limit, 
      skip: 0, 
      product_name: productName,
      days_back: 90
    }
    return this.getReleaseNotes(filters)
  }

  // Get releases by impact level
  async getReleasesByImpact(impactLevel: ImpactLevel, limit: number = 20): Promise<ReleaseNote[]> {
    const filters: ReleaseNoteFilters = { 
      limit, 
      skip: 0, 
      impact_level: impactLevel,
      days_back: 30
    }
    return this.getReleaseNotes(filters)
  }

  // Get releases with pagination
  async getReleasesPaginated(page: number = 1, pageSize: number = 20, filters: Omit<ReleaseNoteFilters, 'skip' | 'limit'> = {}): Promise<{
    releases: ReleaseNote[]
    pagination: {
      page: number
      pageSize: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }> {
    const skip = (page - 1) * pageSize
    const limit = pageSize + 1 // Get one extra to check if there are more

    const allFilters: ReleaseNoteFilters = {
      ...filters,
      skip,
      limit
    }

    const releases = await this.getReleaseNotes(allFilters)
    const hasNext = releases.length > pageSize
    const actualReleases = hasNext ? releases.slice(0, pageSize) : releases

    return {
      releases: actualReleases,
      pagination: {
        page,
        pageSize,
        hasNext,
        hasPrevious: page > 1
      }
    }
  }

  // Advanced search/filtering
  async advancedSearch(options: {
    productTypes?: ProductType[]
    productNames?: string[]
    impactLevels?: ImpactLevel[]
    onlyMajorReleases?: boolean
    onlySecurityReleases?: boolean
    daysBack?: number
    limit?: number
    skip?: number
  }): Promise<ReleaseNote[]> {
    // For now, we'll implement client-side filtering since the backend
    // supports single values. In a real app, you'd extend the backend API.
    const { 
      productTypes, productNames, impactLevels, 
      onlyMajorReleases, onlySecurityReleases,
      daysBack, limit, skip 
    } = options

    // Start with the most restrictive filter
    const baseFilters: ReleaseNoteFilters = {
      days_back: daysBack || 30,
      limit: limit || 100, // Get more results for client-side filtering
      skip: skip || 0,
      major_releases_only: onlyMajorReleases,
      security_releases_only: onlySecurityReleases
    }

    // Use first product type if multiple specified
    if (productTypes && productTypes.length > 0) {
      baseFilters.product_type = productTypes[0]
    }

    // Use first impact level if multiple specified
    if (impactLevels && impactLevels.length > 0) {
      baseFilters.impact_level = impactLevels[0]
    }

    let releases = await this.getReleaseNotes(baseFilters)

    // Apply client-side filtering for multiple values
    if (productTypes && productTypes.length > 1) {
      releases = releases.filter(release => productTypes.includes(release.product_type))
    }

    if (productNames && productNames.length > 0) {
      releases = releases.filter(release => 
        productNames.some(name => 
          release.product_name.toLowerCase().includes(name.toLowerCase())
        )
      )
    }

    if (impactLevels && impactLevels.length > 1) {
      releases = releases.filter(release => 
        release.ai_impact_level && impactLevels.includes(release.ai_impact_level)
      )
    }

    return releases.slice(0, limit || 50)
  }

  // Get release notes grouped by product type
  async getReleaseNotesGroupedByType(): Promise<Record<ProductType, ReleaseNote[]>> {
    const [atlassianReleases, marketplaceReleases] = await Promise.allSettled([
      this.getReleaseNotes({ product_type: ProductType.ATLASSIAN_PRODUCT, limit: 20 }),
      this.getReleaseNotes({ product_type: ProductType.MARKETPLACE_APP, limit: 20 })
    ])

    return {
      [ProductType.ATLASSIAN_PRODUCT]: atlassianReleases.status === 'fulfilled' ? atlassianReleases.value : [],
      [ProductType.MARKETPLACE_APP]: marketplaceReleases.status === 'fulfilled' ? marketplaceReleases.value : []
    }
  }

  // Get top products by release count
  async getTopProductsByReleaseCount(limit: number = 10): Promise<ProductInfo[]> {
    const products = await this.getAvailableProducts()
    return products
      .sort((a, b) => b.release_count - a.release_count)
      .slice(0, limit)
  }

  // Validate release note data
  validateReleaseNoteData(release: Partial<ReleaseNote>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!release.product_name || release.product_name.trim().length === 0) {
      errors.push('Product name is required')
    }

    if (!release.version || release.version.trim().length === 0) {
      errors.push('Version is required')
    }

    if (!release.release_date) {
      errors.push('Release date is required')
    }

    if (!Object.values(ProductType).includes(release.product_type as ProductType)) {
      errors.push('Valid product type is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Clear cache for this service
  clearCache(): void {
    // Implementation would depend on your caching strategy
    console.log('🗑️ Release notes service cache cleared')
  }

  // Helper method to format release date
  formatReleaseDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper method to get impact level color
  getImpactLevelColor(level?: ImpactLevel): string {
    switch (level) {
      case ImpactLevel.HIGH:
        return 'text-red-600 bg-red-50'
      case ImpactLevel.MEDIUM:
        return 'text-yellow-600 bg-yellow-50'
      case ImpactLevel.LOW:
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Helper method to get product type display name
  getProductTypeDisplayName(type: ProductType): string {
    switch (type) {
      case ProductType.ATLASSIAN_PRODUCT:
        return 'Atlassian Product'
      case ProductType.MARKETPLACE_APP:
        return 'Marketplace App'
      default:
        return type
    }
  }
}

// Create and export service instance
export const releaseNotesService = new ReleaseNotesService()
export default releaseNotesService