import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { Stats } from '../lib/types'

interface BarProps {
  label: string
  value: number
  max: number
  color: string
}

function Bar({ label, value, max, color }: BarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getStats().then(data => {
      setStats(data)
      setError('')
    }).catch(fetchError => {
      setError(getErrorMessage(fetchError, 'Failed to load analytics'))
    })
  }, [])

  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!stats) return <div className="p-8 text-gray-500">Loading...</div>

  const total = stats.total_companies || 1
  const withWeb = stats.companies_with_website
  const withoutWeb = stats.companies_without_website
  const conversionRate = total > 0 ? ((stats.converted / total) * 100).toFixed(1) : '0'
  const enrichedPct = total > 0 ? ((stats.financial_data_available / total) * 100).toFixed(0) : '0'

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total_companies}</p>
          <p className="text-xs text-gray-500">Total Companies</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
          <p className="text-xs text-gray-500">Conversion Rate</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{withoutWeb}</p>
          <p className="text-xs text-gray-500">Web Presence Gap</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{enrichedPct}%</p>
          <p className="text-xs text-gray-500">Data Enriched</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Website Status</h2>
          <Bar label="With Website" value={withWeb} max={total} color="bg-green-500" />
          <Bar label="Without Website" value={withoutWeb} max={total} color="bg-red-500" />
          <Bar label="Unknown" value={total - withWeb - withoutWeb} max={total} color="bg-gray-400" />
        </div>

        <div className="bg-white rounded-lg border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Outreach Pipeline</h2>
          <Bar label="Not Contacted" value={total - stats.contacted} max={total} color="bg-gray-400" />
          <Bar label="Contacted" value={stats.contacted} max={total} color="bg-blue-500" />
          <Bar label="Converted" value={stats.converted} max={total} color="bg-green-500" />
        </div>
      </div>
    </div>
  )
}
