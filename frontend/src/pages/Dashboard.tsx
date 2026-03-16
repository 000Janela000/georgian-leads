import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Stats } from '../lib/types'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setError('Failed to load stats'))
  }, [])

  if (error) return <div className="p-8 text-red-400">{error}</div>
  if (!stats) return <div className="p-8 text-gray-500">Loading...</div>

  const totalLeads = stats.total_registry + stats.total_local

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Total leads" value={totalLeads} accent="text-white" />
        <Tile label="With phone" value={stats.leads_with_phone} accent="text-green-400" />
        <Tile label="With email" value={stats.leads_with_email} accent="text-blue-400" />
        <Tile label="Converted" value={stats.converted} accent="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile label="Outreach sent" value={stats.outreach_sent_count} accent="text-indigo-400" />
        <Tile label="Replies" value={stats.outreach_replied_count} accent="text-yellow-400" />
        <Tile label="Local businesses" value={stats.total_local} accent="text-purple-400" />
      </div>

      <div className="flex gap-2">
        <Link to="/find" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          Find Leads
        </Link>
        <Link to="/leads" className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-600">
          My Leads
        </Link>
        <Link to="/campaigns" className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-600">
          Campaigns
        </Link>
      </div>

      {totalLeads === 0 && (
        <div className="rounded-lg border border-blue-800 bg-blue-900/20 px-5 py-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-300">Getting started</h3>
          <ol className="space-y-1.5 text-sm text-blue-200">
            <li>1. <Link to="/find" className="underline">Find Leads</Link> — search any city + category, or sweep preset cities in bulk</li>
            <li>2. <Link to="/leads" className="underline">My Leads</Link> — filter by "has phone", see category badges, pick who to call</li>
            <li>3. <Link to="/campaigns" className="underline">Campaigns</Link> — send email or WhatsApp outreach in bulk</li>
          </ol>
        </div>
      )}
    </div>
  )
}

function Tile({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-600">{sub}</p>}
    </div>
  )
}
