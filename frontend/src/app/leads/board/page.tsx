'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { TrendingUp, Filter, Download } from 'lucide-react'

interface Company {
  id: number
  name_ge: string
  name_en: string
  identification_code: string
  website_status: string
  lead_status: string
  revenue_gel: number | null
  priority: string
  facebook_url?: string
  instagram_url?: string
  linkedin_url?: string
  last_enriched_at?: string
}

export default function LeadsBoardPage() {
  const [leads, setLeads] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    new: 0,
    contacted: 0,
    replied: 0,
    converted: 0
  })

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await api.getLeadsWithoutWebsite({ limit: 1000 })
        setLeads(data)

        // Calculate stats
        const stats = {
          total: data.length,
          high: data.filter((l: Company) => l.priority === 'high').length,
          medium: data.filter((l: Company) => l.priority === 'medium').length,
          low: data.filter((l: Company) => l.priority === 'low').length,
          new: data.filter((l: Company) => l.lead_status === 'new').length,
          contacted: data.filter((l: Company) => l.lead_status === 'contacted').length,
          replied: data.filter((l: Company) => l.lead_status === 'replied').length,
          converted: data.filter((l: Company) => l.lead_status === 'converted').length,
        }
        setStats(stats)
      } catch (error) {
        console.error('Failed to fetch leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const filteredLeads = leads.filter(lead => {
    if (priorityFilter && lead.priority !== priorityFilter) return false
    if (statusFilter && lead.lead_status !== statusFilter) return false
    return true
  })

  const handleExportCSV = () => {
    const headers = ['Name', 'ID Code', 'Priority', 'Status', 'Revenue', 'Social Media']
    const rows = filteredLeads.map(lead => [
      lead.name_ge || lead.name_en,
      lead.identification_code,
      lead.priority,
      lead.lead_status,
      lead.revenue_gel ? `₾${lead.revenue_gel}` : 'N/A',
      [lead.facebook_url ? 'FB' : '', lead.instagram_url ? 'IG' : '', lead.linkedin_url ? 'LI' : ''].filter(Boolean).join(', ') || 'None'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Board</h1>
      <p className="text-gray-600 mb-8">Companies without websites - your sales targets</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600">High Priority</p>
          <p className="text-3xl font-bold text-red-900">{stats.high}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Medium Priority</p>
          <p className="text-3xl font-bold text-yellow-900">{stats.medium}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600">Low Priority</p>
          <p className="text-3xl font-bold text-green-900">{stats.low}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-600">Not Yet Contacted</p>
          <p className="text-3xl font-bold text-blue-900">{stats.new}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-4 items-center">
        <Filter size={18} className="text-gray-600" />

        <select
          value={priorityFilter || ''}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="converted">Converted</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Leads Board */}
      {loading ? (
        <p className="text-gray-500">Loading leads...</p>
      ) : filteredLeads.length === 0 ? (
        <p className="text-gray-500">No leads match your filters</p>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <a
              key={lead.id}
              href={`/companies/${lead.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {lead.name_ge || lead.name_en}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lead.priority === 'high' ? 'bg-red-100 text-red-800' :
                      lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {lead.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lead.lead_status === 'new' ? 'bg-blue-100 text-blue-800' :
                      lead.lead_status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                      lead.lead_status === 'replied' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.lead_status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-2">ID: {lead.identification_code}</p>

                  <div className="flex gap-6 text-sm">
                    {lead.revenue_gel && (
                      <div>
                        <span className="text-gray-600">Revenue: </span>
                        <span className="font-medium">₾{(lead.revenue_gel / 1000000).toFixed(1)}M</span>
                      </div>
                    )}
                    {(lead.facebook_url || lead.instagram_url || lead.linkedin_url) && (
                      <div>
                        <span className="text-gray-600">Social: </span>
                        <span className="font-medium">
                          {[
                            lead.facebook_url ? 'FB' : '',
                            lead.instagram_url ? 'IG' : '',
                            lead.linkedin_url ? 'LI' : ''
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  {lead.last_enriched_at && (
                    <p className="text-xs text-gray-500">
                      Enriched: {new Date(lead.last_enriched_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
