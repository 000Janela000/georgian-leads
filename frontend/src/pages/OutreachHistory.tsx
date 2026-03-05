import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { OutreachRecord } from '../lib/types'

export default function OutreachHistory() {
  const [records, setRecords] = useState<OutreachRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listOutreach({ limit: 200 }).then(data => {
      setRecords(data)
      setError('')
    }).catch(fetchError => {
      setError(getErrorMessage(fetchError, 'Failed to load outreach history'))
    }).finally(() => setLoading(false))
  }, [])

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      sent: 'border border-blue-700 bg-blue-900/50 text-blue-300',
      delivered: 'border border-green-700 bg-green-900/50 text-green-300',
      read: 'border border-purple-700 bg-purple-900/50 text-purple-300',
      replied: 'border border-green-700 bg-green-900/50 text-green-300',
      failed: 'border border-red-700 bg-red-900/50 text-red-300',
      bounced: 'border border-red-700 bg-red-900/50 text-red-300',
      draft: 'border border-gray-700 bg-gray-800 text-gray-300',
    }
    return map[s] || 'border border-gray-700 bg-gray-800 text-gray-300'
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="text-xl font-bold text-gray-100">Outreach History</h1>
        <p className="mt-1 text-sm text-gray-400">Chronological list of outreach attempts (sent and failed).</p>
      </div>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {records.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
          No outreach records yet. Create a campaign to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800 bg-gray-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Channel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-gray-100">{r.company_id}</td>
                  <td className="px-4 py-3 text-gray-200">{r.channel}</td>
                  <td className="px-4 py-3 text-gray-400">{r.contact_info || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{r.message_subject || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
