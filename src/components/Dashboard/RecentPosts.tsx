import { useState, useEffect } from 'react'
import { 
  FileText, 
  User, 
  Clock, 
  ExternalLink, 
  MessageCircle,
  Tag
} from 'lucide-react'
import { Post, PostCategory } from '@/types'
import { dashboardService } from '@/services'
import { formatPostDate, getSentimentColor, getCategoryColor } from '@/services/posts'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

interface RecentPostsProps {
  limit?: number
  category?: PostCategory
}

export default function RecentPosts({ limit = 5, category }: RecentPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentPosts()
  }, [limit, category])

  const fetchRecentPosts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const recentPosts = await dashboardService.getRecentPosts({ limit, category })
      setPosts(recentPosts)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recent posts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    fetchRecentPosts()
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
        </div>
        <LoadingSpinner size="medium" text="Loading recent posts..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
        </div>
        <ErrorMessage error={error} onRetry={handleRetry} />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
        </div>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No recent posts found</p>
          <button 
            onClick={handleRetry}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2"
          >
            Refresh posts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
            <p className="text-sm text-gray-600">Latest community discussions</p>
          </div>
        </div>
        
        <button 
          onClick={handleRetry}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh posts"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostItem key={post.id || index} post={post} />
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all posts →
        </button>
      </div>
    </div>
  )
}

// Individual post item component
function PostItem({ post }: { post: Post }) {
  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const handlePostClick = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div 
      className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h4>
          <div className="flex items-center space-x-3 mt-1">
            {/* Category Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
              <Tag className="h-3 w-3 mr-1" />
              {post.category.toUpperCase()}
            </span>
            
            {/* Sentiment Badge */}
            {post.sentiment_label && (
              <span className={`text-xs font-medium ${getSentimentColor(post.sentiment_label)}`}>
                {post.sentiment_label}
              </span>
            )}
          </div>
        </div>
        
        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
      </div>

      {/* Post Content Preview */}
      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
        {truncateContent(post.excerpt || post.content)}
      </p>

      {/* Post Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span className="font-medium">{post.author}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatPostDate(post.date)}</span>
          </div>
        </div>
        
        {/* Sentiment Score */}
        {post.sentiment_score !== null && post.sentiment_score !== undefined && (
          <div className="flex items-center">
            <span className="text-gray-400">Sentiment:</span>
            <span className={`ml-1 font-medium ${
              post.sentiment_score > 0 ? 'text-green-600' : 
              post.sentiment_score < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {post.sentiment_score > 0 ? '+' : ''}{(post.sentiment_score * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Post skeleton loader
export function PostSkeleton() {
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="flex items-center space-x-2 mb-3">
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-12 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}