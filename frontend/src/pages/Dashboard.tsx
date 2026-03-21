import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Flame, Thermometer, Snowflake } from 'lucide-react'
import { api } from '../lib/api'
import type { Stats } from '../lib/types'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500">Loading...</div>

  if (!stats || stats.total_leads === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Welcome to LeadScout</h1>
        <p className="mb-6 max-w-md text-gray-400">
          Find Georgian businesses without websites. Start by discovering leads from Google Maps.
        </p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Search size={16} />
          Start Discovering
        </Link>
      </div>
    )
  }

  const tierData = [
    { label: 'Hot', count: stats.leads_by_tier.hot, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-950' },
    { label: 'Warm', count: stats.leads_by_tier.warm, icon: Thermometer, color: 'text-yellow-400', bg: 'bg-yellow-950' },
    { label: 'Cold', count: stats.leads_by_tier.cold, icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-950' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Dashboard</h1>

      {/* Total + tier breakdown */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs font-medium uppercase text-gray-500">Total Leads</div>
          <div className="mt-1 text-2xl font-bold text-white">{stats.total_leads}</div>
        </div>
        {tierData.map((t) => (
          <div key={t.label} className={`rounded-lg border border-gray-800 ${t.bg} p-4`}>
            <div className="flex items-center gap-1.5">
              <t.icon size={13} className={t.color} />
              <span className="text-xs font-medium uppercase text-gray-500">{t.label}</span>
            </div>
            <div className={`mt-1 text-2xl font-bold ${t.color}`}>{t.count}</div>
          </div>
        ))}
      </div>

      {/* Contact info breakdown */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs font-medium uppercase text-gray-500">With Facebook</div>
          <div className="mt-1 text-lg font-semibold text-white">{stats.leads_with_facebook}</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs font-medium uppercase text-gray-500">With Phone</div>
          <div className="mt-1 text-lg font-semibold text-white">{stats.leads_with_phone}</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs font-medium uppercase text-gray-500">With Email</div>
          <div className="mt-1 text-lg font-semibold text-white">{stats.leads_with_email}</div>
        </div>
      </div>

      {/* City breakdown */}
      {Object.keys(stats.leads_by_city).length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">By City</h2>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(stats.leads_by_city).map(([city, count]) => (
              <div key={city} className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
                <div className="text-xs text-gray-400">{city}</div>
                <div className="mt-0.5 text-lg font-semibold text-white">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          <Search size={14} />
          Discover More
        </Link>
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          <Users size={14} />
          View Leads
        </Link>
      </div>
    </div>
  )
}
