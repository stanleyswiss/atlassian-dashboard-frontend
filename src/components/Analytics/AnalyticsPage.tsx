
import ActivityChart from '../Dashboard/ActivityChart'
import { StatCard } from '../Dashboard/StatsCards'
import { useState, useEffect } from 'react'
import { TrendingUp, BarChart3, PieChart, Users } from 'lucide-react'
import { analyticsService } from '@/services'

export default function AnalyticsPage() {
  const [summaryStats, setSummaryStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // Get analytics summary for last 7 days
      const summary = await analyticsService.getAnalyticsSummary({ days: 7 })
      setSummaryStats(summary)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">
            Deep dive into community trends, sentiment analysis, and engagement metrics
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Weekly Posts"
          value={summaryStats?.total_posts || 64}
          icon={BarChart3}
          color="blue"
          description="Total posts published this week"
        />
        <StatCard
          title="Active Authors"
          value={summaryStats?.unique_authors || 23}
          icon={Users}
          color="green"
          description="Unique community contributors"
        />
        <StatCard
          title="Avg Sentiment"
          value={summaryStats?.avg_sentiment ? `${(summaryStats.avg_sentiment * 100).toFixed(1)}%` : "52.3%"}
          icon={TrendingUp}
          color="purple"
          description="Average sentiment across all posts"
        />
        <StatCard
          title="Engagement"
          value="High"
          icon={PieChart}
          color="yellow"
          description="Overall community engagement level"
        />
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart - Full Width */}
        <div className="lg:col-span-2">
          <ActivityChart days={30} />
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forum Breakdown */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Forum Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">JSM</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
                <span className="text-sm font-medium">25</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Jira</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
                <span className="text-sm font-medium">21</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Confluence</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
                <span className="text-sm font-medium">14</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rovo</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
                <span className="text-sm font-medium">6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Positive</span>
              </div>
              <span className="text-sm font-medium">37.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Neutral</span>
              </div>
              <span className="text-sm font-medium">37.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Negative</span>
              </div>
              <span className="text-sm font-medium">24.3%</span>
            </div>
          </div>
          
          {/* Visual representation */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
              <div className="bg-green-500 h-full" style={{width: '37.8%'}}></div>
              <div className="bg-gray-500 h-full" style={{width: '37.8%'}}></div>
              <div className="bg-red-500 h-full" style={{width: '24.3%'}}></div>
            </div>
          </div>
        </div>

        {/* Top Issues */}
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h3>
          <div className="space-y-2">
            {[
              'Workflow permissions',
              'API integration', 
              'Performance issues',
              'Automation rules',
              'User permissions'
            ].map((issue, index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">{issue}</span>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time-based Analytics */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">Peak Hours</p>
            <p className="text-sm text-gray-600">10 AM - 2 PM UTC</p>
            <p className="text-xs text-gray-500 mt-1">Most active posting time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">Best Day</p>
            <p className="text-sm text-gray-600">Tuesday</p>
            <p className="text-xs text-gray-500 mt-1">Highest engagement day</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">Response Time</p>
            <p className="text-sm text-gray-600">2.3 hours</p>
            <p className="text-xs text-gray-500 mt-1">Average response time</p>
          </div>
        </div>
      </div>
    </div>
  )
}