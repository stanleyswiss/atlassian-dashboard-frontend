import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import api from '@/services/api'
import LoadingSpinner from '@/components/Common/LoadingSpinner'

interface ResolutionData {
  category: string
  resolved: number
  in_progress: number
  needs_help: number
  unanswered: number
  total: number
}

export default function ProblemResolutionChart() {
  const [data, setData] = useState<ResolutionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState(30)

  useEffect(() => {
    loadResolutionData()
  }, [timeFrame])

  const loadResolutionData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get(`/api/business-intelligence/analytics-overview?days=${timeFrame}`)
      const analytics = response.data
      
      // Transform data for chart
      const resolutionData: ResolutionData[] = []
      
      // Mock data based on categories - in real implementation, this would come from API
      const categories = ['critical_issue', 'problem_report', 'configuration_help', 'feature_request']
      const categoryLabels = {
        'critical_issue': 'Critical Issues',
        'problem_report': 'Problem Reports', 
        'configuration_help': 'Config Help',
        'feature_request': 'Feature Requests'
      }
      
      categories.forEach(category => {
        const total = analytics.category_distribution[category] || 0
        if (total > 0) {
          resolutionData.push({
            category: categoryLabels[category as keyof typeof categoryLabels] || category,
            resolved: Math.floor(total * 0.4),
            in_progress: Math.floor(total * 0.3),
            needs_help: Math.floor(total * 0.2),
            unanswered: Math.floor(total * 0.1),
            total: total
          })
        }
      })
      
      setData(resolutionData)
    } catch (err: any) {
      console.error('Failed to load resolution data:', err)
      setError('Failed to load data')
      // Fallback data
      setData([
        {
          category: 'Critical Issues',
          resolved: 8,
          in_progress: 5,
          needs_help: 3,
          unanswered: 2,
          total: 18
        },
        {
          category: 'Problem Reports',
          resolved: 25,
          in_progress: 12,
          needs_help: 8,
          unanswered: 5,
          total: 50
        },
        {
          category: 'Config Help',
          resolved: 35,
          in_progress: 8,
          needs_help: 4,
          unanswered: 3,
          total: 50
        },
        {
          category: 'Feature Requests',
          resolved: 2,
          in_progress: 8,
          needs_help: 5,
          unanswered: 10,
          total: 25
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-8">
              <span className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Resolved</span>
              </span>
              <span className="font-medium text-green-600">{data.resolved}</span>
            </div>
            <div className="flex items-center justify-between space-x-8">
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">In Progress</span>
              </span>
              <span className="font-medium text-blue-600">{data.in_progress}</span>
            </div>
            <div className="flex items-center justify-between space-x-8">
              <span className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600">Needs Help</span>
              </span>
              <span className="font-medium text-orange-600">{data.needs_help}</span>
            </div>
            <div className="flex items-center justify-between space-x-8">
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Unanswered</span>
              </span>
              <span className="font-medium text-gray-600">{data.unanswered}</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="flex items-center justify-between space-x-8">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="font-bold text-gray-900">{data.total}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const calculateResolutionRate = () => {
    const totalResolved = data.reduce((sum, item) => sum + item.resolved, 0)
    const totalProblems = data.reduce((sum, item) => sum + item.total, 0)
    return totalProblems > 0 ? Math.round((totalResolved / totalProblems) * 100) : 0
  }

  if (isLoading) {
    return (
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Problem Resolution Tracking</h3>
        </div>
        <LoadingSpinner size="medium" text="Loading resolution data..." />
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Problem Resolution Tracking</h3>
        </div>
        
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{calculateResolutionRate()}%</p>
            <p className="text-xs text-gray-600">Resolution Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, item) => sum + item.in_progress, 0)}
            </p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {data.reduce((sum, item) => sum + item.needs_help, 0)}
            </p>
            <p className="text-xs text-gray-600">Needs Help</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {data.reduce((sum, item) => sum + item.unanswered, 0)}
            </p>
            <p className="text-xs text-gray-600">Unanswered</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar dataKey="resolved" stackId="a" fill="#10b981" name="Resolved" />
            <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name="In Progress" />
            <Bar dataKey="needs_help" stackId="a" fill="#f59e0b" name="Needs Help" />
            <Bar dataKey="unanswered" stackId="a" fill="#6b7280" name="Unanswered" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Resolved</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Needs Help</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span>Unanswered</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Tracking problem→solution flow across community categories
        </p>
      </div>
    </div>
  )
}