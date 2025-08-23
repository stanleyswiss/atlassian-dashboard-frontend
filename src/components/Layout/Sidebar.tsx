import { useState } from 'react'
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  Calendar,
  Users,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    id: 'posts',
    label: 'Posts',
    icon: FileText,
    badge: 'New'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'trending',
    label: 'Trending Topics',
    icon: TrendingUp,
    badge: 5
  },
  {
    id: 'forums',
    label: 'Forums',
    icon: MessageSquare,
  },
  {
    id: 'authors',
    label: 'Top Authors',
    icon: Users,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
  }
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={`bg-white border-r border-dashboard-border transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Collapse Toggle */}
      <div className="flex justify-end p-2 border-b border-gray-100">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-700' : 'text-gray-500'
                }`} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    
                    {item.badge && (
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                        typeof item.badge === 'number'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-gray-500">Posts Today</div>
                <div className="text-lg font-semibold text-gray-900">124</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">Active Topics</div>
                <div className="text-lg font-semibold text-gray-900">18</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">Health Score</div>
                <div className="text-lg font-semibold text-green-600">Good</div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className={`${isCollapsed ? 'mt-4' : 'mt-8'}`}>
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
              currentPage === 'settings'
                ? 'bg-gray-50 text-gray-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </button>
        </div>
      </nav>
    </aside>
  )
}