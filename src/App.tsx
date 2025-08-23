import { useState } from 'react'
import Layout from '@/components/Layout/Layout'
import DashboardPage from '@/components/Dashboard/DashboardPage'
import PostsPage from '@/components/Posts/PostsPage'
import AnalyticsPage from '@/components/Analytics/AnalyticsPage'
import TrendingTopicsPage from '@/components/TrendingTopics/TrendingTopicsPage'
import ForumsPage from '@/components/Forums/ForumsPage'
import TopAuthorsPage from '@/components/Authors/TopAuthorsPage'
import SchedulePage from '@/components/Schedule/SchedulePage'
import SettingsPage from '@/components/Settings/SettingsPage'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'posts':
        return <PostsPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'trending':
        return <TrendingTopicsPage />
      case 'forums':
        return <ForumsPage />
      case 'authors':
        return <TopAuthorsPage />
      case 'schedule':
        return <SchedulePage />
      case 'settings':
        return <SettingsPage />
      default:
        return <NotFound />
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderCurrentPage()}
    </Layout>
  )
}

// Simple 404 component
function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-700 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <a 
          href="/" 
          className="inline-flex items-center px-4 py-2 bg-atlassian-500 text-white rounded-lg hover:bg-atlassian-600 transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}

export default App