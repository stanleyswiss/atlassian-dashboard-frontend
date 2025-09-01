import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  ExternalLink,
  Clock,
  RefreshCw,
  AlertCircle,
  Shield,
  Download,
  Zap
} from 'lucide-react'
import { 
  ReleaseNote, 
  ReleaseNoteFilters, 
  ProductType, 
  ImpactLevel, 
  ProductInfo,
  ReleaseNoteStats 
} from '@/types'
import { releaseNotesService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

export default function ReleaseNotesPage() {
  const [releases, setReleases] = useState<ReleaseNote[]>([])
  const [stats, setStats] = useState<ReleaseNoteStats | null>(null)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ReleaseNoteFilters>({
    days_back: 7,
    limit: 20,
    skip: 0
  })

  const RELEASES_PER_PAGE = 20

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadReleases()
  }, [currentPage, filters])

  const loadInitialData = async () => {
    try {
      const [productsData, statsData] = await Promise.allSettled([
        releaseNotesService.getAvailableProducts(),
        releaseNotesService.getReleaseNotesStats(filters.days_back || 7)
      ])
      
      setProducts(productsData.status === 'fulfilled' ? productsData.value : [])
      setStats(statsData.status === 'fulfilled' ? statsData.value : null)
    } catch (err: any) {
      console.error('Failed to load initial data:', err)
    }
  }

  const loadReleases = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const releaseFilters: ReleaseNoteFilters = {
        ...filters,
        limit: RELEASES_PER_PAGE,
        skip: (currentPage - 1) * RELEASES_PER_PAGE
      }

      const releasesData = await releaseNotesService.getReleaseNotes(releaseFilters)
      setReleases(releasesData)

      // Update stats if filters changed
      if (filters.days_back) {
        const statsData = await releaseNotesService.getReleaseNotesStats(filters.days_back)
        setStats(statsData)
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load release notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await releaseNotesService.triggerScrape({ days_back: filters.days_back || 7 })
      // Wait a moment then reload data
      setTimeout(() => {
        loadReleases()
        setIsRefreshing(false)
      }, 2000)
    } catch (err: any) {
      setIsRefreshing(false)
      setError('Failed to trigger refresh: ' + err.message)
    }
  }

  const handleFiltersChange = (newFilters: Partial<ReleaseNoteFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  if (isLoading && releases.length === 0) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading release notes..." />
        </div>
      </div>
    )
  }

  if (error && releases.length === 0) {
    return (
      <div className="space-y-6">
        <ErrorMessage error={error} onRetry={loadReleases} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Release Notes</h1>
          <p className="text-gray-600 mt-1">
            Track Atlassian product and marketplace app releases
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {stats && (
            <span className="text-sm text-gray-500">
              {stats.total_releases} releases in last {filters.days_back} days
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
              <Package className="h-5 w-5 text-blue-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Total Releases</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_releases}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Major Releases</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.major_releases}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-red-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Security Releases</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.security_releases}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-green-500" />
              <span className="ml-2 text-sm font-medium text-gray-700">Products</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(stats.product_type_breakdown).length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="dashboard-card">
        <div className="space-y-4">
          {/* Time Range and Product Filters */}
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
                <option value={90}>Last 3 months</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filters.product_type || ''}
                onChange={(e) => handleFiltersChange({ 
                  product_type: e.target.value ? e.target.value as ProductType : undefined 
                })}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Product Types</option>
                <option value={ProductType.ATLASSIAN_PRODUCT}>Atlassian Products</option>
                <option value={ProductType.MARKETPLACE_APP}>Marketplace Apps</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <select
                value={filters.impact_level || ''}
                onChange={(e) => handleFiltersChange({ 
                  impact_level: e.target.value ? e.target.value as ImpactLevel : undefined 
                })}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Impact Levels</option>
                <option value={ImpactLevel.HIGH}>High Impact</option>
                <option value={ImpactLevel.MEDIUM}>Medium Impact</option>
                <option value={ImpactLevel.LOW}>Low Impact</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Product name..."
                value={filters.product_name || ''}
                onChange={(e) => handleFiltersChange({ product_name: e.target.value || undefined })}
                className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.major_releases_only || false}
                onChange={(e) => handleFiltersChange({ major_releases_only: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Major releases only</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.security_releases_only || false}
                onChange={(e) => handleFiltersChange({ security_releases_only: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Security releases only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Release Notes List */}
      <div className="dashboard-card">
        <div className="space-y-4">
          {releases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No releases found</h3>
              <p className="text-gray-600">Try adjusting your filters or time range.</p>
            </div>
          ) : (
            releases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))
          )}
        </div>

        {/* Simple Pagination */}
        {releases.length === RELEASES_PER_PAGE && (
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
                disabled={releases.length < RELEASES_PER_PAGE}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Release Card Component  
function ReleaseCard({ release }: { release: ReleaseNote }) {
  const handleCardClick = () => {
    if (release.release_notes_url) {
      window.open(release.release_notes_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (release.download_url) {
      window.open(release.download_url, '_blank', 'noopener,noreferrer')
    }
  }

  const getProductTypeColor = (type: ProductType) => {
    switch (type) {
      case ProductType.ATLASSIAN_PRODUCT:
        return 'bg-blue-100 text-blue-800'
      case ProductType.MARKETPLACE_APP:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactLevelColor = (level?: ImpactLevel) => {
    switch (level) {
      case ImpactLevel.HIGH:
        return 'bg-red-100 text-red-800'
      case ImpactLevel.MEDIUM:
        return 'bg-yellow-100 text-yellow-800'
      case ImpactLevel.LOW:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div 
      className={`border border-gray-200 rounded-lg p-4 transition-all group ${
        release.release_notes_url ? 'hover:border-gray-300 hover:bg-gray-50 cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Release Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {release.product_name} {release.version}
            </h3>
            {release.is_major_release && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Zap className="h-3 w-3 mr-1" />
                Major
              </span>
            )}
            {release.is_security_release && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Shield className="h-3 w-3 mr-1" />
                Security
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductTypeColor(release.product_type)}`}>
              <Package className="h-3 w-3 mr-1" />
              {release.product_type === ProductType.ATLASSIAN_PRODUCT ? 'Atlassian Product' : 'Marketplace App'}
            </span>
            
            {release.ai_impact_level && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactLevelColor(release.ai_impact_level)}`}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {release.ai_impact_level.charAt(0).toUpperCase() + release.ai_impact_level.slice(1)} Impact
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {release.download_url && (
            <button
              onClick={handleDownloadClick}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {release.release_notes_url && (
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
          )}
        </div>
      </div>

      {/* AI Summary */}
      {release.ai_summary && (
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed">
            {release.ai_summary}
          </p>
        </div>
      )}

      {/* Key Changes */}
      {release.ai_key_changes && release.ai_key_changes.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Changes:</h4>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            {release.ai_key_changes.slice(0, 3).map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Release Summary (fallback if no AI summary) */}
      {!release.ai_summary && release.release_summary && (
        <div className="mb-3">
          <p className="text-gray-600 line-clamp-3">
            {release.release_summary}
          </p>
        </div>
      )}

      {/* Release Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{releaseNotesService.formatReleaseDate(release.release_date)}</span>
          </div>
          
          {release.build_number && (
            <div className="flex items-center">
              <span>Build {release.build_number}</span>
            </div>
          )}
        </div>

        {release.ai_categories && release.ai_categories.length > 0 && (
          <div className="flex items-center space-x-1">
            {release.ai_categories.slice(0, 3).map((category, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {category.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}