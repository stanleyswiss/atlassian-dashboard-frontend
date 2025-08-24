import { useState, useEffect } from 'react'
import { Lightbulb, ExternalLink, Camera, Award, Zap, Sparkles } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface AwesomeDiscovery {
  title: string
  summary: string
  author: string
  url: string
  products_used: string[]
  technical_level: string
  has_screenshots: boolean
  engagement_potential: string
  discovery_type: string
}

export default function AwesomeDiscoveries() {
  const [discoveries, setDiscoveries] = useState<AwesomeDiscovery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAwesomeDiscoveries()
  }, [])

  const loadAwesomeDiscoveries = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/business-intelligence/awesome-discoveries')
      console.log('Awesome Discoveries API Response:', response) // Debug log
      
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : []
      setDiscoveries(data)
    } catch (err: any) {
      console.error('Failed to load awesome discoveries:', err)
      setError('Failed to load discoveries')
      // Fallback data for demo
      setDiscoveries([
        {
          title: "How Netflix uses Jira for content pipeline management",
          summary: "Detailed case study showing how Netflix manages their entire content production pipeline using Jira with custom workflows and integrations",
          author: "netflix_engineer",
          url: "#",
          products_used: ["jira", "confluence"],
          technical_level: "expert",
          has_screenshots: true,
          engagement_potential: "high",
          discovery_type: "use_case"
        },
        {
          title: "Automated incident response with JSM + PagerDuty + Slack",
          summary: "Complete guide to setting up automated incident management that reduced response time by 80%",
          author: "devops_guru",
          url: "#",
          products_used: ["jsm"],
          technical_level: "advanced",
          has_screenshots: true,
          engagement_potential: "high",
          discovery_type: "integration"
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const getTechnicalLevelIcon = (level: string) => {
    switch (level) {
      case 'expert': return <Zap className="w-4 h-4 text-purple-600" />
      case 'advanced': return <Award className="w-4 h-4 text-blue-600" />
      case 'intermediate': return <Sparkles className="w-4 h-4 text-green-600" />
      default: return <Lightbulb className="w-4 h-4 text-gray-600" />
    }
  }

  const getEngagementColor = (potential: string) => {
    return potential === 'high' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
  }

  const getDiscoveryTypeLabel = (type: string) => {
    switch (type) {
      case 'use_case': return '💡 Use Case'
      case 'integration': return '🔗 Integration'
      case 'automation': return '🤖 Automation'
      case 'success_story': return '🎉 Success Story'
      default: return '✨ Discovery'
    }
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Awesome Discoveries</h3>
        </div>
        <LoadingSpinner size="medium" text="Finding amazing use cases..." />
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Awesome Discoveries</h3>
          <span className="text-sm text-gray-500">({discoveries?.length || 0})</span>
        </div>
        
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {!discoveries || discoveries.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <Lightbulb className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600">No discoveries found</p>
          <p className="text-sm text-gray-500 mt-1">Check back later for amazing use cases!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discoveries?.map((discovery, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-4">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{getDiscoveryTypeLabel(discovery.discovery_type).split(' ')[0]}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 hover:text-blue-600">
                        <a href={discovery.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {discovery.title}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{discovery.summary}</p>
                    </div>
                  </div>
                </div>
                
                <a
                  href={discovery.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-500">by {discovery.author}</span>
                  
                  <div className="flex items-center space-x-1">
                    {getTechnicalLevelIcon(discovery.technical_level)}
                    <span className="text-gray-600 capitalize">{discovery.technical_level}</span>
                  </div>
                  
                  {discovery.has_screenshots && (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Camera className="w-4 h-4" />
                      <span>Visual Guide</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {discovery.products_used.map((product, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
                    >
                      {product.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {discovery.engagement_potential === 'high' && (
                <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(discovery.engagement_potential)}`}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  High engagement potential
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}