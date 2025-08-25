import { useState, useEffect } from 'react'
import { 
  Users, 
  MessageCircle, 
  TrendingUp,
  Activity,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { forumsService, type ForumOverview, type ForumsResponse } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

export default function ForumsPage() {
  const [forumsData, setForumsData] = useState<ForumsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<7 | 14 | 30>(7)

  useEffect(() => {
    loadForumData()
  }, [selectedTimeframe])

  const loadForumData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await forumsService.getForumsOverview(selectedTimeframe)
      setForumsData(response)
    } catch (err: any) {
      setError(err.message || 'Failed to load forums data')
    } finally {
      setIsLoading(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Attention'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading forums data..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorMessage error={error} onRetry={loadForumData} />
      </div>
    )
  }

  if (!forumsData?.forums) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Forums Data</h3>
          <p className="text-gray-600">Unable to load forums information.</p>
        </div>
      </div>
    )
  }

  const forums = Object.entries(forumsData.forums)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Forums</h1>
          <p className="text-gray-600 mt-1">
            Overview of Atlassian Community forum activity and health metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(Number(e.target.value) as 7 | 14 | 30)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          
          <button
            onClick={loadForumData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{forumsData.total_posts}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Solved Posts</p>
              <p className="text-2xl font-bold text-gray-900">{forumsData.total_solved}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-900">{forumsData.total_critical}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {forumsData.total_posts > 0 ? Math.round((forumsData.total_solved / forumsData.total_posts) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forums.map(([forumKey, forum]: [string, ForumOverview]) => (
          <div key={forumKey} className="dashboard-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{forum.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{forum.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{forum.description}</p>
                </div>
              </div>
              <a
                href={forum.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Forum Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Posts</span>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{forum.post_count}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Solved</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{forum.solved_count}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical</span>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{forum.critical_count}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Authors</span>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{forum.authors_count}</span>
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Health Score</span>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getHealthColor(forum.health_score)}`}>
                  {Math.round(forum.health_score)}% - {getHealthLabel(forum.health_score)}
                </div>
              </div>
            </div>

            {/* Latest Activity */}
            {forum.latest_activity && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Latest Activity</div>
                <div className="text-sm text-gray-700 line-clamp-1" title={forum.latest_activity.title}>
                  {forum.latest_activity.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  by {forum.latest_activity.author} • {new Date(forum.latest_activity.date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Timestamp */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Last updated: {new Date(forumsData.generated_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}