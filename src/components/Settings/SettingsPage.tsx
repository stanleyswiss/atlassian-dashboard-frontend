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
  BarChart3
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

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/settings/config')
      if (response.data) {
        setConfig(response.data)
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
      
      if (result.data.database && result.data.database.status === 'connected') {
        setTestResults(prev => ({
          ...prev,
          database: { success: true, message: 'Database connection successful', details: result.data.database }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          database: { success: false, message: 'Database connection failed' }
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
      const result = await api.post('/api/admin/migrate-database')
      
      if (result.data.success) {
        setSuccessMessage(`Database migration successful! Added: ${result.data.added_columns.join(', ')}`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError('Database migration failed')
      }
    } catch (err: any) {
      setError('Database migration failed: ' + err.message)
      console.error('Migration error:', err)
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

      {/* System Tests */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TestTube className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Tests</h3>
          </div>
          <button
            onClick={migrateDatabase}
            disabled={isTesting}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span>Migrate DB</span>
          </button>
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