import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { SentimentTrend } from '@/types'
import { dashboardService } from '@/services'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'

interface ActivityChartProps {
  data?: SentimentTrend[] | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  days?: number
  chartType?: 'line' | 'area'
}

interface ChartDataPoint {
  date: string
  posts: number
  sentiment: number
  positive: number
  negative: number
  neutral: number
  formattedDate: string
}

export default function ActivityChart({ 
  data, 
  isLoading, 
  error, 
  onRetry, 
  days = 7,
  chartType = 'area'
}: ActivityChartProps) {
  const [localData, setLocalData] = useState<SentimentTrend[] | null>(data || null)
  const [localLoading, setLocalLoading] = useState(isLoading || false)
  const [localError, setLocalError] = useState<string | null>(error || null)
  const [selectedDays, setSelectedDays] = useState(days)
  const [selectedChart, setSelectedChart] = useState<'line' | 'area'>(chartType)

  useEffect(() => {
    if (!data && !isLoading && !error) {
      fetchData(selectedDays)
    }
  }, [data, isLoading, error, selectedDays])

  const fetchData = async (daysPeriod: number) => {
    setLocalLoading(true)
    setLocalError(null)
    try {
      const timeline = await dashboardService.getSentimentTimeline({ days: daysPeriod })
      setLocalData(timeline)
    } catch (err: any) {
      setLocalError(err.message || 'Failed to fetch activity data')
    } finally {
      setLocalLoading(false)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      fetchData(selectedDays)
    }
  }

  const handleDaysChange = (newDays: number) => {
    setSelectedDays(newDays)
    fetchData(newDays)
  }

  // Transform data for chart
  const chartData: ChartDataPoint[] = localData?.map(item => ({
    date: item.date,
    posts: item.positive_count + item.negative_count + item.neutral_count,
    sentiment: item.average_sentiment * 100, // Convert to percentage for better display
    positive: item.positive_count,
    negative: item.negative_count,
    neutral: item.neutral_count,
    formattedDate: formatDate(item.date)
  })) || []

  if (localLoading) {
    return (
      <div className="dashboard-card">
        <div className="h-80 flex items-center justify-center">
          <LoadingSpinner size="large" text="Loading activity chart..." />
        </div>
      </div>
    )
  }

  if (localError) {
    return (
      <div className="dashboard-card">
        <ErrorMessage 
          error={localError} 
          onRetry={handleRetry}
        />
      </div>
    )
  }

  if (!localData || localData.length === 0) {
    return (
      <div className="dashboard-card">
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No activity data available</p>
            <button 
              onClick={handleRetry}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Try loading data
            </button>
          </div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center text-sm">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="ml-1 font-medium text-gray-900">
                {entry.name.includes('Sentiment') 
                  ? `${entry.value.toFixed(1)}%`
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Community Activity</h3>
            <p className="text-sm text-gray-600">Posts and sentiment over time</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Chart Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedChart('area')}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                selectedChart === 'area'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Area Chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedChart('line')}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                selectedChart === 'line'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>

          {/* Days Filter */}
          <select
            value={selectedDays}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {selectedChart === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <YAxis 
                yAxisId="posts"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <YAxis 
                yAxisId="sentiment"
                orientation="right"
                domain={[-100, 100]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Area
                yAxisId="posts"
                type="monotone"
                dataKey="posts"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#postsGradient)"
                name="Posts"
              />
              <Area
                yAxisId="sentiment"
                type="monotone"
                dataKey="sentiment"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#sentimentGradient)"
                name="Sentiment (%)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <YAxis 
                yAxisId="posts"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <YAxis 
                yAxisId="sentiment"
                orientation="right"
                domain={[-100, 100]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                stroke="#D1D5DB"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Line
                yAxisId="posts"
                type="monotone"
                dataKey="posts"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                name="Posts"
              />
              <Line
                yAxisId="sentiment"
                type="monotone"
                dataKey="sentiment"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                name="Sentiment (%)"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Posts</p>
          <p className="text-lg font-semibold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.posts, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Sentiment</p>
          <p className="text-lg font-semibold text-green-600">
            {chartData.length > 0 
              ? (chartData.reduce((sum, item) => sum + item.sentiment, 0) / chartData.length).toFixed(1)
              : 0
            }%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Peak Day</p>
          <p className="text-lg font-semibold text-blue-600">
            {chartData.length > 0 
              ? Math.max(...chartData.map(item => item.posts))
              : 0
            }
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}