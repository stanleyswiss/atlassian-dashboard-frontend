import { useState, useEffect } from 'react'
import { 
  Settings, 
  Database,
  Clock,
  Shield,
  Save,
  TestTube,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  BarChart3,
  Activity,
  Zap,
  Trash2,
  TrendingUp
} from 'lucide-react'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import api from '@/services/api'

interface SettingsConfig {
  scraping_enabled: boolean
  scraping_interval: number // hours
  vision_analysis_enabled: boolean
  max_posts_per_scrape: number
  auto_cleanup_enabled: boolean
  data_retention_days: number
  max_pages_per_forum: number
}

interface TestResult {
  success: boolean
  message: string
  details?: any
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SettingsConfig>({
    scraping_enabled: false,
    scraping_interval: 6,
    vision_analysis_enabled: false,
    max_posts_per_scrape: 50,
    auto_cleanup_enabled: true,
    data_retention_days: 30,
    max_pages_per_forum: 3
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showApiStatus, setShowApiStatus] = useState(false)

  const [testResults, setTestResults] = useState<{
    database: TestResult | null
    scraping: TestResult | null
    vision_ai: TestResult | null
  }>({
    database: null,
    scraping: null,
    vision_ai: null
  })

  const [scrapingStatus, setScrapingStatus] = useState<any>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  useEffect(() => {
    loadSettings()
    loadScrapingStatus()
  }, [])

  const loadScrapingStatus = async () => {
    setIsLoadingStatus(true)
    try {
      const status = await api.get('/api/scraping/status')
      setScrapingStatus(status)
    } catch (err: any) {
      console.error('Failed to load scraping status:', err)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  const loadSettings = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const settingsData = await api.get('/api/settings/config')
      console.log('Settings loaded from API:', settingsData) // Debug log
      
      if (settingsData) {
        setConfig(settingsData)
        console.log('Settings applied to form:', settingsData) // Debug log
      }
    } catch (err: any) {
      setError('Failed to load settings')
      console.error('Settings load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      await api.post('/api/settings/config', config)
      setSuccessMessage('Settings saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError('Failed to save settings')
      console.error('Settings save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const testDatabase = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.get('/api/settings/status')
      
      console.log('Database test result:', result) // Debug log
      
      // Handle different possible response structures
      const data = result.data || result
      const database = data.database || {}
      
      if (database.status === 'connected') {
        setTestResults(prev => ({
          ...prev,
          database: { success: true, message: 'Database connection successful', details: database }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          database: { success: false, message: database.message || 'Database connection failed' }
        }))
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        database: { success: false, message: 'Database test failed: ' + err.message }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const testScraping = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.get('/api/scraping/test-single-forum/jira')
      
      if (result.data && result.data.posts_scraped > 0) {
        setTestResults(prev => ({
          ...prev,
          scraping: { 
            success: true, 
            message: `Successfully scraped ${result.data.posts_scraped} posts from Jira forum`,
            details: result.data 
          }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          scraping: { success: false, message: 'No posts were scraped' }
        }))
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        scraping: { success: false, message: 'Scraping test failed: ' + err.message }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const testVisionAI = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.get('/api/business-intelligence/stats')
      
      if (result.data) {
        const hasVision = result.data.vision_analysis_coverage?.vision_coverage_percentage > 0
        setTestResults(prev => ({
          ...prev,
          vision_ai: { 
            success: true, 
            message: hasVision 
              ? `Vision AI working - ${result.data.vision_analysis_coverage.vision_coverage_percentage}% coverage`
              : 'Vision AI service available but no analyzed posts yet',
            details: result.data 
          }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          vision_ai: { success: false, message: 'Vision AI status unavailable' }
        }))
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        vision_ai: { success: false, message: 'Vision AI test failed: ' + err.message }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const migrateDatabase = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.post('/api/admin/migrate-database?force_recreate=true')
      
      console.log('Migration API response:', result) // Debug log
      
      // Handle different possible response structures
      const data = result.data || result
      
      if (data && (data.success === true || data.message)) {
        const addedColumns = data.added_columns || []
        const message = data.message || 'Database migration completed'
        setSuccessMessage(`${message}${addedColumns.length > 0 ? ` Added: ${addedColumns.join(', ')}` : ''}`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError('Database migration failed - unexpected response format')
      }
    } catch (err: any) {
      console.error('Full migration error object:', err) // Debug log
      
      // Handle different error structures
      let errorMessage = 'Database migration failed'
      
      if (err.response?.data?.detail) {
        errorMessage += ': ' + err.response.data.detail
      } else if (err.message) {
        errorMessage += ': ' + err.message
      } else if (typeof err === 'string') {
        errorMessage += ': ' + err
      }
      
      setError(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const createSettingsTable = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.post('/api/admin/create-settings-table')
      
      console.log('Settings table creation result:', result)
      
      if (result && result.success) {
        const message = result.message || 'Settings table created successfully'
        setSuccessMessage(`${message} - Settings should now persist properly!`)
        setTimeout(() => setSuccessMessage(null), 8000)
      } else {
        setError(`Settings table creation failed: ${result?.message || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error('Settings table creation error:', err)
      
      let errorMessage = 'Settings table creation failed'
      if (err.detail) {
        errorMessage += ': ' + err.detail
      } else if (err.message) {
        errorMessage += ': ' + err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const debugSettings = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.get('/api/admin/debug-settings')
      
      console.log('Settings debug result:', result)
      
      if (result && result.success) {
        console.log('Debug info:', result.debug_info)
        const dbCount = result.debug_info?.settings_count_in_db || 0
        const testWrite = result.debug_info?.test_write_success
        const testRead = result.debug_info?.test_read_result
        
        setSuccessMessage(`Debug complete: ${dbCount} settings in DB, Write: ${testWrite ? 'OK' : 'FAILED'}, Read: ${testRead !== 'not_found' ? 'OK' : 'FAILED'}`)
        setTimeout(() => setSuccessMessage(null), 10000)
      } else {
        setError(`Settings debug failed: ${result?.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error('Settings debug error:', err)
      
      let errorMessage = 'Settings debug failed'
      if (err.detail) {
        errorMessage += ': ' + err.detail
      } else if (err.message) {
        errorMessage += ': ' + err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const checkAIStatus = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.get('/api/admin/analyze-posts-status')
      
      console.log('AI Analysis Status:', result)
      
      if (result && result.success) {
        const analysis = result.analysis_status
        const diagnosis = result.diagnosis
        
        console.log('Analysis breakdown:', analysis)
        console.log('Sample posts:', result.sample_recent_posts)
        
        const coverage = analysis?.analysis_coverage_percent || 0
        const totalPosts = analysis?.total_posts || 0
        const visionPosts = analysis?.posts_with_vision_analysis || 0
        
        setSuccessMessage(`AI Analysis: ${coverage}% coverage. ${visionPosts}/${totalPosts} posts have Vision AI. Status: ${diagnosis?.vision_ai_working ? 'WORKING' : 'NOT WORKING'}`)
        setTimeout(() => setSuccessMessage(null), 12000)
      } else {
        setError(`AI analysis check failed: ${result?.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error('AI analysis check error:', err)
      
      let errorMessage = 'AI analysis check failed'
      if (err.detail) {
        errorMessage += ': ' + err.detail
      } else if (err.message) {
        errorMessage += ': ' + err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const triggerScraping = async () => {
    setIsTesting(true)
    
    try {
      // Use a longer timeout for scraping operation (2 minutes)
      const result = await api.post('/api/scraping/trigger-all', {}, { 
        timeout: 120000 // 2 minutes
      })
      
      console.log('Scraping trigger result:', result) // Debug log
      
      if (result && result.success) {
        const message = result.message || 'Scraping triggered successfully'
        const postsScraped = result.posts_scraped || 'In progress...'
        setSuccessMessage(`${message} - Posts: ${postsScraped}`)
        setTimeout(() => setSuccessMessage(null), 8000)
        
        // Refresh status after a short delay
        setTimeout(() => loadScrapingStatus(), 2000)
      } else {
        setError('Scraping failed or returned no data')
      }
    } catch (err: any) {
      console.error('Scraping trigger error:', err)
      
      let errorMessage = 'Scraping trigger failed'
      if (err.detail) {
        errorMessage += ': ' + err.detail
      } else if (err.message) {
        errorMessage += ': ' + err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const triggerFreshStart = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.post('/api/scraping/fresh-start', {}, {
        timeout: 120000 // 2 minutes
      })
      
      console.log('Fresh start result:', result)
      
      if (result && result.success) {
        const message = result.message || 'Fresh start initiated'
        const expectedPosts = result.expected_posts || '~150 posts'
        setSuccessMessage(`${message} - Expected: ${expectedPosts}. Check back in 5 minutes!`)
        setTimeout(() => setSuccessMessage(null), 10000)
        
        // Refresh status after delay
        setTimeout(() => loadScrapingStatus(), 3000)
      } else {
        setError('Fresh start failed or returned no data')
      }
    } catch (err: any) {
      console.error('Fresh start error:', err)
      
      let errorMessage = 'Fresh start failed'
      if (err.detail) {
        errorMessage += ': ' + err.detail
      } else if (err.message) {
        errorMessage += ': ' + err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  const getTestIcon = (result: TestResult | null) => {
    if (!result) return <TestTube className="w-4 h-4 text-gray-400" />
    if (result.success) return <CheckCircle2 className="w-4 h-4 text-green-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const getTestColor = (result: TestResult | null) => {
    if (!result) return 'text-gray-600'
    if (result.success) return 'text-green-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card">
          <LoadingSpinner size="large" text="Loading settings..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure scraping, analysis, and business intelligence features
          </p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <ErrorMessage error={error} onRetry={() => setError(null)} />
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* API Status Warning */}
      <div className="dashboard-card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Security Notice</h3>
            <p className="text-sm text-blue-700 mt-1">
              OpenAI API key is configured securely on the server. Vision AI and enhanced analysis 
              will work automatically when a valid key is set in the backend environment.
            </p>
            <button 
              onClick={() => setShowApiStatus(!showApiStatus)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>{showApiStatus ? 'Hide' : 'Show'} API Status</span>
            </button>
            
            {showApiStatus && (
              <div className="mt-3 p-3 bg-white border border-blue-200 rounded-md">
                <p className="text-xs text-gray-600">
                  Set OPENAI_API_KEY in your backend environment variables for full functionality.
                  Never expose API keys in frontend code.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scraping Status Dashboard */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Scraping Status</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadScrapingStatus}
              disabled={isLoadingStatus}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={triggerScraping}
              disabled={isTesting}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              <span>Scrape More</span>
            </button>
            <button
              onClick={triggerFreshStart}
              disabled={isTesting}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Fresh Start</span>
            </button>
          </div>
        </div>

        {isLoadingStatus ? (
          <LoadingSpinner size="medium" text="Loading scraping status..." />
        ) : scrapingStatus ? (
          <div className="space-y-4">
            {/* Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className={`text-lg font-semibold ${
                      scrapingStatus.scraping_health?.status === 'active' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {scrapingStatus.scraping_health?.status?.toUpperCase() || 'UNKNOWN'}
                    </p>
                  </div>
                  <Activity className={`w-8 h-8 ${
                    scrapingStatus.scraping_health?.status === 'active' ? 'text-green-500' : 'text-gray-400'
                  }`} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {scrapingStatus.database?.total_posts?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last 24h</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {scrapingStatus.database?.posts_last_24h || '0'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Score</p>
                    <p className={`text-lg font-semibold ${
                      (scrapingStatus.scraping_health?.health_score || 0) > 70 ? 'text-green-600' :
                      (scrapingStatus.scraping_health?.health_score || 0) > 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {scrapingStatus.scraping_health?.health_score || 0}%
                    </p>
                  </div>
                  <CheckCircle2 className={`w-8 h-8 ${
                    (scrapingStatus.scraping_health?.health_score || 0) > 70 ? 'text-green-500' :
                    (scrapingStatus.scraping_health?.health_score || 0) > 40 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
              </div>
            </div>

            {/* Last Activity & Forum Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Last Activity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Post:</span>
                    <span className="font-medium text-gray-900">
                      {scrapingStatus.scraping_health?.last_activity_ago || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Posts Last Hour:</span>
                    <span className="font-medium text-gray-900">
                      {scrapingStatus.database?.posts_last_hour || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Most Active Forum:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {scrapingStatus.forums?.most_active_forum || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Forum Breakdown (24h)</h4>
                <div className="space-y-2">
                  {Object.entries(scrapingStatus.database?.forum_breakdown_24h || {}).map(([forum, count]) => (
                    <div key={forum} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{forum}:</span>
                      <span className="font-medium text-gray-900">{count as number}</span>
                    </div>
                  ))}
                  {Object.keys(scrapingStatus.database?.forum_breakdown_24h || {}).length === 0 && (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {scrapingStatus.recommendations && scrapingStatus.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {scrapingStatus.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-blue-800">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Click refresh to load scraping status</p>
          </div>
        )}
      </div>

      {/* System Tests */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TestTube className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Tests</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Database Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <button
                onClick={testDatabase}
                disabled={isTesting}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Test
              </button>
            </div>
            
            {testResults.database && (
              <div className={`text-sm ${getTestColor(testResults.database)}`}>
                <div className="flex items-center space-x-2">
                  {getTestIcon(testResults.database)}
                  <span>{testResults.database.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Scraping Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Scraping</span>
              </div>
              <button
                onClick={testScraping}
                disabled={isTesting}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Test
              </button>
            </div>
            
            {testResults.scraping && (
              <div className={`text-sm ${getTestColor(testResults.scraping)}`}>
                <div className="flex items-center space-x-2">
                  {getTestIcon(testResults.scraping)}
                  <span>{testResults.scraping.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vision AI Test */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Vision AI</span>
              </div>
              <button
                onClick={testVisionAI}
                disabled={isTesting}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Test
              </button>
            </div>
            
            {testResults.vision_ai && (
              <div className={`text-sm ${getTestColor(testResults.vision_ai)}`}>
                <div className="flex items-center space-x-2">
                  {getTestIcon(testResults.vision_ai)}
                  <span>{testResults.vision_ai.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Management */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Database Management</h3>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Settings Persistence Fix</h4>
              <p className="text-sm text-yellow-700 mt-1">
                If your settings aren't being saved properly, click "Migrate Database" to create the settings table.
                This is a one-time setup that ensures your configuration persists through server restarts.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={createSettingsTable}
              disabled={isTesting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>Fix Settings Persistence</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Creates settings table specifically (recommended first)
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={migrateDatabase}
              disabled={isTesting}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span>Full Database Migration</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Migrates all database structures (more comprehensive)
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={debugSettings}
              disabled={isTesting}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>Debug Settings</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Test settings read/write functionality (check console)
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={checkAIStatus}
              disabled={isTesting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span>Check AI Analysis Status</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Verify if Vision AI is actually analyzing your posts
            </div>
          </div>
        </div>
      </div>

      {/* Scraping Configuration */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <RefreshCw className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Scraping Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                checked={config.scraping_enabled}
                onChange={(e) => setConfig({...config, scraping_enabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Automatic Scraping</span>
            </label>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scraping Interval (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={config.scraping_interval}
                  onChange={(e) => setConfig({...config, scraping_interval: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">How often to scrape new posts</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Posts Per Scrape
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={config.max_posts_per_scrape}
                  onChange={(e) => setConfig({...config, max_posts_per_scrape: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum posts to scrape per forum</p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Pages Per Forum
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.max_pages_per_forum}
                  onChange={(e) => setConfig({...config, max_pages_per_forum: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">How many pages to scrape per forum</p>
              </div>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.vision_analysis_enabled}
                  onChange={(e) => setConfig({...config, vision_analysis_enabled: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Vision AI Analysis</span>
                  <p className="text-xs text-gray-500">Analyze screenshots in posts (requires OpenAI key)</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                checked={config.auto_cleanup_enabled}
                onChange={(e) => setConfig({...config, auto_cleanup_enabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Auto Cleanup</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={config.data_retention_days}
                onChange={(e) => setConfig({...config, data_retention_days: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!config.auto_cleanup_enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to keep scraped data
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                {config.auto_cleanup_enabled 
                  ? `Data older than ${config.data_retention_days} days will be automatically removed`
                  : 'Auto cleanup is disabled - data will be kept indefinitely'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}