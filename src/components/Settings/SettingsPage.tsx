import { useState, useEffect } from 'react'
import { 
  Settings, 
  Key, 
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
  EyeOff
} from 'lucide-react'
import LoadingSpinner from '@/components/Common/LoadingSpinner'
import { ErrorMessage } from '@/components/Common/ErrorBoundary'
import api from '@/services/api'

interface SettingsConfig {
  openai_api_key: string
  scraping_enabled: boolean
  scraping_interval: number // hours
  sentiment_analysis_enabled: boolean
  max_posts_per_scrape: number
  auto_cleanup_enabled: boolean
  data_retention_days: number
}

interface TestResult {
  success: boolean
  message: string
  details?: any
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SettingsConfig>({
    openai_api_key: '',
    scraping_enabled: false,
    scraping_interval: 6,
    sentiment_analysis_enabled: false,
    max_posts_per_scrape: 50,
    auto_cleanup_enabled: true,
    data_retention_days: 30
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResults, setTestResults] = useState<{
    openai?: TestResult,
    scraping?: TestResult,
    database?: TestResult
  }>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Try to load settings from backend using API client
      const settings = await api.get('/api/settings')
      setConfig(settings)
    } catch (err: any) {
      // If backend isn't ready, use defaults
      console.log('Using default settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await api.post('/api/settings', config)
      setSuccessMessage('Settings saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const testOpenAI = async () => {
    if (!config.openai_api_key.trim()) {
      setTestResults(prev => ({
        ...prev,
        openai: { success: false, message: 'API key is required' }
      }))
      return
    }

    setIsTesting(true)
    
    try {
      const result = await api.post('/api/settings/test-openai', { 
        api_key: config.openai_api_key,
        test_text: "This is a test message for sentiment analysis." 
      })
      
      setTestResults(prev => ({
        ...prev,
        openai: { 
          success: true, 
          message: 'OpenAI API connection successful!',
          details: result
        }
      }))
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        openai: { 
          success: false, 
          message: err.detail || err.message || 'OpenAI API test failed'
        }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const testScraping = async () => {
    setIsTesting(true)
    
    try {
      const result = await api.get('/api/scraping/test-single-forum/jira')
      
      setTestResults(prev => ({
        ...prev,
        scraping: { 
          success: true, 
          message: `Successfully scraped ${result.posts_scraped} posts from Jira forum`,
          details: result
        }
      }))
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        scraping: { 
          success: false, 
          message: err.detail || err.message || 'Scraping test failed'
        }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const testDatabase = async () => {
    setIsTesting(true)
    
    try {
      const response = await fetch('/api/dashboard/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      
      if (response.ok && result.status === 'success') {
        setTestResults(prev => ({
          ...prev,
          database: { 
            success: true, 
            message: `Database connected. ${result.posts_count} posts available.`,
            details: result
          }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          database: { 
            success: false, 
            message: result.error || 'Database test failed'
          }
        }))
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        database: { 
          success: false, 
          message: 'Failed to test database: ' + err.message 
        }
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const maskApiKey = (key: string): string => {
    if (!key) return ''
    if (key.length <= 8) return '*'.repeat(key.length)
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4)
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

  if (error && !config.openai_api_key) {
    return (
      <div className="space-y-6">
        <ErrorMessage error={error} onRetry={loadSettings} />
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
            Configure API keys, scraping, and data collection settings
          </p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* API Configuration */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Key className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
            <p className="text-sm text-gray-600">Configure external API keys and services</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.openai_api_key}
                onChange={(e) => setConfig({...config, openai_api_key: e.target.value})}
                placeholder="sk-..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={testOpenAI}
                  disabled={isTesting || !config.openai_api_key.trim()}
                  className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Required for sentiment analysis. Get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                OpenAI Platform
              </a>
            </p>
            
            {testResults.openai && (
              <div className={`mt-2 p-3 rounded-md ${testResults.openai.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {testResults.openai.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span className={`text-sm ${testResults.openai.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults.openai.message}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sentiment Analysis Settings */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.sentiment_analysis_enabled}
                onChange={(e) => setConfig({...config, sentiment_analysis_enabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Sentiment Analysis</span>
                <p className="text-sm text-gray-600">Analyze sentiment of scraped posts using OpenAI</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Scraping Configuration */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Database className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Collection</h3>
            <p className="text-sm text-gray-600">Configure automated scraping of Atlassian Community</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable Scraping */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.scraping_enabled}
                onChange={(e) => setConfig({...config, scraping_enabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Automated Scraping</span>
                <p className="text-sm text-gray-600">Automatically collect posts from Atlassian Community forums</p>
              </div>
            </label>
          </div>

          {/* Scraping Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scraping Interval
            </label>
            <select
              value={config.scraping_interval}
              onChange={(e) => setConfig({...config, scraping_interval: parseInt(e.target.value)})}
              className="w-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Every hour</option>
              <option value={2}>Every 2 hours</option>
              <option value={4}>Every 4 hours</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Daily</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">How often to collect new posts</p>
          </div>

          {/* Max Posts */}
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
              className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">Maximum posts to collect per forum per scrape</p>
          </div>

          {/* Test Scraping */}
          <div>
            <button
              onClick={testScraping}
              disabled={isTesting}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>Test Scraping</span>
            </button>
            
            {testResults.scraping && (
              <div className={`mt-2 p-3 rounded-md ${testResults.scraping.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {testResults.scraping.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span className={`text-sm ${testResults.scraping.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults.scraping.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
            <p className="text-sm text-gray-600">Configure data retention and cleanup policies</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Auto Cleanup */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.auto_cleanup_enabled}
                onChange={(e) => setConfig({...config, auto_cleanup_enabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Enable Auto Cleanup</span>
                <p className="text-sm text-gray-600">Automatically remove old data to manage storage</p>
              </div>
            </label>
          </div>

          {/* Data Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention Period
            </label>
            <select
              value={config.data_retention_days}
              onChange={(e) => setConfig({...config, data_retention_days: parseInt(e.target.value)})}
              className="w-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!config.auto_cleanup_enabled}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">How long to keep collected data</p>
          </div>

          {/* Test Database */}
          <div>
            <button
              onClick={testDatabase}
              disabled={isTesting}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>Test Database</span>
            </button>
            
            {testResults.database && (
              <div className={`mt-2 p-3 rounded-md ${testResults.database.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {testResults.database.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  )}
                  <span className={`text-sm ${testResults.database.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults.database.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="dashboard-card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <p className="text-sm text-gray-600">Current status of all services</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-900">OpenAI API</span>
            <span className={`text-xs px-2 py-1 rounded ${
              testResults.openai?.success ? 'bg-green-100 text-green-800' :
              testResults.openai?.success === false ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {testResults.openai?.success ? 'Connected' :
               testResults.openai?.success === false ? 'Error' :
               'Not Tested'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-900">Scraping</span>
            <span className={`text-xs px-2 py-1 rounded ${
              testResults.scraping?.success ? 'bg-green-100 text-green-800' :
              testResults.scraping?.success === false ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {testResults.scraping?.success ? 'Working' :
               testResults.scraping?.success === false ? 'Error' :
               'Not Tested'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-900">Database</span>
            <span className={`text-xs px-2 py-1 rounded ${
              testResults.database?.success ? 'bg-green-100 text-green-800' :
              testResults.database?.success === false ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {testResults.database?.success ? 'Connected' :
               testResults.database?.success === false ? 'Error' :
               'Not Tested'}
            </span>
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      {!config.openai_api_key && (
        <div className="dashboard-card">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>To enable live data collection and AI sentiment analysis:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a></li>
                  <li>Enter your API key above and test the connection</li>
                  <li>Enable sentiment analysis and scraping</li>
                  <li>Save your settings</li>
                  <li>Go to Posts page and trigger data collection</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}