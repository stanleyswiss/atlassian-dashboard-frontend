import { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Heart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { DashboardOverview } from '@/types'
import { dashboardService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

interface StatsCardsProps {
  data?: DashboardOverview | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

interface StatCardData {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  description?: string
}

export default function StatsCards({ data, isLoading, error, onRetry }: StatsCardsProps) {
  const [localData, setLocalData] = useState<DashboardOverview | null>(data || null)
  const [localLoading, setLocalLoading] = useState(isLoading || false)
  const [localError, setLocalError] = useState<string | null>(error || null)

  // Fetch data if not provided
  useEffect(() => {
    if (!data && !isLoading && !error) {
      fetchData()
    }
  }, [data, isLoading, error])

  const fetchData = async () => {
    setLocalLoading(true)
    setLocalError(null)
    try {
      const overview = await dashboardService.getOverview()
      setLocalData(overview)
    } catch (err: any) {
      setLocalError(err.message || 'Failed to fetch dashboard data')
    } finally {
      setLocalLoading(false)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      fetchData()
    }
  }

  if (localLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dashboard-card">
            <LoadingSpinner size="medium" />
          </div>
        ))}
      </div>
    )
  }

  if (localError) {
    return (
      <ErrorMessage 
        error={localError} 
        onRetry={handleRetry}
        className="mb-6"
      />
    )
  }

  if (!localData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No dashboard data available</p>
        <button 
          onClick={handleRetry}
          className="mt-2 text-blue-600 hover:text-blue-700"
        >
          Try loading data
        </button>
      </div>
    )
  }

  // Prepare stats data
  const stats: StatCardData[] = [
    {
      title: 'Posts Today',
      value: localData.total_posts_today,
      change: localData.recent_activity_change,
      changeLabel: 'vs yesterday',
      icon: FileText,
      color: 'blue',
      description: 'New posts published today across all forums'
    },
    {
      title: 'Posts This Week',
      value: localData.total_posts_week,
      icon: TrendingUp,
      color: 'green',
      description: 'Total posts published in the last 7 days'
    },
    {
      title: 'Community Health',
      value: `${localData.community_health_score}%`,
      icon: Heart,
      color: getHealthColor(localData.community_health_score),
      description: 'Overall community engagement and activity score'
    },
    {
      title: 'Active Forums',
      value: localData.most_active_forum ? '5' : '4',
      icon: Users,
      color: 'purple',
      description: 'Forums with recent activity and discussions'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

// Individual stat card component
function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  description
}: StatCardData) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    }
  }

  const colors = colorClasses[color]

  const renderChangeIndicator = () => {
    if (typeof change !== 'number') return null

    let ChangeIcon: React.ComponentType<{ className?: string }>
    let changeColor: string

    if (change > 0) {
      ChangeIcon = ArrowUp
      changeColor = 'text-green-600'
    } else if (change < 0) {
      ChangeIcon = ArrowDown
      changeColor = 'text-red-600'
    } else {
      ChangeIcon = Minus
      changeColor = 'text-gray-500'
    }

    return (
      <div className={`flex items-center text-xs ${changeColor} mt-1`}>
        <ChangeIcon className="h-3 w-3 mr-1" />
        <span>
          {Math.abs(change).toFixed(1)}% {changeLabel}
        </span>
      </div>
    )
  }

  return (
    <div className={`dashboard-card hover:border-opacity-60 ${colors.border} transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {renderChangeIndicator()}
        </div>
        
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

// Helper function to determine health color
function getHealthColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 75) return 'green'
  if (score >= 50) return 'yellow'
  return 'red'
}

// Export individual StatCard for reuse
export { StatCard }