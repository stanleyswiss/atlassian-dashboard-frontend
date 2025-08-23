import { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, Eye, MessageCircle, Users, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import api from '@/services/api'

interface TrendingIssue {
  issue: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affected_products: string[]
  post_count: number
  summary: string
}

interface ForumSummary {
  forum: string
  post_count: number
  summary: string
  key_topics: string[]
  sentiment_trend: string
  urgency_level: string
  common_problems: string[]
  emerging_trends: string[]
}

interface CommunityPulse {
  overall_health: string
  weekly_insights: any
  trending_issues: TrendingIssue[]
  forum_health: Record<string, any>
  summary: string
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800', 
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity as keyof typeof colors]}`}>
      {severity.toUpperCase()}
    </span>
  )
}

const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
  switch (sentiment) {
    case 'positive':
      return <ArrowUp className="w-4 h-4 text-green-500" />
    case 'negative':
      return <ArrowDown className="w-4 h-4 text-red-500" />
    case 'mixed':
      return <TrendingUp className="w-4 h-4 text-yellow-500" />
    default:
      return <Minus className="w-4 h-4 text-gray-500" />
  }
}

export default function ContentIntelligence() {
  const [communityPulse, setCommunityPulse] = useState<CommunityPulse | null>(null)
  const [selectedForum, setSelectedForum] = useState<string>('jira')
  const [forumSummary, setForumSummary] = useState<ForumSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadIntelligenceData()
  }, [])

  useEffect(() => {
    if (selectedForum) {
      loadForumSummary(selectedForum)
    }
  }, [selectedForum])

  const loadIntelligenceData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const pulse = await api.get('/api/intelligence/community-pulse')
      setCommunityPulse(pulse.data)
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to load intelligence data')
      console.error('Intelligence loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadForumSummary = async (forum: string) => {
    try {
      const summary = await api.get(`/api/intelligence/forum-summary/${forum}`)
      setForumSummary(summary.data)
    } catch (err) {
      console.error(`Failed to load ${forum} summary:`, err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" text="Analyzing community intelligence..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Intelligence Analysis Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadIntelligenceData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Community Pulse Overview */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Community Intelligence Pulse</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{communityPulse?.overall_health || 'Active'}</p>
            <p className="text-sm text-blue-600">Overall Health</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{communityPulse?.trending_issues?.length || 0}</p>
            <p className="text-sm text-green-600">Trending Issues</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">3</p>
            <p className="text-sm text-purple-600">Active Forums</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">AI Summary</h3>
          <p className="text-yellow-700 text-sm">
            {communityPulse?.summary || 'Community showing active engagement across all forums with mixed sentiment due to recent platform changes'}
          </p>
        </div>
      </div>

      {/* Trending Issues */}
      {communityPulse?.trending_issues && communityPulse.trending_issues.length > 0 && (
        <div className="dashboard-card">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Trending Issues</h3>
          </div>
          
          <div className="space-y-3">
            {communityPulse.trending_issues.map((issue, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1">{issue.issue}</h4>
                  <SeverityBadge severity={issue.severity} />
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{issue.summary}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Affected: {issue.affected_products.join(', ')}</span>
                  <span>{issue.post_count} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forum Health Analysis */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Forum Health Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(communityPulse?.forum_health || {}).map(([forum, health]) => (
            <button
              key={forum}
              onClick={() => setSelectedForum(forum)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedForum === forum 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">{forum}</h4>
                <SentimentIcon sentiment={health.sentiment} />
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{health.activity_level} activity</p>
              
              <div className="flex flex-wrap gap-1">
                {health.key_focus?.slice(0, 2).map((topic: string, idx: number) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Forum Details */}
        {forumSummary && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 capitalize">{selectedForum} Deep Dive</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Key Topics</h5>
                <div className="flex flex-wrap gap-2">
                  {forumSummary.key_topics?.map((topic, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Common Problems</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {forumSummary.common_problems?.map((problem, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      <span>{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">AI Analysis Summary</h5>
              <p className="text-sm text-gray-600">{forumSummary.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}