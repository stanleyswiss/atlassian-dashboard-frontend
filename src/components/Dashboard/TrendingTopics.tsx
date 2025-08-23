import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Hash, 
  Activity, 
  ArrowUp, 
  ArrowDown,
  Minus,
  Sparkles
} from 'lucide-react'
import { TopicTrend } from '@/types'
import { dashboardService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

interface TrendingTopicsProps {
  limit?: number
  minScore?: number
}

export default function TrendingTopics({ limit = 8, minScore = 0.0 }: TrendingTopicsProps) {
  const [topics, setTopics] = useState<TopicTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrendingTopics()
  }, [limit, minScore])

  const fetchTrendingTopics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const trendingTopics = await dashboardService.getTrendingTopics({ 
        limit, 
        min_score: minScore 
      })
      setTopics(trendingTopics)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending topics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    fetchTrendingTopics()
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Trending Topics</h3>
        </div>
        <LoadingSpinner size="medium" text="Loading trending topics..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Trending Topics</h3>
        </div>
        <ErrorMessage error={error} onRetry={handleRetry} />
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Trending Topics</h3>
        </div>
        <div className="text-center py-8">
          <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No trending topics found</p>
          <button 
            onClick={handleRetry}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Refresh topics
          </button>
        </div>
      </div>
    )
  }

  // Sort topics by trending score (highest first)
  const sortedTopics = [...topics].sort((a, b) => b.trending_score - a.trending_score)

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Trending Topics</h3>
            <p className="text-sm text-gray-600">Hot discussions in the community</p>
          </div>
        </div>
        
        <button 
          onClick={handleRetry}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh topics"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {sortedTopics.map((topic, index) => (
          <TopicItem 
            key={`${topic.topic}-${index}`} 
            topic={topic} 
            rank={index + 1}
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">Total Topics</p>
            <p className="text-lg font-semibold text-gray-900">{topics.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Avg Score</p>
            <p className="text-lg font-semibold text-purple-600">
              {topics.length > 0 
                ? (topics.reduce((sum, topic) => sum + topic.trending_score, 0) / topics.length).toFixed(1)
                : '0'
              }
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Top Score</p>
            <p className="text-lg font-semibold text-green-600">
              {topics.length > 0 ? Math.max(...topics.map(t => t.trending_score)).toFixed(1) : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual topic item component
function TopicItem({ topic, rank }: { topic: TopicTrend; rank: number }) {
  const getTrendIcon = (score: number) => {
    if (score > 0.7) return ArrowUp
    if (score < 0.3) return ArrowDown
    return Minus
  }

  const getTrendColor = (score: number) => {
    if (score > 0.7) return 'text-green-600'
    if (score < 0.3) return 'text-red-600'
    return 'text-gray-600'
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return 'text-green-600'
    if (sentiment < -0.1) return 'text-red-600'
    return 'text-gray-600'
  }

  const TrendIcon = getTrendIcon(topic.trending_score)

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Left side - Topic info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Rank Badge */}
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
          rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'
        }`}>
          {rank}
        </div>

        {/* Topic Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Hash className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-900 truncate" title={topic.topic}>
              {topic.topic}
            </span>
          </div>
          
          {/* Topic Stats */}
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600">
            <span className="flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              {topic.count} mentions
            </span>
            
            {/* Sentiment indicator */}
            <span className={`flex items-center ${getSentimentColor(topic.sentiment_average)}`}>
              Sentiment: {(topic.sentiment_average * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Trending score */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">
            {(topic.trending_score * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">trend</div>
        </div>
        <TrendIcon className={`h-4 w-4 ${getTrendColor(topic.trending_score)}`} />
      </div>
    </div>
  )
}

// Topic skeleton loader
export function TopicSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

// Trending topics word cloud (alternative view)
export function TopicsWordCloud({ topics }: { topics: TopicTrend[] }) {
  if (topics.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      {topics.map((topic, index) => {
        const size = Math.max(12, Math.min(20, topic.trending_score * 20))
        const opacity = Math.max(0.4, Math.min(1, topic.trending_score))
        
        return (
          <span
            key={`${topic.topic}-${index}`}
            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium cursor-pointer hover:bg-blue-200 transition-colors"
            style={{
              fontSize: `${size}px`,
              opacity
            }}
            title={`${topic.count} mentions, ${(topic.trending_score * 100).toFixed(0)}% trending`}
          >
            {topic.topic}
          </span>
        )
      })}
    </div>
  )
}