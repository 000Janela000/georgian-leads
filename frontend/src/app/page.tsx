'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Users, Globe, Mail, CheckCircle, Zap } from 'lucide-react'

interface Stats {
  total_companies: number
  companies_with_website: number
  companies_without_website: number
  contacted: number
  converted: number
  financial_data_available: number
}

export default function Dashboard() {
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Companies */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total_companies}</p>
              </div>
              <Users className="text-blue-500" size={24} />
            </div>
          </div>

          {/* With Website */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Website</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.companies_with_website}</p>
              </div>
              <Globe className="text-green-500" size={24} />
            </div>
          </div>

          {/* Without Website (Leads) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Without Website (Leads)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.companies_without_website}</p>
              </div>
              <Zap className="text-yellow-500" size={24} />
            </div>
          </div>

          {/* Contacted */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contacted</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.contacted}</p>
              </div>
              <Mail className="text-purple-500" size={24} />
            </div>
          </div>

          {/* Converted */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.converted}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>

          {/* Financial Data Available */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Data</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.financial_data_available}</p>
              </div>
              <Zap className="text-indigo-500" size={24} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load statistics</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <a
            href="/import"
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
          >
            🔼 Import Companies
          </a>
          <a
            href="/companies"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            View Companies
          </a>
          <a
            href="/leads"
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            View Leads
          </a>
          <a
            href="/settings"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Configure Settings
          </a>
        </div>
      </div>

      {/* First Time User Guide */}
      {stats && stats.total_companies === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            👋 Welcome! Here's how to get started:
          </h3>
          <ol className="space-y-3 text-blue-800">
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>
                <strong>Import Companies:</strong> Go to "Import Data" tab and download OpenSanctions Georgian registry (free)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>
                <strong>Upload the file:</strong> Select the downloaded .jsonl file and click "Upload & Import"
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>
                <strong>View Companies:</strong> After import, you'll see hundreds of Georgian companies in the Companies tab
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>
                <strong>Find Leads:</strong> Go to "Leads" to see companies without websites (your sales targets!)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">5.</span>
              <span>
                <strong>Configure & Outreach:</strong> Set up email/WhatsApp in Settings, then send messages at scale
              </span>
            </li>
          </ol>
          <a
            href="/import"
            className="inline-block mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Start by Importing Data →
          </a>
        </div>
      )}
    </div>
    </div>
  )
}
