import { useState } from 'react'
import { Search, Bell, Settings, RefreshCw } from 'lucide-react'

interface HeaderProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  onNavigate?: (page: string) => void
}

export default function Header({ onRefresh, isRefreshing = false, onNavigate }: HeaderProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      onRefresh()
    }
  }

  return (
    <header className="bg-white border-b border-dashboard-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AC</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Atlassian Community Dashboard
              </h1>
              <p className="text-sm text-gray-500">Monitor community activity and insights</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search posts, authors, topics..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No new notifications
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => onNavigate?.('settings')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>API Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Last updated:</span>
            <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Community Health: <span className="text-green-600 font-medium">Good</span></span>
          <span>Active Forums: <span className="text-blue-600 font-medium">5</span></span>
        </div>
      </div>

      {/* Click outside handler for notifications */}
      {isNotificationOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsNotificationOpen(false)}
        />
      )}
    </header>
  )
}