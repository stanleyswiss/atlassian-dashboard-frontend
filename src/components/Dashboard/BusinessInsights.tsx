import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface ExecutiveSummary {
  week_summary: string
  key_highlights: string[]
  business_impact: {
    high_impact_unresolved: number
    solution_sharing_trend: string
    critical_attention_needed: boolean
  }
  recommendations: string[]
}

interface BusinessMetrics {
  total_posts: number
  critical_issue_rate: number
  solution_sharing_rate: number
  category_breakdown: Record<string, number>
  community_health_score: number
}

interface InsightData {
  generated_at: string
  time_period: string
  total_posts_analyzed: number
  executive_summary: ExecutiveSummary
  business_metrics: BusinessMetrics
  recommendations: string[]
}

export default function BusinessInsights() {
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadBusinessInsights()
  }, [])

  const loadBusinessInsights = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/business-intelligence/executive-summary')
      setInsights(response.data)
    } catch (err: any) {
      console.error('Failed to load business insights:', err)
      setError('Failed to load insights')
      // Fallback data for demo
      setInsights({
        generated_at: new Date().toISOString(),
        time_period: "Last 7 days",
        total_posts_analyzed: 156,
        executive_summary: {
          week_summary: "Analyzed 156 high-value community interactions with significant activity in problem reporting and solution sharing",
          key_highlights: [
            "🚨 Critical: JSM automation failing after 8.20 update (12 reports)",
            "💡 Highlight: Netflix Jira content pipeline case study went viral",
            "✅ 8 trending solutions shared this week"
          ],
          business_impact: {
            high_impact_unresolved: 3,
            solution_sharing_trend: "increasing",
            critical_attention_needed: true
          },
          recommendations: [
            "Immediate action needed on critical issues - assign engineering resources",
            "High volume of unresolved problems - consider documentation review",
            "Feature request trend detected for JSM - product team review recommended"
          ]
        },
        business_metrics: {
          total_posts: 156,
          critical_issue_rate: 8.3,
          solution_sharing_rate: 15.4,
          category_breakdown: {
            "critical_issue": 13,
            "solution_sharing": 24,
            "awesome_use_case": 8,
            "feature_request": 18,
            "general_discussion": 93
          },
          community_health_score: 72
        },
        recommendations: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'decreasing': return <ArrowDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Business Intelligence</h3>
        </div>
        <LoadingSpinner size="medium" text="Generating executive insights..." />
      </div>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Executive Summary</h3>
        </div>
        
        <span className="text-xs text-gray-500">
          Updated {formatDate(insights.generated_at)}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Week Summary */}
      <div className="mb-6">
        <p className="text-gray-700">
          {insights.executive_summary.week_summary}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{insights.total_posts_analyzed}</p>
          <p className="text-xs text-gray-600">Posts Analyzed</p>
        </div>
        
        <div className={`text-center p-3 rounded-lg ${getHealthScoreColor(insights.business_metrics.community_health_score)}`}>
          <p className="text-2xl font-bold">{insights.business_metrics.community_health_score}</p>
          <p className="text-xs">Health Score</p>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{insights.business_metrics.critical_issue_rate.toFixed(1)}%</p>
          <p className="text-xs text-red-600">Critical Rate</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{insights.business_metrics.solution_sharing_rate.toFixed(1)}%</p>
          <p className="text-xs text-green-600">Solution Rate</p>
        </div>
      </div>

      {/* Key Highlights */}
      {insights.executive_summary.key_highlights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Highlights</h4>
          <div className="space-y-2">
            {insights.executive_summary.key_highlights.map((highlight, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-sm text-gray-700">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Impact Indicators */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-900 mb-3">Business Impact</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700">High Impact Unresolved Issues</span>
            <span className="font-semibold text-purple-900">
              {insights.executive_summary.business_impact.high_impact_unresolved}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700">Solution Sharing Trend</span>
            <div className="flex items-center space-x-1">
              {getTrendIcon(insights.executive_summary.business_impact.solution_sharing_trend)}
              <span className="font-semibold text-purple-900 capitalize">
                {insights.executive_summary.business_impact.solution_sharing_trend}
              </span>
            </div>
          </div>
          
          {insights.executive_summary.business_impact.critical_attention_needed && (
            <div className="mt-2 flex items-center space-x-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-orange-700 font-medium">Critical attention needed</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {insights.executive_summary.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Recommended Actions</span>
          </h4>
          <div className="space-y-2">
            {insights.executive_summary.recommendations.slice(0, isExpanded ? undefined : 2).map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="text-sm text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
          
          {insights.executive_summary.recommendations.length > 2 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isExpanded ? 'Show less' : `Show ${insights.executive_summary.recommendations.length - 2} more`}
            </button>
          )}
        </div>
      )}

      {/* View Full Report Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center space-x-2">
          <TrendingUp className="w-4 h-4" />
          <span>View Full Business Intelligence Report</span>
        </button>
      </div>
    </div>
  )
}