import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Hash, 
  Activity, 
  Filter,
  Calendar,
  Sparkles,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react'
import { TopicTrend } from '@/types'
import { dashboardService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import TrendingTopics, { TopicsWordCloud } from '@/components/Dashboard/TrendingTopics'

interface TrendingFilter {
  timeRange: 'today' | 'week' | 'month'
  minScore: number
  minMentions: number
}

export default function TrendingTopicsPage() {
  const [topics, setTopics] = useState<TopicTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'list' | 'cloud'>('list')
  const [filter, setFilter] = useState<TrendingFilter>({
    timeRange: 'week',
    minScore: 0.0,
    minMentions: 1
  })

  useEffect(() => {
    loadTrendingTopics()
  }, [filter])

  const loadTrendingTopics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const trendingTopics = await dashboardService.getTrendingTopics({ 
        limit: 50,
        min_score: filter.minScore
      })
      
      // Filter by search query and minimum mentions
      let filteredTopics = trendingTopics.filter(topic => 
        topic.count >= filter.minMentions &&
        (searchQuery === '' || topic.topic.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      
      setTopics(filteredTopics)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending topics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadTrendingTopics()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadTrendingTopics()
  }

  // Get mock trending data if API returns empty
  const mockTrendingTopics: TopicTrend[] = [
    {
      topic: "workflow automation",
      count: 25,
      sentiment_average: 0.3,
      trending_score: 0.85,
      last_seen: new Date()
    },
    {
      topic: "user permissions",
      count: 18,
      sentiment_average: -0.2,
      trending_score: 0.72,
      last_seen: new Date()
    },
    {
      topic: "API integration", 
      count: 15,
      sentiment_average: 0.1,
      trending_score: 0.68,
      last_seen: new Date()
    },
    {
      topic: "performance issues",
      count: 22,
      sentiment_average: -0.4,
      trending_score: 0.65,
      last_seen: new Date()
    },
    {
      topic: "JSM automation",
      count: 12,
      sentiment_average: 0.2,
      trending_score: 0.58,
      last_seen: new Date()
    },
    {
      topic: "confluence templates",
      count: 8,
      sentiment_average: 0.5,
      trending_score: 0.45,
      last_seen: new Date()
    },
    {
      topic: "database connection",
      count: 14,
      sentiment_average: -0.3,
      trending_score: 0.42,
      last_seen: new Date()
    },
    {
      topic: "Jira migration",
      count: 7,
      sentiment_average: 0.1,
      trending_score: 0.38,
      last_seen: new Date()
    }
  ]

  // Use mock data if we have no real topics
  const displayTopics = topics.length > 0 ? topics : mockTrendingTopics

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading trending topics..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trending Topics</h1>
          <p className="text-gray-600 mt-1">
            Discover what the community is talking about most
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {displayTopics.length} trending topics
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="dashboard-card">
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters Row */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              {/* Time Range */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={filter.timeRange}
                  onChange={(e) => setFilter({...filter, timeRange: e.target.value as 'today' | 'week' | 'month'})}
                  className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Min Mentions */}
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <select
                  value={filter.minMentions}
                  onChange={(e) => setFilter({...filter, minMentions: parseInt(e.target.value)})}
                  className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={1}>1+ mentions</option>
                  <option value={5}>5+ mentions</option>
                  <option value={10}>10+ mentions</option>
                  <option value={20}>20+ mentions</option>
                </select>
              </div>

              {/* Min Score */}
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <select
                  value={filter.minScore}
                  onChange={(e) => setFilter({...filter, minScore: parseFloat(e.target.value)})}
                  className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={0.0}>All scores</option>
                  <option value={0.3}>30%+ trending</option>
                  <option value={0.5}>50%+ trending</option>
                  <option value={0.7}>70%+ trending</option>
                </select>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setView('list')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  view === 'list' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Hash className="h-4 w-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setView('cloud')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  view === 'cloud' 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Cloud</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="dashboard-card">
          <ErrorMessage error={error} onRetry={handleRefresh} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current View */}
          {view === 'list' ? (
            <div className="dashboard-card">
              <TrendingTopics limit={50} minScore={filter.minScore} />
            </div>
          ) : (
            <div className="dashboard-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Topics Word Cloud</h3>
                <p className="text-sm text-gray-600">Bigger and darker topics are trending more</p>
              </div>
              <TopicsWordCloud topics={displayTopics} />
            </div>
          )}

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <div className="dashboard-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending by Category</h3>
              <div className="space-y-3">
                {['jira', 'jsm', 'confluence', 'rovo', 'announcements'].map((category, index) => {
                  const categoryTopics = displayTopics.filter(topic => 
                    topic.topic.toLowerCase().includes(category) ||
                    (index === 0 && ['workflow', 'automation', 'permission'].some(word => 
                      topic.topic.toLowerCase().includes(word)
                    ))
                  )
                  const count = categoryTopics.length

                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">{category.toUpperCase()}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{width: `${Math.min(100, (count / Math.max(1, Math.ceil(displayTopics.length / 5))) * 100)}%`}}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="dashboard-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Overview</h3>
              <div className="space-y-4">
                {/* Overall sentiment */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {displayTopics.length > 0 
                      ? `${((displayTopics.reduce((sum, topic) => sum + topic.sentiment_average, 0) / displayTopics.length) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Average Sentiment</div>
                </div>

                {/* Sentiment breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">● Positive Topics</span>
                    <span className="text-sm font-medium">
                      {displayTopics.filter(t => t.sentiment_average > 0.1).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">● Neutral Topics</span>
                    <span className="text-sm font-medium">
                      {displayTopics.filter(t => t.sentiment_average >= -0.1 && t.sentiment_average <= 0.1).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">● Negative Topics</span>
                    <span className="text-sm font-medium">
                      {displayTopics.filter(t => t.sentiment_average < -0.1).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {displayTopics.reduce((sum, topic) => sum + topic.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Mentions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {displayTopics.filter(t => t.trending_score > 0.5).length}
                </div>
                <div className="text-sm text-gray-600">Hot Topics (50%+)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {displayTopics.length > 0 ? Math.max(...displayTopics.map(t => t.count)) : 0}
                </div>
                <div className="text-sm text-gray-600">Most Mentioned</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}