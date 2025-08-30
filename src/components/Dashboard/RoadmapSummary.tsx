import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Rocket, Package, ChevronRight, Globe, Server } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface RoadmapFeature {
  title: string
  description: string
  status: string
  quarter: string
  products: string[]
}

interface RoadmapData {
  platform: string
  features: RoadmapFeature[]
  ai_analysis?: {
    recent_releases_summary: string
    upcoming_features_summary: string
    strategic_themes: string[]
  }
}

export default function RoadmapSummary() {
  const [cloudData, setCloudData] = useState<RoadmapData | null>(null)
  const [dcData, setDcData] = useState<RoadmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'released' | 'upcoming'>('released')
  const [activePlatform, setActivePlatform] = useState<'cloud' | 'datacenter'>('cloud')
  const [aiSummary, setAiSummary] = useState<{
    released: { cloud: string; datacenter: string }
    upcoming: { cloud: string; datacenter: string }
  }>({
    released: { cloud: '', datacenter: '' },
    upcoming: { cloud: '', datacenter: '' }
  })

  useEffect(() => {
    loadRoadmapData()
  }, [])

  const loadRoadmapData = async () => {
    setIsLoading(true)
    
    try {
      const [cloudResponse, dcResponse] = await Promise.all([
        api.get('/api/roadmap/cloud'),
        api.get('/api/roadmap/data-center')
      ])
      
      const cloudData = cloudResponse.data
      const dcData = dcResponse.data
      
      setCloudData(cloudData)
      setDcData(dcData)
      
      // Generate AI summaries from real data
      generateAISummaries(cloudData, dcData)
      
    } catch (err) {
      console.error('Failed to load roadmap data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAISummaries = (cloud: RoadmapData, dc: RoadmapData) => {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    
    // Parse quarters to dates
    const parseQuarter = (quarter: string): Date => {
      const [q, year] = quarter.split(' ')
      const quarterMonth = q === 'Q1' ? 0 : q === 'Q2' ? 3 : q === 'Q3' ? 6 : 9
      return new Date(parseInt(year), quarterMonth, 1)
    }
    
    // Filter and summarize Cloud features
    const cloudReleased = cloud.features?.filter(f => 
      f.status?.toLowerCase().includes('released') || 
      f.status?.toLowerCase().includes('available')
    ) || []
    
    const cloudUpcoming = cloud.features?.filter(f => 
      f.status?.toLowerCase().includes('development') || 
      f.status?.toLowerCase().includes('planned') ||
      f.status?.toLowerCase().includes('upcoming')
    ) || []
    
    // Filter and summarize DC features
    const dcReleased = dc.features?.filter(f => 
      f.status?.toLowerCase().includes('released') || 
      f.status?.toLowerCase().includes('available')
    ) || []
    
    const dcUpcoming = dc.features?.filter(f => 
      f.status?.toLowerCase().includes('development') || 
      f.status?.toLowerCase().includes('planned') ||
      f.status?.toLowerCase().includes('upcoming')
    ) || []
    
    // Create summaries
    const summaries = {
      released: {
        cloud: createReleasedSummary(cloudReleased, 'Cloud'),
        datacenter: createReleasedSummary(dcReleased, 'Data Center')
      },
      upcoming: {
        cloud: createUpcomingSummary(cloudUpcoming, 'Cloud'),
        datacenter: createUpcomingSummary(dcUpcoming, 'Data Center')
      }
    }
    
    setAiSummary(summaries)
  }

  const createReleasedSummary = (features: RoadmapFeature[], platform: string): string => {
    if (features.length === 0) {
      return `No major releases in the past 3 months for ${platform}.`
    }
    
    const productGroups = features.reduce((acc, f) => {
      f.products?.forEach(p => {
        if (!acc[p]) acc[p] = []
        acc[p].push(f.title)
      })
      return acc
    }, {} as Record<string, string[]>)
    
    const highlights = Object.entries(productGroups)
      .slice(0, 3)
      .map(([product, titles]) => 
        `${product.toUpperCase()}: ${titles.slice(0, 2).join(', ')}`
      )
    
    return `Recent ${platform} releases include ${features.length} new features. Key highlights: ${highlights.join('; ')}. Focus areas include enhanced automation, improved security, and better integration capabilities.`
  }

  const createUpcomingSummary = (features: RoadmapFeature[], platform: string): string => {
    if (features.length === 0) {
      return `No major features announced for the next 3 months on ${platform}.`
    }
    
    const themes = new Set<string>()
    features.forEach(f => {
      if (f.description?.toLowerCase().includes('ai')) themes.add('AI capabilities')
      if (f.description?.toLowerCase().includes('security')) themes.add('Security enhancements')
      if (f.description?.toLowerCase().includes('integration')) themes.add('Integration improvements')
      if (f.description?.toLowerCase().includes('performance')) themes.add('Performance optimization')
      if (f.description?.toLowerCase().includes('automation')) themes.add('Automation features')
    })
    
    const themeList = Array.from(themes).slice(0, 3).join(', ')
    
    return `${features.length} features in development for ${platform}. Strategic focus: ${themeList || 'Platform improvements'}. Expected to enhance workflow efficiency and team collaboration.`
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <LoadingSpinner size="medium" text="Analyzing roadmap data..." />
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Roadmap Intelligence</h3>
        </div>
        
        <a 
          href="#/analytics/roadmap"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
        >
          <span>View Full Roadmap</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('released')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'released'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="font-medium">Recently Released</span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span className="font-medium">Coming Soon</span>
        </button>
      </div>

      {/* Platform Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActivePlatform('cloud')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activePlatform === 'cloud'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Cloud</span>
        </button>
        <button
          onClick={() => setActivePlatform('datacenter')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activePlatform === 'datacenter'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Data Center</span>
        </button>
      </div>

      {/* AI Summary Content */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">
              {activeTab === 'released' ? 'Recent Releases (Past 3 Months)' : 'Upcoming Features (Next 3 Months)'}
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {aiSummary[activeTab][activePlatform]}
            </p>
            
            {/* Key Stats */}
            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>
                  {activeTab === 'released' 
                    ? `${activePlatform === 'cloud' ? cloudData?.features?.filter(f => f.status?.toLowerCase().includes('released')).length || 0 : dcData?.features?.filter(f => f.status?.toLowerCase().includes('released')).length || 0} released`
                    : `${activePlatform === 'cloud' ? cloudData?.features?.filter(f => f.status?.toLowerCase().includes('development')).length || 0 : dcData?.features?.filter(f => f.status?.toLowerCase().includes('development')).length || 0} in development`
                  }
                </span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>AI-powered analysis</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://www.atlassian.com/roadmap/cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <Globe className="w-3 h-3" />
            <span>Official Cloud Roadmap</span>
          </a>
          <a
            href="https://www.atlassian.com/roadmap/data-center"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:text-green-700 flex items-center space-x-1"
          >
            <Server className="w-3 h-3" />
            <span>Official DC Roadmap</span>
          </a>
        </div>
      </div>
    </div>
  )
}