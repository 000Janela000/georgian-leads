import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function OutreachHistory() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listOutreach({ limit: 200 }).then(setRecords).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      read: 'bg-purple-100 text-purple-800',
      replied: 'bg-green-100 text-green-800',
      bounced: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    }
    return map[s] || 'bg-gray-100 text-gray-800'
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Outreach History</h1>

      {records.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          No outreach records yet. Create a campaign to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.company_id}</td>
                  <td className="px-4 py-3">{r.channel}</td>
                  <td className="px-4 py-3 text-gray-600">{r.contact_email || r.contact_phone}</td>
                  <td className="px-4 py-3 text-gray-600">{r.subject || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
