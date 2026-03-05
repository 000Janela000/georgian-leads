import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([])
  const [contactedIds, setContactedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'card'>('list')

  useEffect(() => {
    Promise.all([
      api.getLeads({ limit: 200 }),
      api.getContactedIds(),
    ]).then(([leadsData, ids]) => {
      setLeads(leadsData)
      setContactedIds(new Set(ids))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const priorityColor = (p: string) => {
    if (p === 'high') return 'bg-red-100 text-red-800'
    if (p === 'medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const high = leads.filter(l => l.priority === 'high').length
  const medium = leads.filter(l => l.priority === 'medium').length
  const low = leads.length - high - medium

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <div className="flex gap-2">
          <Link to="/leads/board" className="px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-gray-50">Board View</Link>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>List</button>
          <button onClick={() => setView('card')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'card' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>Cards</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{leads.length}</p>
          <p className="text-xs text-gray-500">Total Leads</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{high}</p>
          <p className="text-xs text-red-600">High Priority</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{medium}</p>
          <p className="text-xs text-yellow-600">Medium Priority</p>
        </div>
        <div className="bg-gray-50 border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{low}</p>
          <p className="text-xs text-gray-500">Low Priority</p>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Revenue</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><Link to={`/companies/${l.id}`} className="text-blue-600 hover:underline">{l.name_en || l.name_ka}</Link></td>
                  <td className="px-4 py-3 text-gray-600">{l.identification_code}</td>
                  <td className="px-4 py-3 text-gray-600">{l.revenue ? `${(l.revenue / 1_000_000).toFixed(1)}M` : '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(l.priority || 'low')}`}>{l.priority || 'low'}</span></td>
                  <td className="px-4 py-3 flex items-center gap-1.5">
                    <span className="text-gray-600">{l.lead_status || 'new'}</span>
                    {contactedIds.has(l.id) && <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">contacted</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((l: any) => (
            <Link key={l.id} to={`/companies/${l.id}`} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-gray-900">{l.name_en || l.name_ka}</h3>
                <div className="flex gap-1">
                  {contactedIds.has(l.id) && <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">contacted</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor(l.priority || 'low')}`}>{l.priority || 'low'}</span>
                </div>
              </div>
              {l.name_ka && l.name_en && <p className="text-xs text-gray-500 mt-1">{l.name_ka}</p>}
              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <p>ID: {l.identification_code}</p>
                {l.revenue && <p>Revenue: {(l.revenue / 1_000_000).toFixed(1)}M GEL</p>}
                {l.director_name && <p>Director: {l.director_name}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
