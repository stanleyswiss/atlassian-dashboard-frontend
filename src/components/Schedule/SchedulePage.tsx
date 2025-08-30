import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Cloud,
  Server,
  ArrowRight,
  Tag
} from 'lucide-react'
import { PostCategory } from '@/types'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import api from '@/services/api'

interface RoadmapItem {
  id: string
  title: string
  description: string
  category: PostCategory
  platform: 'cloud' | 'dc' | 'both'
  status: 'planned' | 'in-progress' | 'released' | 'beta'
  priority: 'low' | 'medium' | 'high' | 'critical'
  releaseDate: string
  quarter: string
  tags: string[]
  impact: 'minor' | 'major' | 'breaking'
  url?: string
}

interface FilterOptions {
  category: PostCategory | 'all'
  platform: 'cloud' | 'dc' | 'both' | 'all'
  status: 'planned' | 'in-progress' | 'released' | 'beta' | 'all'
  quarter: string | 'all'
  timeframe: 'current' | 'next' | 'future' | 'all'
}

export default function SchedulePage() {
  const [allRoadmapItems, setAllRoadmapItems] = useState<RoadmapItem[]>([]) // Store all data
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]) // Store filtered data
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'timeline' | 'grid' | 'calendar'>('timeline')
  const [filter, setFilter] = useState<FilterOptions>({
    category: 'all',
    platform: 'all',
    status: 'all',
    quarter: 'all',
    timeframe: 'all'
  })

  // Mock roadmap data - in real implementation this would come from Atlassian's roadmap API
  const mockRoadmapItems: RoadmapItem[] = [
    // Jira Roadmap Items
    {
      id: 'jira-1',
      title: 'Advanced Automation Engine',
      description: 'New automation capabilities with AI-powered rule suggestions and cross-project workflows',
      category: 'jira',
      platform: 'both',
      status: 'in-progress',
      priority: 'high',
      releaseDate: '2025-09-15',
      quarter: 'Q3 2025',
      tags: ['automation', 'AI', 'workflows'],
      impact: 'major',
      url: 'https://www.atlassian.com/roadmap/jira'
    },
    {
      id: 'jira-2',
      title: 'Enhanced JQL Performance',
      description: 'Significant performance improvements for complex JQL queries and large datasets',
      category: 'jira',
      platform: 'cloud',
      status: 'planned',
      priority: 'medium',
      releaseDate: '2025-10-30',
      quarter: 'Q4 2025',
      tags: ['performance', 'JQL', 'search'],
      impact: 'major'
    },
    {
      id: 'jira-3',
      title: 'Mobile App 3.0',
      description: 'Complete redesign of Jira mobile app with offline capabilities',
      category: 'jira',
      platform: 'cloud',
      status: 'beta',
      priority: 'high',
      releaseDate: '2025-08-01',
      quarter: 'Q3 2025',
      tags: ['mobile', 'offline', 'UX'],
      impact: 'major'
    },

    // JSM Roadmap Items
    {
      id: 'jsm-1',
      title: 'AI-Powered Request Routing',
      description: 'Intelligent request categorization and routing using machine learning',
      category: 'jsm',
      platform: 'cloud',
      status: 'in-progress',
      priority: 'high',
      releaseDate: '2025-09-01',
      quarter: 'Q3 2025',
      tags: ['AI', 'automation', 'routing'],
      impact: 'major'
    },
    {
      id: 'jsm-2',
      title: 'Advanced SLA Management',
      description: 'Enhanced SLA tracking with predictive analytics and breach prevention',
      category: 'jsm',
      platform: 'both',
      status: 'planned',
      priority: 'medium',
      releaseDate: '2025-11-15',
      quarter: 'Q4 2025',
      tags: ['SLA', 'analytics', 'reporting'],
      impact: 'major'
    },
    {
      id: 'jsm-3',
      title: 'Customer Portal 2.0',
      description: 'Redesigned customer portal with self-service capabilities and knowledge base integration',
      category: 'jsm',
      platform: 'cloud',
      status: 'beta',
      priority: 'high',
      releaseDate: '2025-07-15',
      quarter: 'Q3 2025',
      tags: ['portal', 'self-service', 'knowledge-base'],
      impact: 'major'
    },

    // Confluence Roadmap Items  
    {
      id: 'conf-1',
      title: 'Confluence 3.0 Editor',
      description: 'Next-generation editor with real-time collaboration and AI-assisted writing',
      category: 'confluence',
      platform: 'cloud',
      status: 'in-progress',
      priority: 'critical',
      releaseDate: '2025-08-30',
      quarter: 'Q3 2025',
      tags: ['editor', 'collaboration', 'AI'],
      impact: 'breaking'
    },
    {
      id: 'conf-2',
      title: 'Advanced Analytics Dashboard',
      description: 'Comprehensive content analytics with usage insights and recommendations',
      category: 'confluence',
      platform: 'both',
      status: 'planned',
      priority: 'medium',
      releaseDate: '2025-10-01',
      quarter: 'Q4 2025',
      tags: ['analytics', 'insights', 'reporting'],
      impact: 'major'
    },
    {
      id: 'conf-3',
      title: 'Database Integration',
      description: 'Native database connectivity for live data embedding in pages',
      category: 'confluence',
      platform: 'dc',
      status: 'planned',
      priority: 'medium',
      releaseDate: '2025-12-01',
      quarter: 'Q4 2025',
      tags: ['database', 'integration', 'live-data'],
      impact: 'major'
    },

    // Rovo Roadmap Items
    {
      id: 'rovo-1',
      title: 'Rovo Chat Enterprise',
      description: 'Advanced chat capabilities with workspace integration and custom agents',
      category: 'rovo',
      platform: 'cloud',
      status: 'beta',
      priority: 'high',
      releaseDate: '2025-07-01',
      quarter: 'Q3 2025',
      tags: ['chat', 'AI', 'enterprise'],
      impact: 'major'
    },
    {
      id: 'rovo-2',
      title: 'Advanced Search 2.0',
      description: 'Enhanced search capabilities across all Atlassian products with AI-powered results',
      category: 'rovo',
      platform: 'cloud',
      status: 'in-progress',
      priority: 'critical',
      releaseDate: '2025-09-30',
      quarter: 'Q3 2025',
      tags: ['search', 'AI', 'cross-product'],
      impact: 'major'
    },
    {
      id: 'rovo-3',
      title: 'Custom Agent Builder',
      description: 'No-code platform for building custom AI agents for specific business needs',
      category: 'rovo',
      platform: 'cloud',
      status: 'planned',
      priority: 'high',
      releaseDate: '2025-11-01',
      quarter: 'Q4 2025',
      tags: ['agents', 'no-code', 'AI'],
      impact: 'major'
    },

    // Platform & Announcements
    {
      id: 'platform-1',
      title: 'Atlassian Intelligence GA',
      description: 'General availability of AI features across all products with enhanced capabilities',
      category: 'announcements',
      platform: 'both',
      status: 'in-progress',
      priority: 'critical',
      releaseDate: '2025-08-15',
      quarter: 'Q3 2025',
      tags: ['AI', 'platform', 'GA'],
      impact: 'breaking'
    },
    {
      id: 'platform-2',
      title: 'Data Center 2025 LTS',
      description: 'Long-term support release for Data Center products with security enhancements',
      category: 'announcements',
      platform: 'dc',
      status: 'planned',
      priority: 'high',
      releaseDate: '2025-12-15',
      quarter: 'Q4 2025',
      tags: ['LTS', 'security', 'enterprise'],
      impact: 'major'
    }
  ]

  useEffect(() => {
    loadRoadmapData()
  }, []) // Only fetch data on component mount

  // Apply filters when filter changes
  useEffect(() => {
    applyFilters()
  }, [filter, allRoadmapItems])

  const loadRoadmapData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const cloudResponse = await api.get('/api/roadmap/cloud')
      const dcResponse = await api.get('/api/roadmap/data-center')
      
      if (!cloudResponse || !dcResponse) {
        setError('Failed to fetch roadmap data from API')
        return
      }

      const cloudData = cloudResponse
      const dcData = dcResponse

      // Transform real API data to match RoadmapItem interface
      let allItems: RoadmapItem[] = []

      // Process Cloud features
      if (cloudData && cloudData.features && Array.isArray(cloudData.features)) {
        const cloudItems = cloudData.features.map((feature: any, index: number) => ({
          id: `cloud-${index}`,
          title: feature.title,
          description: feature.description,
          category: mapProductsToCategory(feature.products || []),
          platform: 'cloud' as const,
          status: mapStatus(feature.status),
          priority: 'medium' as const,
          releaseDate: getReleaseDateFromQuarter(feature.quarter),
          quarter: feature.quarter || 'Q1 2025',
          tags: feature.products || [],
          impact: 'major' as const,
          url: cloudData.url
        }))
        allItems.push(...cloudItems)
      }

      // Process Data Center features  
      if (dcData && dcData.features && Array.isArray(dcData.features)) {
        const dcItems = dcData.features.map((feature: any, index: number) => ({
          id: `dc-${index}`,
          title: feature.title,
          description: feature.description,
          category: mapProductsToCategory(feature.products || []),
          platform: 'dc' as const,
          status: mapStatus(feature.status),
          priority: 'medium' as const,
          releaseDate: getReleaseDateFromQuarter(feature.quarter),
          quarter: feature.quarter || 'Q1 2025',
          tags: feature.products || [],
          impact: 'major' as const,
          url: dcData.url
        }))
        allItems.push(...dcItems)
      }

      if (allItems.length === 0) {
        setError('No roadmap data available from API')
        return
      }

      // Store all data and let filtering happen in applyFilters
      setAllRoadmapItems(allItems)
    } catch (err: any) {
      setError(err.message || 'Failed to load roadmap data')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filteredItems = [...allRoadmapItems]
    
    if (filter.category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === filter.category)
    }

    if (filter.platform !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.platform === filter.platform || item.platform === 'both'
      )
    }

    if (filter.status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === filter.status)
    }

    if (filter.quarter !== 'all') {
      filteredItems = filteredItems.filter(item => item.quarter === filter.quarter)
    }

    // Apply timeframe filter - fix future logic to look at status and quarter
    const now = new Date()
    const currentQuarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
    const currentYear = now.getFullYear()
    
    if (filter.timeframe === 'current') {
      filteredItems = filteredItems.filter(item => item.quarter === currentQuarter)
    } else if (filter.timeframe === 'next') {
      const nextQuarter = getNextQuarter(currentQuarter)
      filteredItems = filteredItems.filter(item => item.quarter === nextQuarter)
    } else if (filter.timeframe === 'future') {
      // Future: upcoming status OR quarters after current year
      filteredItems = filteredItems.filter(item => {
        const itemYear = parseInt(item.quarter?.split(' ')[1] || '2024')
        return item.status === 'planned' || itemYear > currentYear
      })
    }

    // Sort by release date
    filteredItems.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())

    setRoadmapItems(filteredItems)
  }

  // Helper functions to transform API data
  const mapProductsToCategory = (products: string[]): PostCategory => {
    // Map product names to PostCategory enum values
    if (products.includes('jira') && !products.includes('confluence')) return PostCategory.JIRA
    if (products.includes('jsm')) return PostCategory.JSM 
    if (products.includes('confluence') && !products.includes('jira')) return PostCategory.CONFLUENCE
    if (products.includes('bitbucket')) return PostCategory.JIRA // Map bitbucket to jira as fallback
    // Default to jira if multiple or unknown products
    return PostCategory.JIRA
  }

  const mapStatus = (status: string): 'planned' | 'in-progress' | 'released' | 'beta' => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('released')) return 'released'
    if (statusLower.includes('beta')) return 'beta'
    if (statusLower.includes('development') || statusLower.includes('progress')) return 'in-progress'
    return 'planned'
  }

  const getReleaseDateFromQuarter = (quarter: string): string => {
    // Convert quarter like "Q3 2024" to approximate release date
    const [q, year] = quarter.split(' ')
    const yearNum = parseInt(year) || new Date().getFullYear()
    const quarterNum = parseInt(q.replace('Q', '')) || 1
    
    // Map quarter to approximate month (end of quarter)
    const monthMap = { 1: 3, 2: 6, 3: 9, 4: 12 }
    const month = monthMap[quarterNum as keyof typeof monthMap] || 12
    
    return `${yearNum}-${month.toString().padStart(2, '0')}-15`
  }

  const getNextQuarter = (currentQuarter: string): string => {
    const [quarter, year] = currentQuarter.split(' ')
    const qNum = parseInt(quarter.replace('Q', ''))
    
    if (qNum === 4) {
      return `Q1 ${parseInt(year) + 1}`
    } else {
      return `Q${qNum + 1} ${year}`
    }
  }

  const handleRefresh = () => {
    loadRoadmapData()
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      beta: 'bg-purple-100 text-purple-800',
      released: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Clock className="h-3 w-3" />
      case 'in-progress': return <Zap className="h-3 w-3" />
      case 'beta': return <AlertCircle className="h-3 w-3" />
      case 'released': return <CheckCircle2 className="h-3 w-3" />
      default: return <Info className="h-3 w-3" />
    }
  }

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    }
    return colors[priority as keyof typeof colors] || 'text-gray-500'
  }

  const getCategoryColor = (category: PostCategory): string => {
    const colors = {
      jira: 'bg-blue-100 text-blue-800',
      jsm: 'bg-green-100 text-green-800',
      confluence: 'bg-purple-100 text-purple-800',
      rovo: 'bg-orange-100 text-orange-800',
      announcements: 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading product roadmaps..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessage error={error} onRetry={handleRefresh} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Roadmaps</h1>
          <p className="text-gray-600 mt-1">
            Upcoming features and releases across all Atlassian products
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {roadmapItems.length} items
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Products</option>
              <option value="jira">Jira</option>
              <option value="jsm">JSM</option>
              <option value="confluence">Confluence</option>
              <option value="rovo">Rovo</option>
              <option value="announcements">Platform</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={filter.platform}
              onChange={(e) => setFilter({...filter, platform: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              <option value="cloud">Cloud Only</option>
              <option value="dc">Data Center Only</option>
              <option value="both">Both Platforms</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="beta">Beta</option>
              <option value="released">Released</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={filter.timeframe}
              onChange={(e) => setFilter({...filter, timeframe: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="current">Current Quarter</option>
              <option value="next">Next Quarter</option>
              <option value="future">Future</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setView('timeline')}
                className={`flex-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'timeline' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setView('grid')}
                className={`flex-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Items */}
      {roadmapItems.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roadmap items found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {view === 'timeline' ? (
            <TimelineView items={roadmapItems} />
          ) : (
            <GridView items={roadmapItems} />
          )}
        </div>
      )}
    </div>
  )
}

// Timeline View Component
function TimelineView({ items }: { items: RoadmapItem[] }) {
  // Group items by quarter
  const itemsByQuarter = items.reduce((acc, item) => {
    if (!acc[item.quarter]) {
      acc[item.quarter] = []
    }
    acc[item.quarter].push(item)
    return acc
  }, {} as Record<string, RoadmapItem[]>)

  const quarters = Object.keys(itemsByQuarter).sort()

  return (
    <div className="space-y-8">
      {quarters.map((quarter) => (
        <div key={quarter} className="dashboard-card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{quarter}</h3>
              <p className="text-sm text-gray-600">{itemsByQuarter[quarter].length} items planned</p>
            </div>
          </div>

          <div className="space-y-4">
            {itemsByQuarter[quarter].map((item) => (
              <RoadmapItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Grid View Component
function GridView({ items }: { items: RoadmapItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="dashboard-card">
          <RoadmapItemCard item={item} compact />
        </div>
      ))}
    </div>
  )
}

// Individual Roadmap Item Card
function RoadmapItemCard({ item, compact = false }: { item: RoadmapItem; compact?: boolean }) {
  const getStatusColor = (status: string): string => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      beta: 'bg-purple-100 text-purple-800',
      released: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Clock className="h-3 w-3" />
      case 'in-progress': return <Zap className="h-3 w-3" />
      case 'beta': return <AlertCircle className="h-3 w-3" />
      case 'released': return <CheckCircle2 className="h-3 w-3" />
      default: return <Info className="h-3 w-3" />
    }
  }

  const getCategoryColor = (category: PostCategory): string => {
    const colors = {
      jira: 'bg-blue-100 text-blue-800',
      jsm: 'bg-green-100 text-green-800',
      confluence: 'bg-purple-100 text-purple-800',
      rovo: 'bg-orange-100 text-orange-800',
      announcements: 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={`${compact ? '' : 'p-4 border border-gray-200 rounded-lg'} hover:border-gray-300 transition-colors`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
            {item.title}
          </h4>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
              <Tag className="h-3 w-3 mr-1" />
              {item.category.toUpperCase()}
            </span>
            
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              <span className="ml-1 capitalize">{item.status.replace('-', ' ')}</span>
            </span>

            {item.platform !== 'both' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {item.platform === 'cloud' ? <Cloud className="h-3 w-3 mr-1" /> : <Server className="h-3 w-3 mr-1" />}
                {item.platform.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {item.description}
      </p>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {item.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              +{item.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(item.releaseDate)}</span>
          </div>
          
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{item.quarter}</span>
          </div>
        </div>

        <div className={`text-xs font-medium ${
          item.priority === 'critical' ? 'text-red-600' :
          item.priority === 'high' ? 'text-orange-600' :
          item.priority === 'medium' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          {item.priority.toUpperCase()} PRIORITY
        </div>
      </div>

      {/* Impact Badge */}
      {item.impact === 'breaking' && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Breaking Change</span>
          </div>
          <p className="text-xs text-red-700 mt-1">This update may require changes to existing configurations</p>
        </div>
      )}
    </div>
  )
}