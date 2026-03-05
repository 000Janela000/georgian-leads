'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { LayoutGrid, List, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'board'>('list')

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await api.getLeadsWithoutWebsite({ limit: 100 })
        setLeads(data)
      } catch (error) {
        console.error('Failed to fetch leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const stats = {
    total: leads.length,
    high: leads.filter((l: any) => l.priority === 'high').length,
    medium: leads.filter((l: any) => l.priority === 'medium').length,
    low: leads.filter((l: any) => l.priority === 'low').length,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads (No Website)</h1>
          <p className="text-gray-600">Companies without websites - prime sales targets</p>
        </div>
        <Link
          href="/analytics"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          View Analytics
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600">High Priority</p>
          <p className="text-2xl font-bold text-red-900">{stats.high}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Medium Priority</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.medium}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600">Low Priority</p>
          <p className="text-2xl font-bold text-green-900">{stats.low}</p>
        </div>
      </div>

      {/* View Toggle & Lead Board Link */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              view === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List size={18} />
            List View
          </button>
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              view === 'board'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={18} />
            Board View
          </button>
        </div>
        <Link
          href="/leads/board"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Advanced Board →
        </Link>
      </div>

      {/* Leads List */}
      {loading ? (
        <p className="text-gray-500">Loading leads...</p>
      ) : leads.length === 0 ? (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <p className="text-gray-600 mb-4">No leads found. All your companies have websites!</p>
          <Link href="/enrichment" className="text-blue-600 hover:underline">
            Enrich more companies →
          </Link>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {leads.map((lead: any) => (
            <Link
              key={lead.id}
              href={`/companies/${lead.id}`}
              className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{lead.name_ge || lead.name_en}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>ID: {lead.identification_code}</span>
                    {lead.revenue_gel && (
                      <span>Revenue: ₾{(lead.revenue_gel / 1000000).toFixed(1)}M</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.priority === 'high' ? 'bg-red-100 text-red-800' :
                    lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {lead.priority}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.lead_status === 'new' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.lead_status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {leads.map((lead: any) => (
            <Link
              key={lead.id}
              href={`/companies/${lead.id}`}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition"
            >
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                  {lead.name_ge || lead.name_en}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{lead.identification_code}</p>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {lead.revenue_gel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">₾{(lead.revenue_gel / 1000000).toFixed(1)}M</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  lead.priority === 'high' ? 'bg-red-100 text-red-800' :
                  lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {lead.priority} Priority
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
