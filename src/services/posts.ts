import api, { buildUrl, createQueryString, withRetry } from './api'
import {
  Post,
  PostFilters,
  PostStatistics,
  PostCategory,
  SentimentLabel,
  PostSearchParams,
  CreatePostRequest,
  UpdatePostRequest
} from '@/types'

// Posts service class
class PostsService {
  // Get posts with filtering and pagination
  async getPosts(filters: PostFilters = {}): Promise<Post[]> {
    const queryString = createQueryString(filters)
    const url = `/api/posts/${queryString ? `?${queryString}` : ''}`
    
    return withRetry(() => api.get<Post[]>(url))
  }

  // Get a single post by ID
  async getPost(id: number): Promise<Post> {
    const url = buildUrl('/api/posts/:id', { id })
    return withRetry(() => api.get<Post>(url))
  }

  // Create a new post
  async createPost(post: CreatePostRequest): Promise<Post> {
    return api.post<Post>('/api/posts/', post)
  }

  // Update an existing post
  async updatePost(id: number, updates: UpdatePostRequest): Promise<Post> {
    const url = buildUrl('/api/posts/:id', { id })
    return api.put<Post>(url, updates)
  }

  // Delete a post
  async deletePost(id: number): Promise<{ message: string }> {
    const url = buildUrl('/api/posts/:id', { id })
    return api.delete<{ message: string }>(url)
  }

  // Search posts by content
  async searchPosts(params: PostSearchParams): Promise<Post[]> {
    const queryString = createQueryString(params)
    const url = `/api/posts/search/by-content?${queryString}`
    
    return withRetry(() => api.get<Post[]>(url))
  }

  // Search posts with AI summaries (cached for performance)
  async searchPostsWithSummaries(params: PostSearchParams): Promise<any[]> {
    const queryString = createQueryString(params)
    const url = `/api/posts/search/with-summaries?${queryString}`
    
    return withRetry(() => api.get<any[]>(url))
  }

  // Get posts summary statistics
  async getPostsStatistics(): Promise<PostStatistics> {
    return withRetry(() => api.get<PostStatistics>('/api/posts/stats/summary'))
  }

  // Get available post categories
  async getCategories(): Promise<PostCategory[]> {
    return withRetry(() => api.get<PostCategory[]>('/api/posts/categories/'))
  }

  // Get available sentiment labels
  async getSentimentLabels(): Promise<SentimentLabel[]> {
    return withRetry(() => api.get<SentimentLabel[]>('/api/posts/sentiments/'))
  }

  // Get posts by specific category
  async getPostsByCategory(category: PostCategory, limit: number = 10): Promise<Post[]> {
    return this.getPosts({ category, limit })
  }

  // Get posts by author
  async getPostsByAuthor(author: string, limit: number = 10): Promise<Post[]> {
    return this.getPosts({ author, limit })
  }

  // Get posts by sentiment
  async getPostsBySentiment(sentiment: SentimentLabel, limit: number = 10): Promise<Post[]> {
    return this.getPosts({ sentiment, limit })
  }

  // Get recent posts (last N posts)
  async getRecentPosts(limit: number = 20): Promise<Post[]> {
    return this.getPosts({ limit, skip: 0 })
  }

  // Get posts with AI-generated summaries instead of full content
  async getPostsWithSummaries(filters: PostFilters = {}): Promise<any[]> {
    const queryString = createQueryString(filters)
    const url = `/api/posts/with-summaries${queryString ? `?${queryString}` : ''}`
    
    return withRetry(() => api.get<any[]>(url))
  }

  // Get posts by hashtag
  async getPostsByHashtag(hashtag: string, limit: number = 20, skip: number = 0): Promise<Post[]> {
    const url = `/api/posts/hashtag/${encodeURIComponent(hashtag)}?limit=${limit}&skip=${skip}`
    
    return withRetry(() => api.get<Post[]>(url))
  }

  // Get posts with pagination
  async getPostsPaginated(page: number = 1, pageSize: number = 20, filters: Omit<PostFilters, 'skip' | 'limit'> = {}): Promise<{
    posts: Post[]
    pagination: {
      page: number
      pageSize: number
      total: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }> {
    const skip = (page - 1) * pageSize
    const limit = pageSize
    
    const allFilters: PostFilters = {
      ...filters,
      skip,
      limit: limit + 1 // Get one extra to check if there are more
    }

    const posts = await this.getPosts(allFilters)
    const hasNext = posts.length > pageSize
    const actualPosts = hasNext ? posts.slice(0, pageSize) : posts

    // Get total count for proper pagination (in a real app, the API should return this)
    const stats = await this.getPostsStatistics()
    
    return {
      posts: actualPosts,
      pagination: {
        page,
        pageSize,
        total: stats.total_posts,
        hasNext,
        hasPrevious: page > 1
      }
    }
  }

  // Advanced search with multiple filters
  async advancedSearch(options: {
    query?: string
    categories?: PostCategory[]
    sentiments?: SentimentLabel[]
    authors?: string[]
    dateRange?: {
      start: string
      end: string
    }
    limit?: number
    skip?: number
  }): Promise<Post[]> {
    const { query, categories, sentiments, authors, limit, skip } = options

    // If there's a text query, use the search endpoint
    if (query) {
      return this.searchPosts({ query, limit, skip })
    }

    // Otherwise use regular filtering
    const filters: PostFilters = {}
    
    if (categories && categories.length === 1) {
      filters.category = categories[0]
    }
    
    if (sentiments && sentiments.length === 1) {
      filters.sentiment = sentiments[0]
    }
    
    if (authors && authors.length === 1) {
      filters.author = authors[0]
    }
    
    if (limit) filters.limit = limit
    if (skip) filters.skip = skip

    let posts = await this.getPosts(filters)

    // Apply client-side filtering for multiple values (not ideal, but works for MVP)
    if (categories && categories.length > 1) {
      posts = posts.filter(post => categories.includes(post.category))
    }
    
    if (sentiments && sentiments.length > 1) {
      posts = posts.filter(post => post.sentiment_label && sentiments.includes(post.sentiment_label))
    }
    
    if (authors && authors.length > 1) {
      posts = posts.filter(post => authors.some(author => 
        post.author.toLowerCase().includes(author.toLowerCase())
      ))
    }

    return posts
  }

  // Get posts grouped by category
  async getPostsGroupedByCategory(): Promise<Record<PostCategory, Post[]>> {
    const categories = await this.getCategories()
    
    const categoryPosts = await Promise.allSettled(
      categories.map(category => 
        this.getPostsByCategory(category, 5)
      )
    )

    const result: Record<PostCategory, Post[]> = {} as Record<PostCategory, Post[]>
    
    categories.forEach((category, index) => {
      const posts = categoryPosts[index]
      result[category] = posts.status === 'fulfilled' ? posts.value : []
    })

    return result
  }

  // Get sentiment distribution
  async getSentimentDistribution(): Promise<{
    positive: { count: number; percentage: number }
    negative: { count: number; percentage: number }
    neutral: { count: number; percentage: number }
  }> {
    const stats = await this.getPostsStatistics()
    const total = stats.total_posts
    
    const positive = stats.sentiment_breakdown.positive || 0
    const negative = stats.sentiment_breakdown.negative || 0
    const neutral = stats.sentiment_breakdown.neutral || 0

    return {
      positive: { 
        count: positive, 
        percentage: total > 0 ? (positive / total) * 100 : 0 
      },
      negative: { 
        count: negative, 
        percentage: total > 0 ? (negative / total) * 100 : 0 
      },
      neutral: { 
        count: neutral, 
        percentage: total > 0 ? (neutral / total) * 100 : 0 
      }
    }
  }

  // Get top authors
  async getTopAuthors(limit: number = 10): Promise<Array<{
    author: string
    post_count: number
    percentage: number
  }>> {
    const stats = await this.getPostsStatistics()
    const totalPosts = stats.total_posts
    
    return stats.top_authors
      .slice(0, limit)
      .map(author => ({
        ...author,
        percentage: totalPosts > 0 ? (author.post_count / totalPosts) * 100 : 0
      }))
  }

  // Export posts data
  async exportPosts(filters: PostFilters = {}, format: 'json' | 'csv' = 'json'): Promise<string> {
    const posts = await this.getPosts(filters)
    
    if (format === 'json') {
      return JSON.stringify(posts, null, 2)
    }
    
    // CSV export
    if (posts.length === 0) {
      return 'No data to export'
    }
    
    const headers = Object.keys(posts[0])
    const csvRows = [headers.join(',')]
    
    posts.forEach(post => {
      const values = headers.map(header => {
        const value = (post as any)[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      })
      csvRows.push(values.join(','))
    })
    
    return csvRows.join('\n')
  }

  // Validate post data
  validatePost(post: CreatePostRequest | UpdatePostRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if ('title' in post && (!post.title || post.title.trim().length === 0)) {
      errors.push('Title is required')
    }
    
    if ('title' in post && post.title && post.title.length > 500) {
      errors.push('Title must be less than 500 characters')
    }
    
    if ('content' in post && (!post.content || post.content.trim().length === 0)) {
      errors.push('Content is required')
    }
    
    if ('author' in post && (!post.author || post.author.trim().length === 0)) {
      errors.push('Author is required')
    }
    
    if ('url' in post && (!post.url || !this.isValidUrl(post.url))) {
      errors.push('Valid URL is required')
    }
    
    if ('sentiment_score' in post && post.sentiment_score !== undefined && post.sentiment_score !== null &&
        (post.sentiment_score < -1 || post.sentiment_score > 1)) {
      errors.push('Sentiment score must be between -1 and 1')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Helper method to validate URLs
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

// Create and export service instance
export const postsService = new PostsService()
export default postsService

// Helper functions for formatting
export const formatPostDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getSentimentColor = (sentiment: SentimentLabel | null): string => {
  switch (sentiment) {
    case SentimentLabel.POSITIVE:
      return 'text-green-600'
    case SentimentLabel.NEGATIVE:
      return 'text-red-600'
    case SentimentLabel.NEUTRAL:
      return 'text-gray-600'
    default:
      return 'text-gray-400'
  }
}

export const getCategoryColor = (category: PostCategory): string => {
  switch (category) {
    case PostCategory.JIRA:
      return 'bg-blue-100 text-blue-800'
    case PostCategory.JSM:
      return 'bg-green-100 text-green-800'
    case PostCategory.CONFLUENCE:
      return 'bg-purple-100 text-purple-800'
    case PostCategory.ROVO:
      return 'bg-orange-100 text-orange-800'
    case PostCategory.ANNOUNCEMENTS:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}