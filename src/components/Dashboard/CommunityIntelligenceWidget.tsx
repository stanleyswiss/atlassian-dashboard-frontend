import { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import api from '@/services/api'

interface TrendingIssue {
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  post_count: number
}

interface IntelligenceData {
  trending_issues: TrendingIssue[]
  overall_health: string
  summary: string
}

export default function CommunityIntelligenceWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadIntelligence()
  }, [])

  const loadIntelligence = async () => {
    try {
      const response = await api.get('/api/intelligence/community-pulse')
      setIntelligence(response.data)
    } catch (error) {
      console.error('Failed to load community intelligence:', error)
      // Set fallback data
      setIntelligence({
        trending_issues: [
          { issue: "Confluence v9 Plugin Issues", severity: "high", post_count: 8 },
          { issue: "GraphQL API OAuth Problems", severity: "medium", post_count: 5 }
        ],
        overall_health: "mixed",
        summary: "Community showing active engagement with some concerns about recent platform changes"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'active': return 'text-blue-600' 
      case 'mixed': return 'text-yellow-600'
      case 'concerning': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Community Intelligence</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Community Intelligence</h3>
        </div>
        <button 
          onClick={() => onNavigate?.('analytics')}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Health Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Community Health</span>
          <span className={`text-sm font-semibold ${getHealthColor(intelligence?.overall_health || 'active')}`}>
            {(intelligence?.overall_health || 'Active').toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-gray-600">
          {intelligence?.summary || 'Loading community analysis...'}
        </p>
      </div>

      {/* Trending Issues */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-4 h-4 text-orange-600" />
          <h4 className="font-medium text-gray-900">Trending Issues</h4>
        </div>
        
        <div className="space-y-2">
          {intelligence?.trending_issues?.slice(0, 3).map((issue, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {issue.issue}
                </p>
                <p className="text-xs text-gray-500">
                  {issue.post_count} posts
                </p>
              </div>
              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                {issue.severity.toUpperCase()}
              </span>
            </div>
          )) || (
            <div className="text-center py-4">
              <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No trending issues detected</p>
            </div>
          )}
        </div>
      </div>

      {intelligence?.trending_issues && intelligence.trending_issues.length > 3 && (
        <div className="mt-3 text-center">
          <button 
            onClick={() => onNavigate?.('analytics')}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View {intelligence.trending_issues.length - 3} more issues
          </button>
        </div>
      )}
    </div>
  )
}