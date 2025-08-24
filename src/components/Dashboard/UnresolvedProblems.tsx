import { useState, useEffect } from 'react'
import { HelpCircle, ExternalLink, Camera, Clock, AlertCircle, MessageCircle } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface UnresolvedProblem {
  problem_title: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  days_unresolved: number
  author: string
  url: string
  affected_products: string[]
  problem_type: string
  has_screenshots: boolean
  business_impact: string
  help_potential: string
}

export default function UnresolvedProblems() {
  const [problems, setProblems] = useState<UnresolvedProblem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'urgency' | 'age'>('urgency')

  useEffect(() => {
    loadUnresolvedProblems()
  }, [])

  const loadUnresolvedProblems = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/business-intelligence/unresolved-problems?days=14')
      setProblems(response.data)
    } catch (err: any) {
      console.error('Failed to load unresolved problems:', err)
      setError('Failed to load problems')
      // Fallback data for demo
      setProblems([
        {
          problem_title: "GraphQL API OAuth scope configuration not working",
          urgency: "high",
          days_unresolved: 5,
          author: "dev_team_lead",
          url: "#",
          affected_products: ["jira"],
          problem_type: "api_integration",
          has_screenshots: true,
          business_impact: "feature_unavailable",
          help_potential: "high"
        },
        {
          problem_title: "Confluence v9 plugin compatibility issues",
          urgency: "medium",
          days_unresolved: 8,
          author: "plugin_developer",
          url: "#",
          affected_products: ["confluence"],
          problem_type: "configuration_issue",
          has_screenshots: false,
          business_impact: "workflow_broken",
          help_potential: "medium"
        },
        {
          problem_title: "JSM customer portal customization limitations",
          urgency: "low",
          days_unresolved: 12,
          author: "support_manager",
          url: "#",
          affected_products: ["jsm"],
          problem_type: "feature_limitation",
          has_screenshots: true,
          business_impact: "minor_inconvenience",
          help_potential: "low"
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProblemTypeIcon = (type: string) => {
    switch (type) {
      case 'api_integration': return '🔌'
      case 'configuration_issue': return '⚙️'
      case 'system_error': return '❌'
      case 'performance_issue': return '🐌'
      case 'feature_limitation': return '🚧'
      default: return '❓'
    }
  }

  const getBusinessImpactLabel = (impact: string) => {
    switch (impact) {
      case 'productivity_loss': return { label: 'Productivity Loss', color: 'text-red-600' }
      case 'workflow_broken': return { label: 'Workflow Broken', color: 'text-orange-600' }
      case 'feature_unavailable': return { label: 'Feature Blocked', color: 'text-yellow-600' }
      case 'minor_inconvenience': return { label: 'Minor Issue', color: 'text-blue-600' }
      default: return { label: 'Unknown Impact', color: 'text-gray-600' }
    }
  }

  const getHelpPotentialIndicator = (potential: string) => {
    switch (potential) {
      case 'high': return { icon: '🟢', text: 'Community can likely help' }
      case 'medium': return { icon: '🟡', text: 'May need expert help' }
      case 'low': return { icon: '🔴', text: 'Needs Atlassian support' }
      default: return { icon: '⚪', text: 'Unknown' }
    }
  }

  const sortedProblems = [...problems].sort((a, b) => {
    if (sortBy === 'urgency') {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    } else {
      return b.days_unresolved - a.days_unresolved
    }
  })

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Unresolved Problems</h3>
        </div>
        <LoadingSpinner size="medium" text="Loading unresolved issues..." />
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Unresolved Problems</h3>
          <span className="text-sm text-gray-500">({problems.length})</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'urgency' | 'age')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="urgency">Urgency</option>
            <option value="age">Days Unresolved</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {problems.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <HelpCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-gray-600">All problems resolved!</p>
          <p className="text-sm text-gray-500 mt-1">Great community support 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedProblems.map((problem, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getUrgencyColor(problem.urgency)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{getProblemTypeIcon(problem.problem_type)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        <a 
                          href={problem.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {problem.problem_title}
                        </a>
                      </h4>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="flex items-center space-x-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{problem.days_unresolved} days unresolved</span>
                        </span>
                        
                        <span className="text-gray-500">by {problem.author}</span>
                        
                        {problem.has_screenshots && (
                          <span className="flex items-center space-x-1 text-gray-600">
                            <Camera className="w-4 h-4" />
                            <span>Has screenshots</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 flex-shrink-0 ml-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-sm">
                  {problem.affected_products.map((product, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white rounded-md"
                    >
                      {product.toUpperCase()}
                    </span>
                  ))}
                  
                  <span className={`font-medium ${getBusinessImpactLabel(problem.business_impact).color}`}>
                    {getBusinessImpactLabel(problem.business_impact).label}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <span title={getHelpPotentialIndicator(problem.help_potential).text}>
                    {getHelpPotentialIndicator(problem.help_potential).icon}
                  </span>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    problem.urgency === 'critical' ? 'bg-red-600 text-white' : 
                    problem.urgency === 'high' ? 'bg-orange-600 text-white' :
                    problem.urgency === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {problem.urgency.toUpperCase()}
                  </span>
                </div>
              </div>

              {problem.days_unresolved > 7 && problem.urgency !== 'low' && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <p className="text-xs font-medium flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Needs attention - unresolved for over a week</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center space-x-1">
          <MessageCircle className="w-4 h-4" />
          <span>Help resolve these issues</span>
        </button>
      </div>
    </div>
  )
}