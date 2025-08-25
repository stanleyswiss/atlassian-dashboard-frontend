import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Users, 
  MessageCircle, 
  TrendingUp,
  Clock,
  Activity,
  Target,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { forumsService, type ForumOverview, type ForumsResponse } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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
      // Get forum overview from new API
      const response = await forumsService.getForumsOverview(selectedTimeframe)
      setForumsData(response)

      // Calculate forum statistics
      const forumCategories: PostCategory[] = ['jira', 'jsm', 'confluence', 'rovo', 'announcements']
      const stats: ForumStats[] = []

      for (const category of forumCategories) {
        const categoryPosts = allPosts.filter(post => post.category === category)
        
        // Time-based filtering
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const postsToday = categoryPosts.filter(post => 
          post.created_at && new Date(post.created_at) >= today
        )
        const postsWeek = categoryPosts.filter(post => 
          post.created_at && new Date(post.created_at) >= weekAgo
        )

        // Calculate sentiment
        const sentimentPosts = categoryPosts.filter(post => post.sentiment_score !== null)
        const avgSentiment = sentimentPosts.length > 0 
          ? sentimentPosts.reduce((sum, post) => sum + (post.sentiment_score || 0), 0) / sentimentPosts.length
          : 0

        // Get unique authors
        const uniqueAuthors = new Set(categoryPosts.map(post => post.author)).size

        // Extract common topics (simple keyword analysis)
        const topTopics = extractTopTopics(categoryPosts)

        // Calculate activity trend (mock for now)
        const activityTrend = Math.random() * 40 - 20 // Random between -20% and +20%

        stats.push({
          category,
          name: getForumName(category),
          description: getForumDescription(category),
          total_posts: categoryPosts.length,
          posts_today: postsToday.length,
          posts_week: postsWeek.length,
          unique_authors: uniqueAuthors,
          avg_sentiment: avgSentiment,
          top_topics: topTopics,
          activity_trend: activityTrend,
          url: getForumUrl(category)
        })
      }

      setForumStats(stats.sort((a, b) => b.total_posts - a.total_posts))

    } catch (err: any) {
      setError(err.message || 'Failed to load forum data')
    } finally {
      setIsLoading(false)
    }
  }

  const extractTopTopics = (posts: Post[]): string[] => {
    // Simple topic extraction from titles
    const commonWords = new Map<string, number>()
    
    posts.forEach(post => {
      if (post.title) {
        const words = post.title.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => 
            word.length > 3 && 
            !['with', 'after', 'before', 'when', 'where', 'what', 'how'].includes(word)
          )
        
        words.forEach(word => {
          commonWords.set(word, (commonWords.get(word) || 0) + 1)
        })
      }
    })

    return Array.from(commonWords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  const getForumName = (category: PostCategory): string => {
    const names = {
      jira: 'Jira',
      jsm: 'Jira Service Management',
      confluence: 'Confluence',
      rovo: 'Rovo',
      announcements: 'Announcements'
    }
    return names[category]
  }

  const getForumDescription = (category: PostCategory): string => {
    const descriptions = {
      jira: 'Project tracking and agile development',
      jsm: 'IT service management and support',
      confluence: 'Team collaboration and documentation',
      rovo: 'AI-powered search and insights',
      announcements: 'Product updates and news'
    }
    return descriptions[category]
  }

  const getForumUrl = (category: PostCategory): string => {
    const urls = {
      jira: 'https://community.atlassian.com/c/jira/5',
      jsm: 'https://community.atlassian.com/c/jira-service-desk/10',
      confluence: 'https://community.atlassian.com/c/confluence/6',
      rovo: 'https://community.atlassian.com/c/rovo/73',
      announcements: 'https://community.atlassian.com/c/announcements/19'
    }
    return urls[category]
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

  const handleRefresh = () => {
    loadForumData()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading forum statistics..." />
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

  // Prepare chart data
  const chartData = forumStats.map(forum => ({
    name: forum.name.split(' ')[0], // Short name for charts
    posts: selectedTimeframe === 'today' ? forum.posts_today : 
           selectedTimeframe === 'week' ? forum.posts_week : forum.total_posts,
    sentiment: forum.avg_sentiment * 100,
    authors: forum.unique_authors
  }))

  const pieColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forum Comparison</h1>
          <p className="text-gray-600 mt-1">
            Compare activity and engagement across all Atlassian community forums
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as 'today' | 'week' | 'month')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">All Time</option>
          </select>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {forumStats.reduce((sum, forum) => sum + 
                  (selectedTimeframe === 'today' ? forum.posts_today : 
                   selectedTimeframe === 'week' ? forum.posts_week : forum.total_posts), 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Authors</p>
              <p className="text-2xl font-bold text-gray-900">
                {forumStats.reduce((sum, forum) => sum + forum.unique_authors, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Most Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {forumStats.length > 0 ? forumStats[0].name.split(' ')[0] : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
              <p className={`text-2xl font-bold ${getSentimentColor(
                forumStats.length > 0 ? forumStats.reduce((sum, forum) => sum + forum.avg_sentiment, 0) / forumStats.length : 0
              )}`}>
                {forumStats.length > 0 
                  ? `${((forumStats.reduce((sum, forum) => sum + forum.avg_sentiment, 0) / forumStats.length) * 100).toFixed(0)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts by Forum */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Posts by Forum ({selectedTimeframe === 'today' ? 'Today' : selectedTimeframe === 'week' ? 'This Week' : 'All Time'})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#8B5CF6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forum Distribution */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Forum Post Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="posts"
                  label={(entry) => `${entry.name}: ${entry.posts}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Forum Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Forum Details</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {forumStats.map((forum, index) => (
            <div key={forum.category} className="dashboard-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg`} style={{backgroundColor: `${pieColors[index]}20`}}>
                      <BarChart className="h-5 w-5" style={{color: pieColors[index]}} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{forum.name}</h4>
                      <p className="text-sm text-gray-600">{forum.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Posts</p>
                      <p className="text-lg font-semibold text-gray-900">{forum.total_posts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">This Week</p>
                      <p className="text-lg font-semibold text-blue-600">{forum.posts_week}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Today</p>
                      <p className="text-lg font-semibold text-green-600">{forum.posts_today}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Authors</p>
                      <p className="text-lg font-semibold text-purple-600">{forum.unique_authors}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Sentiment</p>
                      <p className={`text-sm font-semibold px-2 py-1 rounded ${getSentimentBadge(forum.avg_sentiment)}`}>
                        {(forum.avg_sentiment * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Trend</p>
                      <p className={`text-sm font-semibold ${forum.activity_trend > 0 ? 'text-green-600' : forum.activity_trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {forum.activity_trend > 0 ? '+' : ''}{forum.activity_trend.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Top Topics */}
                  {forum.top_topics.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">Popular Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {forum.top_topics.slice(0, 4).map((topic, topicIndex) => (
                          <span
                            key={topicIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <a
                    href={forum.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Visit Forum</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}