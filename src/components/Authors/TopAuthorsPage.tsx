import { useState, useEffect } from 'react'
import { 
  Users, 
  MessageCircle, 
  TrendingUp,
  Award,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
  Heart,
  Star,
  Calendar
} from 'lucide-react'
import { Post, PostCategory } from '@/types'
import { postsService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AuthorStats {
  name: string
  total_posts: number
  posts_this_week: number
  posts_today: number
  avg_sentiment: number
  favorite_categories: PostCategory[]
  recent_activity: Date | null
  engagement_score: number
  top_topics: string[]
  activity_streak: number
}

interface FilterOptions {
  timeframe: 'today' | 'week' | 'month' | 'all'
  minPosts: number
  category: PostCategory | 'all'
  sortBy: 'posts' | 'engagement' | 'sentiment' | 'recent'
}

export default function TopAuthorsPage() {
  const [authors, setAuthors] = useState<AuthorStats[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterOptions>({
    timeframe: 'week',
    minPosts: 1,
    category: 'all',
    sortBy: 'posts'
  })

  useEffect(() => {
    loadAuthorData()
  }, [filter])

  const loadAuthorData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get all posts with AI summaries (cached for performance)
      const allPosts = await postsService.getPostsWithSummaries({ limit: 300 })
      setPosts(allPosts)

      // Calculate author statistics
      const authorMap = new Map<string, AuthorStats>()
      
      allPosts.forEach(post => {
        if (!post.author) return

        const authorName = post.author
        let authorStats = authorMap.get(authorName)

        if (!authorStats) {
          authorStats = {
            name: authorName,
            total_posts: 0,
            posts_this_week: 0,
            posts_today: 0,
            avg_sentiment: 0,
            favorite_categories: [],
            recent_activity: null,
            engagement_score: 0,
            top_topics: [],
            activity_streak: 0
          }
          authorMap.set(authorName, authorStats)
        }

        // Update basic stats
        authorStats.total_posts++

        // Time-based counting
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const postDate = post.created_at ? new Date(post.created_at) : null
        
        if (postDate) {
          if (postDate >= today) {
            authorStats.posts_today++
          }
          if (postDate >= weekAgo) {
            authorStats.posts_this_week++
          }
          
          // Track most recent activity
          if (!authorStats.recent_activity || postDate > authorStats.recent_activity) {
            authorStats.recent_activity = postDate
          }
        }
      })

      // Calculate additional metrics for each author
      authorMap.forEach((authorStats, authorName) => {
        const authorPosts = allPosts.filter(post => post.author === authorName)
        
        // Calculate average sentiment
        const sentimentPosts = authorPosts.filter(post => post.sentiment_score !== null)
        if (sentimentPosts.length > 0) {
          authorStats.avg_sentiment = sentimentPosts.reduce((sum, post) => 
            sum + (post.sentiment_score || 0), 0) / sentimentPosts.length
        }

        // Calculate favorite categories
        const categoryMap = new Map<PostCategory, number>()
        authorPosts.forEach(post => {
          categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1)
        })
        
        authorStats.favorite_categories = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category]) => category)

        // Calculate engagement score (posts * sentiment factor * recency factor)
        const sentimentFactor = Math.max(0.5, 1 + authorStats.avg_sentiment)
        const recencyFactor = authorStats.posts_this_week > 0 ? 1.2 : 1.0
        authorStats.engagement_score = Math.round(
          authorStats.total_posts * sentimentFactor * recencyFactor
        )

        // Extract top topics (simplified)
        const topicWords = new Map<string, number>()
        authorPosts.forEach(post => {
          if (post.title) {
            const words = post.title.toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(word => 
                word.length > 4 && 
                !['issue', 'problem', 'question', 'help', 'with', 'after', 'before'].includes(word)
              )
            
            words.forEach(word => {
              topicWords.set(word, (topicWords.get(word) || 0) + 1)
            })
          }
        })

        authorStats.top_topics = Array.from(topicWords.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([word]) => word)

        // Mock activity streak
        authorStats.activity_streak = Math.min(30, Math.max(1, authorStats.posts_this_week * 2))
      })

      // Convert to array and apply filters
      let authorsArray = Array.from(authorMap.values())

      // Apply category filter
      if (filter.category !== 'all') {
        authorsArray = authorsArray.filter(author => 
          author.favorite_categories.includes(filter.category as PostCategory)
        )
      }

      // Apply minimum posts filter
      authorsArray = authorsArray.filter(author => {
        switch (filter.timeframe) {
          case 'today':
            return author.posts_today >= filter.minPosts
          case 'week':
            return author.posts_this_week >= filter.minPosts
          case 'month':
            return author.total_posts >= filter.minPosts // simplified
          case 'all':
          default:
            return author.total_posts >= filter.minPosts
        }
      })

      // Apply sorting
      authorsArray.sort((a, b) => {
        switch (filter.sortBy) {
          case 'engagement':
            return b.engagement_score - a.engagement_score
          case 'sentiment':
            return b.avg_sentiment - a.avg_sentiment
          case 'recent':
            if (!a.recent_activity && !b.recent_activity) return 0
            if (!a.recent_activity) return 1
            if (!b.recent_activity) return -1
            return b.recent_activity.getTime() - a.recent_activity.getTime()
          case 'posts':
          default:
            return b.total_posts - a.total_posts
        }
      })

      setAuthors(authorsArray.slice(0, 50)) // Top 50 authors

    } catch (err: any) {
      setError(err.message || 'Failed to load author data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAuthorData()
  }

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.1) return 'text-green-600'
    if (sentiment < -0.1) return 'text-red-600'
    return 'text-gray-600'
  }

  const getSentimentBadge = (sentiment: number): string => {
    if (sentiment > 0.1) return 'bg-green-100 text-green-800'
    if (sentiment < -0.1) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
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

  const formatRecentActivity = (date: Date | null): string => {
    if (!date) return 'No recent activity'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Active now'
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else {
      return `${diffDays}d ago`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading author statistics..." />
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

  // Prepare chart data for top 10 authors
  const chartData = authors.slice(0, 10).map((author, index) => ({
    name: author.name.length > 12 ? `${author.name.substring(0, 12)}...` : author.name,
    posts: filter.timeframe === 'today' ? author.posts_today :
           filter.timeframe === 'week' ? author.posts_this_week : author.total_posts,
    engagement: author.engagement_score,
    sentiment: author.avg_sentiment * 100
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Top Authors</h1>
          <p className="text-gray-600 mt-1">
            Most active and engaged community contributors
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {authors.length} authors
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={filter.timeframe}
              onChange={(e) => setFilter({...filter, timeframe: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Posts</label>
            <select
              value={filter.minPosts}
              onChange={(e) => setFilter({...filter, minPosts: parseInt(e.target.value)})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={1}>1+ posts</option>
              <option value={3}>3+ posts</option>
              <option value={5}>5+ posts</option>
              <option value={10}>10+ posts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Forums</option>
              <option value="jira">Jira</option>
              <option value="jsm">JSM</option>
              <option value="confluence">Confluence</option>
              <option value="rovo">Rovo</option>
              <option value="announcements">Announcements</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({...filter, sortBy: e.target.value as any})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="posts">Total Posts</option>
              <option value="engagement">Engagement Score</option>
              <option value="sentiment">Sentiment</option>
              <option value="recent">Recent Activity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Authors</p>
              <p className="text-2xl font-bold text-gray-900">{authors.length}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {authors.reduce((sum, author) => sum + 
                  (filter.timeframe === 'today' ? author.posts_today :
                   filter.timeframe === 'week' ? author.posts_this_week : author.total_posts), 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Contributor</p>
              <p className="text-lg font-bold text-gray-900">
                {authors.length > 0 ? authors[0].name : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
              <p className={`text-2xl font-bold ${getSentimentColor(
                authors.length > 0 ? authors.reduce((sum, author) => sum + author.avg_sentiment, 0) / authors.length : 0
              )}`}>
                {authors.length > 0 
                  ? `${((authors.reduce((sum, author) => sum + author.avg_sentiment, 0) / authors.length) * 100).toFixed(0)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 Authors by {filter.sortBy === 'posts' ? 'Post Count' : 'Engagement Score'}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey={filter.sortBy === 'posts' ? 'posts' : 'engagement'} fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Authors List */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Author Rankings</h3>
        
        {authors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No authors found</h3>
            <p className="text-gray-600">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {authors.map((author, index) => (
              <div key={author.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                {/* Left side - Author info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Rank */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  {/* Author details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate" title={author.name}>
                        {author.name}
                      </h4>
                      {author.engagement_score > 50 && (
                        <Star className="h-4 w-4 text-yellow-500" title="High engagement" />
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {author.total_posts} posts
                      </span>
                      
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatRecentActivity(author.recent_activity)}
                      </span>

                      <span className={`px-2 py-1 rounded text-xs ${getSentimentBadge(author.avg_sentiment)}`}>
                        {(author.avg_sentiment * 100).toFixed(0)}% sentiment
                      </span>
                    </div>

                    {/* Favorite categories */}
                    {author.favorite_categories.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {author.favorite_categories.slice(0, 3).map((category, catIndex) => (
                          <span
                            key={catIndex}
                            className={`px-2 py-1 rounded text-xs ${getCategoryColor(category)}`}
                          >
                            {category.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Stats */}
                <div className="flex items-center space-x-6 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {filter.timeframe === 'today' ? author.posts_today :
                       filter.timeframe === 'week' ? author.posts_this_week : author.total_posts}
                    </div>
                    <div className="text-xs text-gray-600">
                      {filter.timeframe === 'today' ? 'today' :
                       filter.timeframe === 'week' ? 'this week' : 'total'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-semibold text-green-600">{author.engagement_score}</div>
                    <div className="text-xs text-gray-600">engagement</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-purple-600">{author.activity_streak}</div>
                    <div className="text-xs text-gray-600">streak</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}