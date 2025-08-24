import { useState, useEffect } from 'react'
import { 
  Calendar,
  TrendingUp,
  Zap, 
  Globe,
  Server,
  Lightbulb,
  Clock,
  Star,
  RefreshCw
} from 'lucide-react'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import api from '@/services/api'

interface RoadmapFeature {
  title: string
  description: string
  status: string
  quarter: string
  products: string[]
}

interface AIAnalysis {
  recent_releases_summary: string
  upcoming_features_summary: string
  strategic_themes: string[]
  ai_insights: string
  analysis_timestamp: string
}

interface RoadmapData {
  success: boolean
  platform: string
  last_updated: string
  features: RoadmapFeature[]
  ai_analysis: AIAnalysis
  url: string
  note?: string
}

export default function RoadmapPage() {
  const [cloudRoadmap, setCloudRoadmap] = useState<RoadmapData | null>(null)
  const [dcRoadmap, setDcRoadmap] = useState<RoadmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'cloud' | 'dc' | 'both'>('both')

  useEffect(() => {
    loadRoadmaps()
  }, [])

  const loadRoadmaps = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [cloudResponse, dcResponse] = await Promise.all([
        api.get('/api/roadmap/cloud'),
        api.get('/api/roadmap/data-center')
      ])
      
      console.log('Cloud roadmap response:', cloudResponse)
      console.log('DC roadmap response:', dcResponse)
      
      setCloudRoadmap(cloudResponse.data)
      setDcRoadmap(dcResponse.data)
      
    } catch (err: any) {
      console.error('Failed to load roadmaps:', err)
      setError('Failed to load roadmap data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'released':
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_development':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'upcoming':
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'planning':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'released':
      case 'available':
        return <Star className="w-4 h-4" />
      case 'in_development':
      case 'in_progress':
        return <Zap className="w-4 h-4" />
      case 'upcoming':
      case 'planned':
        return <Clock className="w-4 h-4" />
      default:
        return <Lightbulb className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading roadmap data..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Roadmap</h1>
          <p className="text-gray-600 mt-1">
            Latest features and strategic direction for Atlassian platforms
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value as 'cloud' | 'dc' | 'both')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="both">Both Platforms</option>
            <option value="cloud">Cloud Only</option>
            <option value="dc">Data Center Only</option>
          </select>
          
          <button
            onClick={loadRoadmaps}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage error={error} onRetry={loadRoadmaps} />
      )}

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cloud Roadmap */}
        {(selectedPlatform === 'both' || selectedPlatform === 'cloud') && cloudRoadmap && (
          <div className="dashboard-card">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Atlassian Cloud</h2>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(cloudRoadmap.last_updated).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            {cloudRoadmap.ai_analysis && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>AI Strategic Analysis</span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-blue-800">Recent Releases:</h4>
                    <p className="text-blue-700">{cloudRoadmap.ai_analysis.recent_releases_summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-800">Upcoming Features:</h4>
                    <p className="text-blue-700">{cloudRoadmap.ai_analysis.upcoming_features_summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-800">Strategic Themes:</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cloudRoadmap.ai_analysis.strategic_themes.map((theme, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Key Features</h3>
              {cloudRoadmap.features.map((feature, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">{feature.title}</h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(feature.status)}`}>
                      {getStatusIcon(feature.status)}
                      <span className="capitalize">{feature.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {feature.description && (
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{feature.quarter}</span>
                    </div>
                    <div className="flex space-x-1">
                      {feature.products.map((product, idx) => (
                        <span key={idx} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          {product.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cloudRoadmap.note && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{cloudRoadmap.note}</p>
              </div>
            )}
          </div>
        )}

        {/* Data Center Roadmap */}
        {(selectedPlatform === 'both' || selectedPlatform === 'dc') && dcRoadmap && (
          <div className="dashboard-card">
            <div className="flex items-center space-x-3 mb-6">
              <Server className="w-6 h-6 text-orange-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Atlassian Data Center</h2>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(dcRoadmap.last_updated).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* AI Analysis */}
            {dcRoadmap.ai_analysis && (
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>AI Strategic Analysis</span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-orange-800">Recent Releases:</h4>
                    <p className="text-orange-700">{dcRoadmap.ai_analysis.recent_releases_summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-800">Upcoming Features:</h4>
                    <p className="text-orange-700">{dcRoadmap.ai_analysis.upcoming_features_summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-800">Strategic Themes:</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dcRoadmap.ai_analysis.strategic_themes.map((theme, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Key Features</h3>
              {dcRoadmap.features.map((feature, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">{feature.title}</h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(feature.status)}`}>
                      {getStatusIcon(feature.status)}
                      <span className="capitalize">{feature.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  {feature.description && (
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{feature.quarter}</span>
                    </div>
                    <div className="flex space-x-1">
                      {feature.products.map((product, idx) => (
                        <span key={idx} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          {product.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {dcRoadmap.note && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{dcRoadmap.note}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}