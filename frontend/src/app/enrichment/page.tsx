'use client'

import { useState, useEffect } from 'react'
import { Zap, Loader, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

interface EnrichmentResult {
  company_id: number
  status: string
  website_found: boolean
  website_url?: string
  social_profiles: Record<string, string>
  financial_data?: {
    year: number
    revenue: number
    assets: number
    profit: number
  }
  priority: string
  message: string
}

interface BatchResult {
  total: number
  successful: number
  failed: number
  message?: string
  results?: EnrichmentResult[]
}

export default function EnrichmentPage() {
  const [loading, setLoading] = useState(false)
  const [enrichmentMode, setEnrichmentMode] = useState<'leads' | 'single' | 'batch'>('leads')
  const [singleCompanyId, setSingleCompanyId] = useState<number | null>(null)
  const [limit, setLimit] = useState(10)
  const [result, setResult] = useState<BatchResult | EnrichmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEnrichLeads = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        `http://localhost:8000/api/companies/enrich-batch?limit=${limit}`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Enrichment failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrichment failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrichSingle = async () => {
    if (!singleCompanyId) {
      setError('Please enter a company ID')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        `http://localhost:8000/api/companies/${singleCompanyId}/enrich`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Enrichment failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrichment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Enrichment</h1>
      <p className="text-gray-600 mb-8">
        Auto-detect websites, social media, and financial data for companies
      </p>

      {/* Mode Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrichment Mode</h2>

        <div className="grid grid-cols-3 gap-4">
          {/* Leads Mode */}
          <button
            onClick={() => setEnrichmentMode('leads')}
            className={`p-4 rounded-lg border-2 transition ${
              enrichmentMode === 'leads'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">Enrich Leads</h3>
            <p className="text-sm text-gray-600">
              Auto-enrich companies without websites (sorted by revenue)
            </p>
          </button>

          {/* Single Mode */}
          <button
            onClick={() => setEnrichmentMode('single')}
            className={`p-4 rounded-lg border-2 transition ${
              enrichmentMode === 'single'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">Single Company</h3>
            <p className="text-sm text-gray-600">
              Enrich one specific company by ID
            </p>
          </button>

          {/* Batch Mode */}
          <button
            onClick={() => setEnrichmentMode('batch')}
            className={`p-4 rounded-lg border-2 transition ${
              enrichmentMode === 'batch'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">Batch Enrich</h3>
            <p className="text-sm text-gray-600">
              Coming soon - specify company IDs
            </p>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrichment Settings</h2>

        {enrichmentMode === 'leads' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limit (how many leads to enrich)
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              More = slower but more companies enriched. (1 second delay between each)
            </p>
          </div>
        )}

        {enrichmentMode === 'single' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company ID
            </label>
            <input
              type="number"
              value={singleCompanyId || ''}
              onChange={(e) => setSingleCompanyId(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Enter company ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={enrichmentMode === 'leads' ? handleEnrichLeads : handleEnrichSingle}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Enriching...
            </>
          ) : (
            <>
              <Zap size={18} />
              Start Enrichment
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            {typeof (result as BatchResult).total !== 'undefined' ? (
              <>
                <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {(result as BatchResult).message || 'Enrichment Complete'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Processed</p>
                      <p className="text-2xl font-bold text-blue-600">{(result as BatchResult).total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Successful</p>
                      <p className="text-2xl font-bold text-green-600">{(result as BatchResult).successful}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{(result as BatchResult).failed}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Company Enriched
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Company ID:</span> {(result as EnrichmentResult).company_id}
                    </div>
                    {(result as EnrichmentResult).website_found && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        Website found: {(result as EnrichmentResult).website_url}
                      </div>
                    )}
                    {!(result as EnrichmentResult).website_found && (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle size={16} />
                        No website (good lead!)
                      </div>
                    )}
                    {Object.keys((result as EnrichmentResult).social_profiles).length > 0 && (
                      <div>
                        <span className="font-medium">Social Media:</span> {Object.keys((result as EnrichmentResult).social_profiles).join(', ')}
                      </div>
                    )}
                    {(result as EnrichmentResult).financial_data && (
                      <div>
                        <span className="font-medium">Revenue:</span> ₾{((result as EnrichmentResult).financial_data?.revenue || 0).toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} />
                      <span className="font-medium">Priority:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        (result as EnrichmentResult).priority === 'high' ? 'bg-red-100 text-red-800' :
                        (result as EnrichmentResult).priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {(result as EnrichmentResult).priority}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">What Gets Enriched</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Website detection (Clearbit, Google CSE)</li>
            <li>✓ Social media profiles (Facebook, Instagram, LinkedIn)</li>
            <li>✓ Financial data (revenue, assets, profit)</li>
            <li>✓ Lead priority scoring</li>
            <li>✓ Enrichment timestamp</li>
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">Requirements</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>🔑 Clearbit API key (free 50k/month)</li>
            <li>🔍 Google CSE API key (100/day free)</li>
            <li>⏱️ 1 second delay between requests</li>
            <li>🌐 Internet connection</li>
            <li>📊 Settings must be configured</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
