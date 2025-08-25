import { useState, useEffect } from 'react'
import { AlertTriangle, ExternalLink, Users, Clock, TrendingUp } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface CriticalIssue {
  issue_title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  report_count: number
  affected_products: string[]
  first_reported: string
  latest_report: string
  business_impact: string
  sample_posts: Array<{
    title: string
    url: string
    author: string
  }>
  resolution_urgency: string
}

export default function CriticalIssues() {
  const [issues, setIssues] = useState<CriticalIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState(7) // days

  useEffect(() => {
    loadCriticalIssues()
  }, [timeFrame])

  const loadCriticalIssues = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await api.get<CriticalIssue[]>(`/api/business-intelligence/critical-issues?days=${timeFrame}`)
      console.log('Critical Issues API Response:', data) // Debug log
      
      // Ensure data is an array
      const issues = Array.isArray(data) ? data : []
      setIssues(issues)
    } catch (err: any) {
      console.error('Failed to load critical issues:', err)
      setError('Failed to load critical issues')
      // Fallback data for demo
      setIssues([
        {
          issue_title: "JSM Automation Failing After Update",
          severity: "critical",
          report_count: 12,
          affected_products: ["jsm"],
          first_reported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          latest_report: new Date().toISOString(),
          business_impact: "workflow_broken",
          sample_posts: [
            { title: "Automation rules not triggering", url: "#", author: "user123" },
            { title: "JSM 8.20 breaking automations", url: "#", author: "admin456" }
          ],
          resolution_urgency: "immediate"
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'productivity_loss': return '⚠️'
      case 'workflow_broken': return '🚨'
      case 'data_access_blocked': return '🔒'
      default: return '❗'
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Critical Issues</h3>
        </div>
        <LoadingSpinner size="medium" text="Analyzing critical issues..." />
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Critical Issues</h3>
          <span className="text-sm text-gray-500">({issues?.length || 0})</span>
        </div>
        
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {!issues || issues.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <AlertTriangle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-gray-600">No critical issues reported</p>
          <p className="text-sm text-gray-500 mt-1">Community is running smoothly!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues?.map((issue, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <span>{getImpactIcon(issue.business_impact)}</span>
                    <span>{issue.issue_title}</span>
                  </h4>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{issue.report_count} reports</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>First: {formatTimeAgo(issue.first_reported)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Latest: {formatTimeAgo(issue.latest_report)}</span>
                    </span>
                  </div>
                </div>
                
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  issue.severity === 'critical' ? 'bg-red-600 text-white' : 
                  issue.severity === 'high' ? 'bg-orange-600 text-white' :
                  'bg-yellow-600 text-white'
                }`}>
                  {issue.severity.toUpperCase()}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {issue.affected_products.map((product, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white rounded-md border"
                    >
                      {product.toUpperCase()}
                    </span>
                  ))}
                </div>

                {issue.sample_posts.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-gray-700">Recent reports:</p>
                    {issue.sample_posts.slice(0, 2).map((post, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate flex-1">
                          "{post.title}" - {post.author}
                        </span>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {issue.resolution_urgency === 'immediate' && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <p className="text-xs font-medium">
                    ⚡ Requires immediate attention - affecting multiple users
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}