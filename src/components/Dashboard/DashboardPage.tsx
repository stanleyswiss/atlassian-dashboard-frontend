
import { useState, useEffect } from 'react'
import { RefreshCw, Clock, AlertCircle } from 'lucide-react'
import StatsCards from './StatsCards'
import ActivityChart from './ActivityChart'
import RecentPosts from './RecentPosts'
import TrendingTopics from './TrendingTopics'
import { DashboardOverview } from '@/types'
import { dashboardService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true)
    setError(null)
    
    try {
      const data = await dashboardService.getOverview()
      setDashboardData(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboardData(false)
  }

  const handleRetry = () => {
    loadDashboardData()
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        handleRefresh()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [isLoading, isRefreshing])

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading dashboard..." />
        </div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="space-y-6">
        <ErrorMessage 
          error={error} 
          onRetry={handleRetry}
          className="dashboard-card"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Refresh Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Overview</h1>
          <p className="text-gray-600 mt-1">
            Real-time insights into Atlassian Community activity
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Updated {formatLastRefresh(lastRefresh)}</span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Warning if data is stale */}
      {isDataStale(lastRefresh) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Data may be outdated
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                The dashboard data was last updated {formatLastRefresh(lastRefresh)}. 
                Consider refreshing to see the latest community activity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards 
        data={dashboardData}
        isLoading={isRefreshing}
        error={error}
        onRetry={handleRetry}
      />

      {/* Charts and Additional Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        
        {/* Recent Posts */}
        <RecentPosts />
        
        {/* Trending Topics */}
        <TrendingTopics />
      </div>

      {/* Community Health Summary */}
      {dashboardData && (
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Health Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sentiment Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Positive</span>
                  <span className="text-sm font-medium text-green-600">
                    {dashboardData.sentiment_breakdown.positive || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Neutral</span>
                  <span className="text-sm font-medium text-gray-600">
                    {dashboardData.sentiment_breakdown.neutral || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Negative</span>
                  <span className="text-sm font-medium text-red-600">
                    {dashboardData.sentiment_breakdown.negative || 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Most Active</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Forum:</span>
                  <span className="text-sm font-medium text-gray-900 ml-1 capitalize">
                    {dashboardData.most_active_forum || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Topics:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dashboardData.top_issues.slice(0, 3).map((topic: string, index: number) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Activity Trend</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Change</span>
                  <span className={`text-sm font-medium ${
                    dashboardData.recent_activity_change > 0 ? 'text-green-600' : 
                    dashboardData.recent_activity_change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {dashboardData.recent_activity_change > 0 ? '+' : ''}
                    {dashboardData.recent_activity_change.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Health Score</span>
                  <span className="text-sm font-medium text-gray-900">
                    {dashboardData.community_health_score}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function formatLastRefresh(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function isDataStale(lastRefresh: Date): boolean {
  const now = new Date()
  const diff = now.getTime() - lastRefresh.getTime()
  const minutes = Math.floor(diff / 60000)
  return minutes > 30 // Consider stale after 30 minutes
}