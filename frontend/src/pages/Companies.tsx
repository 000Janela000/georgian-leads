import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [contactedIds, setContactedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [websiteStatus, setWebsiteStatus] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  useEffect(() => {
    api.getContactedIds().then(ids => setContactedIds(new Set(ids))).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.listCompanies({
      skip: page * limit,
      limit,
      search: search || undefined,
      website_status: websiteStatus || undefined,
      lead_status: leadStatus || undefined,
    })
      .then(setCompanies)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search, websiteStatus, leadStatus])

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      found: 'bg-green-100 text-green-800',
      not_found: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800',
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.unknown}`}>{status}</span>
  }

  const leadBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      not_interested: 'bg-gray-100 text-gray-800',
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Companies</h1>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
        />
        <select value={websiteStatus} onChange={e => { setWebsiteStatus(e.target.value); setPage(0) }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Website Status</option>
          <option value="found">Found</option>
          <option value="not_found">Not Found</option>
          <option value="unknown">Unknown</option>
        </select>
        <select value={leadStatus} onChange={e => { setLeadStatus(e.target.value); setPage(0) }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Lead Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="converted">Converted</option>
          <option value="not_interested">Not Interested</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Legal Form</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Website</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Revenue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lead Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c: any) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/companies/${c.id}`} className="text-blue-600 hover:underline font-medium">
                        {c.name_en || c.name_ka}
                      </Link>
                      {c.name_ka && c.name_en && <p className="text-xs text-gray-500">{c.name_ka}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.identification_code}</td>
                    <td className="px-4 py-3 text-gray-600">{c.legal_form || '-'}</td>
                    <td className="px-4 py-3">{statusBadge(c.website_status || 'unknown')}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.revenue ? `${(c.revenue / 1_000_000).toFixed(1)}M` : '-'}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1.5">
                      {leadBadge(c.lead_status || 'new')}
                      {contactedIds.has(c.id) && <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">contacted</span>}
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No companies found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3 mt-4 items-center">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white border rounded-lg text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600">Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={companies.length < limit} className="px-3 py-1.5 bg-white border rounded-lg text-sm disabled:opacity-50">Next</button>
          </div>
        </>
      )}
    </div>
  )
}
