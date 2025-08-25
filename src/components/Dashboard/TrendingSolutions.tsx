import { useState, useEffect } from 'react'
import { CheckCircle, ExternalLink, Camera, TrendingUp, Code, Settings, BookOpen } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface TrendingSolution {
  solution_title: string
  problem_solved: string
  solution_type: string
  author: string
  url: string
  products_affected: string[]
  technical_level: string
  has_visual_guide: boolean
  effectiveness_score: number
  popularity_trend: string
}

export default function TrendingSolutions() {
  const [solutions, setSolutions] = useState<TrendingSolution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'visual' | 'advanced'>('all')

  useEffect(() => {
    loadTrendingSolutions()
  }, [])

  const loadTrendingSolutions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await api.get<TrendingSolution[]>('/api/business-intelligence/trending-solutions')
      console.log('Trending Solutions API Response:', data) // Debug log
      
      // Ensure data is an array
      const solutions = Array.isArray(data) ? data : []
      setSolutions(solutions)
    } catch (err: any) {
      console.error('Failed to load trending solutions:', err)
      setError('Failed to load solutions')
      // Fallback data for demo
      setSolutions([
        {
          solution_title: "Fix for slow Confluence performance on large spaces",
          problem_solved: "Confluence extremely slow when accessing spaces over 10GB",
          solution_type: "configuration_fix",
          author: "performance_expert",
          url: "#",
          products_affected: ["confluence"],
          technical_level: "intermediate",
          has_visual_guide: true,
          effectiveness_score: 9,
          popularity_trend: "rising"
        },
        {
          solution_title: "Custom automation for multi-level approval workflows",
          problem_solved: "Complex approval chains in JSM requiring manual intervention",
          solution_type: "automation_solution",
          author: "automation_master",
          url: "#",
          products_affected: ["jsm", "jira"],
          technical_level: "advanced",
          has_visual_guide: true,
          effectiveness_score: 8,
          popularity_trend: "stable"
        },
        {
          solution_title: "Jira + Slack integration for real-time notifications",
          problem_solved: "Team missing critical updates from Jira",
          solution_type: "integration_guide",
          author: "integration_pro",
          url: "#",
          products_affected: ["jira"],
          technical_level: "beginner",
          has_visual_guide: false,
          effectiveness_score: 7,
          popularity_trend: "rising"
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getSolutionTypeIcon = (type: string) => {
    switch (type) {
      case 'configuration_fix': return <Settings className="w-4 h-4 text-blue-600" />
      case 'automation_solution': return <Code className="w-4 h-4 text-purple-600" />
      case 'integration_guide': return <BookOpen className="w-4 h-4 text-green-600" />
      case 'visual_guide': return <Camera className="w-4 h-4 text-orange-600" />
      default: return <CheckCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getEffectivenessBar = (score: number) => {
    const percentage = (score / 10) * 100
    return (
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              score >= 8 ? 'bg-green-500' : 
              score >= 6 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{score}/10</span>
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising') {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    }
    return null
  }

  const filteredSolutions = (solutions || []).filter(solution => {
    if (filter === 'visual') return solution.has_visual_guide
    if (filter === 'advanced') return solution.technical_level === 'advanced' || solution.technical_level === 'expert'
    return true
  })

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Trending Solutions</h3>
        </div>
        <LoadingSpinner size="medium" text="Loading popular solutions..." />
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Trending Solutions</h3>
          <span className="text-sm text-gray-500">({filteredSolutions.length})</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'all' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('visual')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'visual' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Visual Guides
          </button>
          <button
            onClick={() => setFilter('advanced')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'advanced' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {filteredSolutions.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No solutions found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSolutions.map((solution, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-start space-x-2">
                    {getSolutionTypeIcon(solution.solution_type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <a 
                          href={solution.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-green-600 hover:underline"
                        >
                          {solution.solution_title}
                        </a>
                        {getTrendIcon(solution.popularity_trend)}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Solves: <span className="italic">{solution.problem_solved}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <a
                  href={solution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 flex-shrink-0 ml-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-500">by {solution.author}</span>
                  
                  <span className="text-gray-600 capitalize">
                    {solution.technical_level}
                  </span>
                  
                  {solution.has_visual_guide && (
                    <div className="flex items-center space-x-1 text-orange-600">
                      <Camera className="w-4 h-4" />
                      <span>Screenshots</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {solution.products_affected.map((product, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md"
                      >
                        {product.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Effectiveness:</span>
                  {getEffectivenessBar(solution.effectiveness_score)}
                </div>
                
                {solution.popularity_trend === 'rising' && (
                  <span className="text-xs text-green-600 font-medium">
                    🔥 Trending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}