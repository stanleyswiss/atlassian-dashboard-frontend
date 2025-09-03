import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Calendar, 
  Cloud, 
  ExternalLink,
  Clock,
  RefreshCw,
  Users,
  Hash,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { 
  CloudNews, 
  CloudNewsFilters, 
  FeatureType, 
  TargetAudience, 
  ProductArea,
  CloudNewsStats,
  CloudNewsGroupedByType 
} from '@/types'
import { cloudNewsService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

export default function CloudNewsPage() {
  const [newsItems, setNewsItems] = useState<CloudNews[]>([])
  const [groupedNews, setGroupedNews] = useState<CloudNewsGroupedByType | null>(null)
  const [stats, setStats] = useState<CloudNewsStats | null>(null)
  const [productAreas, setProductAreas] = useState<ProductArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CloudNewsFilters>({
    days_back: 30,
    limit: 20,
    skip: 0
  })
  const [expandedSections, setExpandedSections] = useState<{
    newThisWeek: boolean
    comingSoon: boolean
  }>({
    newThisWeek: false, // Start collapsed
    comingSoon: false   // Start collapsed
  })

  const NEWS_PER_PAGE = 20

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (viewMode === 'list') {
      loadCloudNews()
    } else {
      loadGroupedNews()
    }
  }, [currentPage, filters, viewMode])

  const loadInitialData = async () => {
    try {
      const [areasData, statsData] = await Promise.allSettled([
        cloudNewsService.getAvailableProductAreas(),
        cloudNewsService.getCloudNewsStats(filters.days_back || 90)
      ])
      
      setProductAreas(areasData.status === 'fulfilled' ? areasData.value : [])
      setStats(statsData.status === 'fulfilled' ? statsData.value : null)
    } catch (err: any) {
      console.error('Failed to load initial data:', err)
    }
  }

  const loadCloudNews = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const newsFilters: CloudNewsFilters = {
        ...filters,
        limit: NEWS_PER_PAGE,
        skip: (currentPage - 1) * NEWS_PER_PAGE,
        search: searchQuery || undefined
      }

      let newsData: CloudNews[]
      
      if (searchQuery) {
        newsData = await cloudNewsService.searchCloudNews({
          query: searchQuery,
          feature_type: newsFilters.feature_type,
          product_area: newsFilters.product_area,
          limit: newsFilters.limit,
          skip: newsFilters.skip
        })
      } else {
        newsData = await cloudNewsService.getCloudNews(newsFilters)
      }
      
      setNewsItems(newsData)

      // Update stats if filters changed
      if (filters.days_back) {
        const statsData = await cloudNewsService.getCloudNewsStats(filters.days_back)
        setStats(statsData)
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load cloud news')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGroupedNews = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Apply filters to grouped news data
      const [newThisWeekData, comingSoonData, statsData] = await Promise.allSettled([
        cloudNewsService.getCloudNews({
          feature_type: FeatureType.NEW_THIS_WEEK,
          days_back: filters.days_back || 30,
          product_area: filters.product_area,
          target_audience: filters.target_audience,
          limit: 100
        }),
        cloudNewsService.getCloudNews({
          feature_type: FeatureType.COMING_SOON,
          days_back: filters.days_back || 30,
          product_area: filters.product_area,
          target_audience: filters.target_audience,
          limit: 100
        }),
        cloudNewsService.getCloudNewsStats(filters.days_back || 30)
      ])

      const newThisWeek = newThisWeekData.status === 'fulfilled' ? newThisWeekData.value : []
      const comingSoon = comingSoonData.status === 'fulfilled' ? comingSoonData.value : []

      setGroupedNews({
        new_this_week: newThisWeek,
        coming_soon: comingSoon
      })
      setStats(statsData.status === 'fulfilled' ? statsData.value : null)

    } catch (err: any) {
      setError(err.message || 'Failed to load cloud news')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await cloudNewsService.triggerScrape({ days_back: filters.days_back || 7 })
      // Wait a moment then reload data
      setTimeout(() => {
        if (viewMode === 'list') {
          loadCloudNews()
        } else {
          loadGroupedNews()
        }
        setIsRefreshing(false)
      }, 2000)
    } catch (err: any) {
      setIsRefreshing(false)
      setError('Failed to trigger refresh: ' + err.message)
    }
  }

  const handleFiltersChange = (newFilters: Partial<CloudNewsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const toggleSection = (section: 'newThisWeek' | 'comingSoon') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    if (viewMode === 'list') {
      loadCloudNews()
    }
  }

  if (isLoading && newsItems.length === 0 && !groupedNews) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading cloud news..." />
        </div>
      </div>
    )
  }

  if (error && newsItems.length === 0 && !groupedNews) {
    return (
      <div className="space-y-6">
        <ErrorMessage error={error} onRetry={() => viewMode === 'list' ? loadCloudNews() : loadGroupedNews()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cloud News</h1>
          <p className="text-gray-600 mt-1">
            Latest Atlassian Cloud feature updates and announcements
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {stats && (
            <span className="text-sm text-gray-500">
              {stats.total_features} features in last {filters.days_back} days
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Scraping...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Cloud className="h-5 w-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Total Features</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_features}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">New This Week</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.new_this_week}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <ArrowRight className="h-5 w-5 text-purple-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Coming Soon</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.coming_soon}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Hash className="h-5 w-5 text-orange-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Product Areas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(stats.product_breakdown).length}</p>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              viewMode === 'grouped'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grouped View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="dashboard-card">
        <div className="space-y-4">
          {/* Search (only in list view) */}
          {viewMode === 'list' && (
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search features, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>
          )}

          {/* Filter Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <select
                value={filters.days_back || 7}
                onChange={(e) => handleFiltersChange({ days_back: parseInt(e.target.value) })}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 2 weeks</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.feature_type || ''}
                onChange={(e) => handleFiltersChange({ 
                  feature_type: e.target.value ? e.target.value as FeatureType : undefined 
                })}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Feature Types</option>
                <option value={FeatureType.NEW_THIS_WEEK}>New This Week</option>
                <option value={FeatureType.COMING_SOON}>Coming Soon</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <select
                value={filters.product_area || ''}
                onChange={(e) => handleFiltersChange({ product_area: e.target.value || undefined })}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                {productAreas.map((area) => (
                  <option key={area.name} value={area.name}>
                    {area.name} ({area.feature_count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <select
                value={filters.target_audience || ''}
                onChange={(e) => handleFiltersChange({ 
                  target_audience: e.target.value ? e.target.value as TargetAudience : undefined 
                })}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Audiences</option>
                <option value={TargetAudience.ADMINISTRATORS}>Administrators</option>
                <option value={TargetAudience.DEVELOPERS}>Developers</option>
                <option value={TargetAudience.END_USERS}>End Users</option>
                <option value={TargetAudience.ALL_USERS}>All Users</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        <GroupedNewsView 
          groupedNews={groupedNews} 
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      ) : (
        <ListNewsView 
          newsItems={newsItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          newsPerPage={NEWS_PER_PAGE}
        />
      )}
    </div>
  )
}

// Grouped News View Component
function GroupedNewsView({ 
  groupedNews, 
  expandedSections, 
  toggleSection 
}: { 
  groupedNews: CloudNewsGroupedByType | null
  expandedSections: { newThisWeek: boolean; comingSoon: boolean }
  toggleSection: (section: 'newThisWeek' | 'comingSoon') => void
}) {
  if (!groupedNews) {
    return (
      <div className="dashboard-card">
        <div className="text-center py-12">
          <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
          <p className="text-gray-600">Try adjusting your time range.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New This Week */}
      <div className="dashboard-card">
        <div 
          className="flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
          onClick={() => toggleSection('newThisWeek')}
        >
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">New This Week</h2>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {groupedNews.new_this_week.length} features
            </span>
          </div>
          {expandedSections.newThisWeek ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>

        {expandedSections.newThisWeek && (
          <div className="space-y-4">
            {groupedNews.new_this_week.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No new features this week</p>
              </div>
            ) : (
              groupedNews.new_this_week.map((feature) => (
                <CompactFeatureCard key={feature.id} feature={feature} featureType={FeatureType.NEW_THIS_WEEK} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Coming Soon */}
      <div className="dashboard-card">
        <div 
          className="flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
          onClick={() => toggleSection('comingSoon')}
        >
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Coming Soon</h2>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {groupedNews.coming_soon.length} features
            </span>
          </div>
          {expandedSections.comingSoon ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>

        {expandedSections.comingSoon && (
          <div className="space-y-4">
            {groupedNews.coming_soon.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming features announced</p>
              </div>
            ) : (
              groupedNews.coming_soon.map((feature) => (
                <CompactFeatureCard key={feature.id} feature={feature} featureType={FeatureType.COMING_SOON} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// List News View Component
function ListNewsView({ 
  newsItems, 
  currentPage, 
  setCurrentPage, 
  newsPerPage 
}: { 
  newsItems: CloudNews[]
  currentPage: number
  setCurrentPage: (page: number) => void
  newsPerPage: number
}) {
  return (
    <div className="dashboard-card">
      <div className="space-y-4">
        {newsItems.length === 0 ? (
          <div className="text-center py-12">
            <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          newsItems.map((news) => (
            <CloudNewsCard key={news.id} news={news} />
          ))
        )}
      </div>

      {/* Simple Pagination */}
      {newsItems.length === newsPerPage && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-1.5 text-sm text-gray-700">
              Page {currentPage}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={newsItems.length < newsPerPage}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact Feature Card (for grouped view)
function CompactFeatureCard({ feature, featureType }: { 
  feature: { id: number; feature_title: string; product_area?: string; blog_date: string; ai_summary?: string }
  featureType: FeatureType
}) {
  const { displayName, color } = cloudNewsService.getFeatureTypeInfo(featureType)

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-gray-900 line-clamp-1">
              {feature.feature_title}
            </h3>
            {feature.product_area && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cloudNewsService.getProductAreaColor(feature.product_area)}`}>
                {feature.product_area}
              </span>
            )}
          </div>
          
          {feature.ai_summary && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {feature.ai_summary}
            </p>
          )}
          
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            <span>{cloudNewsService.formatBlogDate(feature.blog_date)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Full Cloud News Card (for list view)
function CloudNewsCard({ news }: { news: CloudNews }) {
  const handleCardClick = () => {
    if (news.source_url) {
      window.open(news.source_url, '_blank', 'noopener,noreferrer')
    }
  }

  const { displayName, color } = cloudNewsService.getFeatureTypeInfo(news.feature_type)
  const audienceInfo = cloudNewsService.getTargetAudienceInfo(news.ai_target_audience)

  return (
    <div 
      className={`border border-gray-200 rounded-lg p-4 transition-all group ${
        news.source_url ? 'hover:border-gray-300 hover:bg-gray-50 cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* News Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
            {news.feature_title}
          </h3>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
              {displayName}
            </span>
            
            {news.product_area && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cloudNewsService.getProductAreaColor(news.product_area)}`}>
                <Hash className="h-3 w-3 mr-1" />
                {news.product_area}
              </span>
            )}
            
            {news.ai_target_audience && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${audienceInfo.color}`}>
                <Users className="h-3 w-3 mr-1" />
                {audienceInfo.displayName}
              </span>
            )}
          </div>
        </div>
        
        {news.source_url && (
          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-3" />
        )}
      </div>

      {/* AI Summary */}
      {news.ai_summary && (
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed">
            {news.ai_summary}
          </p>
        </div>
      )}

      {/* AI Impact Description */}
      {news.ai_impact_description && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Impact:</h4>
          <p className="text-sm text-gray-600">
            {news.ai_impact_description}
          </p>
        </div>
      )}

      {/* AI Tags */}
      {news.ai_tags && news.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {news.ai_tags.slice(0, 5).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* News Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{cloudNewsService.formatBlogDate(news.blog_date)}</span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          {news.blog_title}
        </div>
      </div>
    </div>
  )
}