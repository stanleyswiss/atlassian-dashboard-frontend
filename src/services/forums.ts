import api from './api'

export interface ForumOverview {
  name: string
  description: string
  url: string
  icon: string
  post_count: number
  solved_count: number
  critical_count: number
  authors_count: number
  health_score: number
  latest_activity?: {
    title: string
    author: string
    date: string
  }
}

export interface ForumsResponse {
  success: boolean
  forums: Record<string, ForumOverview>
  total_posts: number
  total_solved: number
  total_critical: number
  generated_at: string
}

export const forumsService = {
  /**
   * Get forum overview statistics
   */
  async getForumsOverview(days: number = 7): Promise<ForumsResponse> {
    const response = await api.get(`/api/forums/overview?days=${days}`)
    return response.data
  },

  /**
   * Get detailed forum analytics
   */
  async getForumAnalytics(days: number = 7): Promise<any> {
    const response = await api.get(`/api/forums/analytics?days=${days}`)
    return response.data
  }
}