
import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Tag, 
  ExternalLink,
  MessageCircle,
  Clock,
  RefreshCw,
  Hash
} from 'lucide-react'
import { Post, PostCategory, SentimentLabel } from '@/types'
import { postsService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import { formatPostDate, getSentimentColor, getCategoryColor } from '@/services/posts'

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'all'>('all')
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentLabel | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)

  const POSTS_PER_PAGE = 10 // Reduced from 20 to improve performance

  useEffect(() => {
    loadPosts()
  }, [currentPage, selectedCategory, selectedSentiment, searchQuery])

  const loadPosts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: any = {
        limit: POSTS_PER_PAGE,
        skip: (currentPage - 1) * POSTS_PER_PAGE
      }

      if (selectedCategory !== 'all') {
        filters.category = selectedCategory
      }

      if (selectedSentiment !== 'all') {
        filters.sentiment = selectedSentiment
      }

      if (searchQuery.trim()) {
        // Use AI-cached search endpoint if there's a query
        const searchResults = await postsService.searchPostsWithSummaries({
          query: searchQuery,
          limit: POSTS_PER_PAGE,
          skip: filters.skip
        })
        setPosts(searchResults)
      } else {
        // Use AI-summarized posts instead of full posts
        const postsData = await postsService.getPostsWithSummaries(filters)
        setPosts(postsData)
      }

      // Get stats for pagination (with fallback)
      try {
        const stats = await postsService.getPostsStatistics()
        setTotalPosts(stats.total_posts)
      } catch (statsError) {
        console.warn('Failed to load posts statistics, using fallback:', statsError)
        setTotalPosts(posts.length > 0 ? 100 : 0) // Fallback estimate
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadPosts()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadPosts()
  }

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading community posts..." />
        </div>
      </div>
    )
  }

  if (error && posts.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Community Posts</h1>
          <p className="text-gray-600 mt-1">
            Browse and search through all community discussions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {totalPosts} total posts
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
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts, titles, content..."
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

          {/* Category and Sentiment Filters */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PostCategory | 'all')}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Forums</option>
                <option value="jira">Jira</option>
                <option value="jsm">JSM</option>
                <option value="confluence">Confluence</option>
                <option value="rovo">Rovo</option>
                <option value="announcements">Announcements</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-gray-400" />
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value as SentimentLabel | 'all')}
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="dashboard-card">
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((currentPage - 1) * POSTS_PER_PAGE) + 1} to {Math.min(currentPage * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Post Card Component  
function PostCard({ post }: { post: any }) {
  const handlePostClick = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleHashtagClick = (hashtag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Navigate to hashtag view (implement this based on your routing)
    console.log('Hashtag clicked:', hashtag)
  }

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer group"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title && post.title.trim() ? post.title : `Discussion in ${post.category.toUpperCase()}`}
          </h3>
          
          <div className="flex items-center space-x-3 mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
              <Tag className="h-3 w-3 mr-1" />
              {post.category.toUpperCase()}
            </span>
            
            {post.ai_category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {post.ai_category}
              </span>
            )}
            
            {post.sentiment_label && (
              <span className={`text-xs font-medium ${getSentimentColor(post.sentiment_label)}`}>
                {post.sentiment_label}
                {post.sentiment_score && ` (${(post.sentiment_score * 100).toFixed(0)}%)`}
              </span>
            )}
          </div>
        </div>
        
        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-3" />
      </div>

      {/* AI Summary Content */}
      <div className="mb-3">
        <p className="text-gray-700 mb-2 leading-relaxed font-medium">
          {post.ai_summary || post.excerpt || 'AI summary unavailable'}
        </p>
        
        {/* Key Points */}
        {post.ai_key_points && post.ai_key_points.length > 0 && (
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            {post.ai_key_points.slice(0, 3).map((point: string, index: number) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Hashtags */}
      {post.ai_hashtags && post.ai_hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.ai_hashtags.slice(0, 5).map((hashtag: string) => (
            <button
              key={hashtag}
              onClick={(e) => handleHashtagClick(hashtag, e)}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Hash className="h-3 w-3 mr-1" />
              {hashtag}
            </button>
          ))}
        </div>
      )}

      {/* Action Required Badge */}
      {post.ai_action_required && post.ai_action_required !== 'none' && (
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            post.ai_action_required === 'high' ? 'bg-red-100 text-red-800' :
            post.ai_action_required === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {post.ai_action_required.toUpperCase()} PRIORITY
          </span>
        </div>
      )}

      {/* Post Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            <span>{post.author}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatPostDate(post.date)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}