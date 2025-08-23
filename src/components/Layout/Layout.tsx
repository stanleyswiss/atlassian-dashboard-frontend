
import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import LoadingSpinner from '../Common/LoadingSpinner'
import ErrorBoundary from '../Common/ErrorBoundary'
import { dashboardService } from '@/services'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await dashboardService.refreshData({
        max_posts_per_category: 20,
        analyze_with_ai: true
      })
      setLastRefreshTime(new Date())
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing) {
        handleRefresh()
      }
    }, 15 * 60 * 1000) // 15 minutes

    return () => clearInterval(interval)
  }, [isRefreshing])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing}
        onNavigate={onNavigate}
      />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={onNavigate} 
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Breadcrumb / Page Header */}
            <div className="bg-white border-b border-dashboard-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {currentPage === 'dashboard' ? 'Dashboard Overview' : currentPage}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {getPageDescription(currentPage)}
                  </p>
                </div>
                
                {/* Page Actions */}
                <div className="flex items-center space-x-3">
                  {lastRefreshTime && (
                    <span className="text-xs text-gray-500">
                      Last updated: {lastRefreshTime.toLocaleTimeString()}
                    </span>
                  )}
                  
                  {isRefreshing && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <LoadingSpinner size="small" />
                      <span>Refreshing data...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-auto">
              <ErrorBoundary>
                <div className="p-6">
                  {children}
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Helper function to get page descriptions
function getPageDescription(page: string): string {
  const descriptions: Record<string, string> = {
    dashboard: 'Real-time overview of Atlassian Community activity and health metrics',
    posts: 'Browse and manage community posts with sentiment analysis',
    analytics: 'Detailed insights and trends analysis of community data',
    trending: 'Hot topics and trending discussions across forums',
    forums: 'Activity breakdown by Atlassian product forums',
    authors: 'Most active community contributors and their engagement',
    schedule: 'Data collection schedule and automation settings',
    settings: 'Configure dashboard preferences and data collection'
  }
  
  return descriptions[page] || 'Manage your Atlassian Community Dashboard'
}