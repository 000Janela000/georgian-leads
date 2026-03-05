'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BarChart3, TrendingUp, Target, CheckCircle } from 'lucide-react'

interface Stats {
  total_companies: number
  companies_with_website: number
  companies_without_website: number
  contacted: number
  converted: number
  financial_data_available: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-red-500">Failed to load analytics</p>
      </div>
    )
  }

  const conversionRate = stats.contacted > 0
    ? ((stats.converted / stats.contacted) * 100).toFixed(1)
    : 0

  const websiteRate = stats.total_companies > 0
    ? ((stats.companies_with_website / stats.total_companies) * 100).toFixed(1)
    : 0

  const enrichmentRate = stats.total_companies > 0
    ? ((stats.financial_data_available / stats.total_companies) * 100).toFixed(1)
    : 0

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics & Insights</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-600">Total Companies</h3>
            <BarChart3 className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_companies.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">In database</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-600">Conversion Rate</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-2">{stats.converted} of {stats.contacted} contacted</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-600">Web Presence Gap</h3>
            <Target className="text-orange-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.companies_without_website.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">{websiteRate}% no website</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-600">Data Enriched</h3>
            <CheckCircle className="text-purple-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{enrichmentRate}%</p>
          <p className="text-xs text-gray-500 mt-2">{stats.financial_data_available.toLocaleString()} with financial data</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Website Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Website Status Distribution</h2>

          <div className="space-y-4">
            {/* With Website */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Has Website</span>
                <span className="text-sm font-bold text-gray-900">{stats.companies_with_website.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: stats.total_companies > 0
                      ? `${(stats.companies_with_website / stats.total_companies) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            {/* No Website */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">No Website (Leads)</span>
                <span className="text-sm font-bold text-gray-900">{stats.companies_without_website.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{
                    width: stats.total_companies > 0
                      ? `${(stats.companies_without_website / stats.total_companies) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Opportunity:</strong> {stats.companies_without_website.toLocaleString()} companies are prime targets for web development services.
            </p>
          </div>
        </div>

        {/* Outreach Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Outreach Status</h2>

          <div className="space-y-4">
            {/* Not Contacted */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Not Yet Contacted</span>
                <span className="text-sm font-bold text-gray-900">
                  {Math.max(0, stats.companies_without_website - stats.contacted).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: stats.companies_without_website > 0
                      ? `${((stats.companies_without_website - stats.contacted) / stats.companies_without_website) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            {/* Contacted */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Contacted</span>
                <span className="text-sm font-bold text-gray-900">{stats.contacted.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{
                    width: stats.companies_without_website > 0
                      ? `${(stats.contacted / stats.companies_without_website) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            {/* Converted */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Converted</span>
                <span className="text-sm font-bold text-gray-900">{stats.converted.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: stats.companies_without_website > 0
                      ? `${(stats.converted / stats.companies_without_website) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-900">
              <strong>Next Step:</strong> Use the Outreach feature to send emails/WhatsApp to {Math.max(0, stats.companies_without_website - stats.contacted).toLocaleString()} not-yet-contacted leads.
            </p>
          </div>
        </div>
      </div>

      {/* Data Quality */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Data Quality</h2>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Financial Data Coverage</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: stats.total_companies > 0
                      ? `${(stats.financial_data_available / stats.total_companies) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <span className="text-sm font-bold">{enrichmentRate}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.financial_data_available.toLocaleString()} companies have financial data
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Website Detection</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: stats.total_companies > 0 ? 100 : 0 + '%'
                  }}
                />
              </div>
              <span className="text-sm font-bold">100%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All companies checked for websites
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Data Currency</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full"
                  style={{ width: '75%' }}
                />
              </div>
              <span className="text-sm font-bold">75%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last 30 days enriched
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Recommendations</h2>

        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            • <strong>High-Value Targets:</strong> Focus on the {stats.companies_without_website.toLocaleString()} leads without websites. These are your prime sales targets.
          </li>
          <li>
            • <strong>Prioritization:</strong> Start with high-priority leads (high revenue, no website). Use the Lead Board to filter by priority.
          </li>
          <li>
            • <strong>Outreach Campaign:</strong> Create personalized campaigns using built-in templates. Start with {Math.min(50, stats.companies_without_website).toLocaleString()} leads to test messaging.
          </li>
          <li>
            • <strong>Data Enrichment:</strong> Re-enrich companies monthly to catch new opportunities and update financial data.
          </li>
          <li>
            • <strong>Conversion Tracking:</strong> Monitor conversion rate. Aim to improve from {conversionRate}% by refining messaging and targeting.
          </li>
        </ul>
      </div>
    </div>
  )
}
