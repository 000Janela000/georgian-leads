import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const COLUMNS = [
  { key: 'new', label: 'New', color: 'border-blue-400' },
  { key: 'contacted', label: 'Contacted', color: 'border-yellow-400' },
  { key: 'replied', label: 'Replied', color: 'border-purple-400' },
  { key: 'converted', label: 'Converted', color: 'border-green-400' },
  { key: 'not_interested', label: 'Not Interested', color: 'border-gray-400' },
]

export default function LeadsBoard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getLeads({ limit: 500 }).then(setLeads).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.updateCompany(id, { lead_status: status })
      setLeads(prev => prev.map(l => l.id === id ? { ...l, lead_status: status } : l))
    } catch { }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads Board</h1>
        <Link to="/leads" className="px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-gray-50">List View</Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const items = leads.filter(l => (l.lead_status || 'new') === col.key)
          return (
            <div key={col.key} className={`min-w-[260px] flex-1 bg-gray-100 rounded-lg border-t-4 ${col.color}`}>
              <div className="p-3 flex items-center justify-between">
                <h3 className="font-medium text-sm text-gray-700">{col.label}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                {items.map(lead => (
                  <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <Link to={`/companies/${lead.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                      {lead.name_en || lead.name_ka}
                    </Link>
                    {lead.revenue && <p className="text-xs text-gray-500 mt-1">{(lead.revenue / 1_000_000).toFixed(1)}M GEL</p>}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {COLUMNS.filter(c => c.key !== col.key).map(c => (
                        <button
                          key={c.key}
                          onClick={() => updateStatus(lead.id, c.key)}
                          className="px-1.5 py-0.5 text-[10px] bg-gray-100 rounded hover:bg-gray-200"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
