import api, { buildUrl, createQueryString, withRetry } from './api'
import {
  CloudNews,
  CloudNewsSummary,
  CloudNewsFilters,
  CloudNewsStats,
  ProductArea,
  FeatureType,
  TargetAudience,
  CloudNewsGroupedByType,
  ScrapeCloudNewsRequest,
  ScrapeCloudNewsResponse,
  CloudNewsSearchParams
} from '@/types'

// Cloud News service class
class CloudNewsService {
  private cacheKeyPrefix = 'cloud-news'

  // Get cloud news with filtering and pagination
  async getCloudNews(filters: CloudNewsFilters = {}): Promise<CloudNews[]> {
    const queryString = createQueryString(filters)
    const url = `/api/cloud-news/${queryString ? `?${queryString}` : ''}`
    
    return withRetry(() => api.get<CloudNews[]>(url))
  }

  // Get summarized cloud news for dashboard display
  async getCloudNewsSummary(filters: Partial<CloudNewsFilters> = {}): Promise<CloudNewsSummary[]> {
    const queryString = createQueryString(filters)
    const url = `/api/cloud-news/summary${queryString ? `?${queryString}` : ''}`
    
    return withRetry(() => api.get<CloudNewsSummary[]>(url))
  }

  // Get a single cloud news item by ID
  async getCloudNewsItem(id: number): Promise<CloudNews> {
    const url = buildUrl('/api/cloud-news/:id', { id })
    return withRetry(() => api.get<CloudNews>(url))
  }

  // Get cloud news statistics (increased default to show more historical data)
  async getCloudNewsStats(daysBack: number = 60): Promise<CloudNewsStats> {
    const url = `/api/cloud-news/stats/overview?days_back=${daysBack}`
    return withRetry(() => api.get<CloudNewsStats>(url))
  }

  // Get available product areas
  async getAvailableProductAreas(): Promise<ProductArea[]> {
    return withRetry(() => api.get<ProductArea[]>('/api/cloud-news/products/list'))
  }

  // Get features grouped by type (increased default to show more historical data)
  async getFeaturesByType(daysBack: number = 60): Promise<CloudNewsGroupedByType> {
    const url = `/api/cloud-news/features/by-type?days_back=${daysBack}`
    return withRetry(() => api.get<CloudNewsGroupedByType>(url))
  }

  // Search cloud news by content
  async searchCloudNews(params: CloudNewsSearchParams): Promise<CloudNews[]> {
    const queryString = createQueryString(params)
    const url = `/api/cloud-news/search/by-content?${queryString}`
    
    return withRetry(() => api.get<CloudNews[]>(url))
  }

  // Trigger cloud news scraping
  async triggerScrape(request: ScrapeCloudNewsRequest = {}): Promise<ScrapeCloudNewsResponse> {
    const queryString = createQueryString(request)
    const url = `/api/cloud-news/scrape${queryString ? `?${queryString}` : ''}`
    
    return api.post<ScrapeCloudNewsResponse>(url, {})
  }

  // Trigger AI analysis for a specific cloud news item
  async analyzeCloudNewsItem(id: number): Promise<{ message: string; news: any }> {
    return api.post(`/api/cloud-news/${id}/analyze`, {})
  }

  // Get recent cloud news (last N items)
  async getRecentCloudNews(limit: number = 10, featureType?: FeatureType): Promise<CloudNews[]> {
    const filters: CloudNewsFilters = { 
      limit, 
      skip: 0, 
      days_back: 14, // Look back 2 weeks for "recent"
      feature_type: featureType 
    }
    return this.getCloudNews(filters)
  }

  // Get "New This Week" features
  async getNewThisWeekFeatures(limit: number = 20): Promise<CloudNews[]> {
    const filters: CloudNewsFilters = { 
      limit, 
      skip: 0, 
      feature_type: FeatureType.NEW_THIS_WEEK,
      days_back: 7
    }
    return this.getCloudNews(filters)
  }

  // Get "Coming Soon" features
  async getComingSoonFeatures(limit: number = 20): Promise<CloudNews[]> {
    const filters: CloudNewsFilters = { 
      limit, 
      skip: 0, 
      feature_type: FeatureType.COMING_SOON,
      days_back: 14
    }
    return this.getCloudNews(filters)
  }

  // Get news by product area
  async getNewsByProductArea(productArea: string, limit: number = 20): Promise<CloudNews[]> {
    const filters: CloudNewsFilters = { 
      limit, 
      skip: 0, 
      product_area: productArea,
      days_back: 30
    }
    return this.getCloudNews(filters)
  }

  // Get news by target audience
  async getNewsByTargetAudience(targetAudience: TargetAudience, limit: number = 20): Promise<CloudNews[]> {
    const filters: CloudNewsFilters = { 
      limit, 
      skip: 0, 
      target_audience: targetAudience,
      days_back: 30
    }
    return this.getCloudNews(filters)
  }

  // Get cloud news with pagination
  async getCloudNewsPaginated(page: number = 1, pageSize: number = 20, filters: Omit<CloudNewsFilters, 'skip' | 'limit'> = {}): Promise<{
    newsItems: CloudNews[]
    pagination: {
      page: number
      pageSize: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }> {
    const skip = (page - 1) * pageSize
    const limit = pageSize + 1 // Get one extra to check if there are more

    const allFilters: CloudNewsFilters = {
      ...filters,
      skip,
      limit
    }

    const newsItems = await this.getCloudNews(allFilters)
    const hasNext = newsItems.length > pageSize
    const actualNewsItems = hasNext ? newsItems.slice(0, pageSize) : newsItems

    return {
      newsItems: actualNewsItems,
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
    featureTypes?: FeatureType[]
    productAreas?: string[]
    targetAudiences?: TargetAudience[]
    searchQuery?: string
    daysBack?: number
    limit?: number
    skip?: number
  }): Promise<CloudNews[]> {
    const { 
      featureTypes, productAreas, targetAudiences,
      searchQuery, daysBack, limit, skip 
    } = options

    // If we have a search query, use the search endpoint
    if (searchQuery) {
      return this.searchCloudNews({
        query: searchQuery,
        feature_type: featureTypes?.[0],
        product_area: productAreas?.[0],
        limit: limit || 50,
        skip: skip || 0
      })
    }

    // Otherwise use regular filtering
    const baseFilters: CloudNewsFilters = {
      days_back: daysBack || 30,
      limit: limit || 100, // Get more results for client-side filtering
      skip: skip || 0
    }

    // Use first values if multiple specified (since backend supports single values)
    if (featureTypes && featureTypes.length > 0) {
      baseFilters.feature_type = featureTypes[0]
    }

    if (productAreas && productAreas.length > 0) {
      baseFilters.product_area = productAreas[0]
    }

    if (targetAudiences && targetAudiences.length > 0) {
      baseFilters.target_audience = targetAudiences[0]
    }

    let newsItems = await this.getCloudNews(baseFilters)

    // Apply client-side filtering for multiple values
    if (featureTypes && featureTypes.length > 1) {
      newsItems = newsItems.filter(item => featureTypes.includes(item.feature_type))
    }

    if (productAreas && productAreas.length > 1) {
      newsItems = newsItems.filter(item => 
        item.product_area && productAreas.some(area => 
          item.product_area!.toLowerCase().includes(area.toLowerCase())
        )
      )
    }

    if (targetAudiences && targetAudiences.length > 1) {
      newsItems = newsItems.filter(item => 
        item.ai_target_audience && targetAudiences.includes(item.ai_target_audience)
      )
    }

    return newsItems.slice(0, limit || 50)
  }

  // Get cloud news grouped by product area
  async getCloudNewsGroupedByProductArea(): Promise<Record<string, CloudNews[]>> {
    const productAreas = await this.getAvailableProductAreas()
    
    const groupedNews = await Promise.allSettled(
      productAreas.map(async area => ({
        area: area.name,
        news: await this.getNewsByProductArea(area.name, 10)
      }))
    )

    const result: Record<string, CloudNews[]> = {}
    
    groupedNews.forEach((result_item, index) => {
      if (result_item.status === 'fulfilled') {
        result[result_item.value.area] = result_item.value.news
      } else {
        result[productAreas[index].name] = []
      }
    })

    return result
  }

  // Get top product areas by feature count
  async getTopProductAreasByFeatureCount(limit: number = 10): Promise<ProductArea[]> {
    const productAreas = await this.getAvailableProductAreas()
    return productAreas
      .sort((a, b) => b.feature_count - a.feature_count)
      .slice(0, limit)
  }

  // Get cloud news dashboard data
  async getDashboardData(daysBack: number = 7): Promise<{
    stats: CloudNewsStats
    newThisWeek: CloudNewsSummary[]
    comingSoon: CloudNewsSummary[]
    topProductAreas: ProductArea[]
  }> {
    const [stats, newThisWeek, comingSoon, productAreas] = await Promise.allSettled([
      this.getCloudNewsStats(daysBack),
      this.getCloudNewsSummary({ feature_type: FeatureType.NEW_THIS_WEEK, limit: 5 }),
      this.getCloudNewsSummary({ feature_type: FeatureType.COMING_SOON, limit: 5 }),
      this.getTopProductAreasByFeatureCount(5)
    ])

    return {
      stats: stats.status === 'fulfilled' ? stats.value : {
        total_features: 0,
        new_this_week: 0,
        coming_soon: 0,
        product_breakdown: {},
        recent_updates: []
      },
      newThisWeek: newThisWeek.status === 'fulfilled' ? newThisWeek.value : [],
      comingSoon: comingSoon.status === 'fulfilled' ? comingSoon.value : [],
      topProductAreas: productAreas.status === 'fulfilled' ? productAreas.value : []
    }
  }

  // Validate cloud news data
  validateCloudNewsData(news: Partial<CloudNews>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!news.feature_title || news.feature_title.trim().length === 0) {
      errors.push('Feature title is required')
    }

    if (!news.source_url || news.source_url.trim().length === 0) {
      errors.push('Source URL is required')
    }

    if (!news.blog_date) {
      errors.push('Blog date is required')
    }

    if (!Object.values(FeatureType).includes(news.feature_type as FeatureType)) {
      errors.push('Valid feature type is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Clear cache for this service
  clearCache(): void {
    // Implementation would depend on your caching strategy
    console.log('🗑️ Cloud news service cache cleared')
  }

  // Helper method to format blog date
  formatBlogDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper method to get feature type display name and color
  getFeatureTypeInfo(type: FeatureType): { displayName: string; color: string } {
    switch (type) {
      case FeatureType.NEW_THIS_WEEK:
        return {
          displayName: 'New This Week',
          color: 'text-green-600 bg-green-50 border-green-200'
        }
      case FeatureType.COMING_SOON:
        return {
          displayName: 'Coming Soon',
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        }
      default:
        return {
          displayName: type,
          color: 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }
  }

  // Helper method to get target audience display name and color
  getTargetAudienceInfo(audience?: TargetAudience): { displayName: string; color: string } {
    switch (audience) {
      case TargetAudience.ADMINISTRATORS:
        return {
          displayName: 'Administrators',
          color: 'text-purple-600 bg-purple-50'
        }
      case TargetAudience.DEVELOPERS:
        return {
          displayName: 'Developers',
          color: 'text-orange-600 bg-orange-50'
        }
      case TargetAudience.END_USERS:
        return {
          displayName: 'End Users',
          color: 'text-teal-600 bg-teal-50'
        }
      case TargetAudience.ALL_USERS:
        return {
          displayName: 'All Users',
          color: 'text-indigo-600 bg-indigo-50'
        }
      default:
        return {
          displayName: 'Unknown',
          color: 'text-gray-600 bg-gray-50'
        }
    }
  }

  // Helper method to extract product area color
  getProductAreaColor(productArea?: string): string {
    if (!productArea) return 'text-gray-600 bg-gray-50'
    
    // Simple hash-based color assignment for consistency
    const colors = [
      'text-red-600 bg-red-50',
      'text-blue-600 bg-blue-50', 
      'text-green-600 bg-green-50',
      'text-yellow-600 bg-yellow-50',
      'text-purple-600 bg-purple-50',
      'text-pink-600 bg-pink-50',
      'text-indigo-600 bg-indigo-50'
    ]
    
    let hash = 0
    for (let i = 0; i < productArea.length; i++) {
      hash = productArea.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }
}

// Create and export service instance
export const cloudNewsService = new CloudNewsService()
export default cloudNewsService