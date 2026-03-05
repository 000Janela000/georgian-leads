'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Mail, MessageCircle, Filter, Download } from 'lucide-react'

interface Outreach {
  id: number
  company_id: number
  channel: string
  contact_info: string
  message_body: string
  status: string
  sent_at: string
  created_at: string
}

export default function OutreachHistoryPage() {
  const [outreach, setOutreach] = useState<Outreach[]>([])
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchOutreach = async () => {
      try {
        const data = await api.listOutreach({ limit: 500 })
        setOutreach(data)
      } catch (error) {
        console.error('Failed to fetch outreach history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOutreach()
  }, [])

  const filteredOutreach = outreach.filter(o => {
    if (channelFilter && o.channel !== channelFilter) return false
    if (statusFilter && o.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: outreach.length,
    email: outreach.filter(o => o.channel === 'email').length,
    whatsapp: outreach.filter(o => o.channel.includes('whatsapp')).length,
    sent: outreach.filter(o => o.status === 'sent').length,
    delivered: outreach.filter(o => o.status === 'delivered').length,
    replied: outreach.filter(o => o.status === 'replied').length
  }

  const handleExport = () => {
    const headers = ['Date', 'Channel', 'Contact', 'Status', 'Message']
    const rows = filteredOutreach.map(o => [
      new Date(o.created_at).toLocaleString(),
      o.channel === 'email' ? 'Email' : 'WhatsApp',
      o.contact_info,
      o.status,
      o.message_body.substring(0, 50) + '...'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outreach-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Outreach History</h1>
      <p className="text-gray-600 mb-8">Track all your email and WhatsApp messages</p>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-600">Email</p>
          <p className="text-2xl font-bold text-blue-900">{stats.email}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600">WhatsApp</p>
          <p className="text-2xl font-bold text-green-900">{stats.whatsapp}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-sm text-purple-600">Sent</p>
          <p className="text-2xl font-bold text-purple-900">{stats.sent}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Delivered</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.delivered}</p>
        </div>
        <div className="bg-pink-50 rounded-lg border border-pink-200 p-4">
          <p className="text-sm text-pink-600">Replied</p>
          <p className="text-2xl font-bold text-pink-900">{stats.replied}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-4 items-center">
        <Filter size={18} className="text-gray-600" />

        <select
          value={channelFilter || ''}
          onChange={(e) => setChannelFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Channels</option>
          <option value="email">Email Only</option>
          <option value="whatsapp_twilio">WhatsApp (Twilio)</option>
          <option value="whatsapp_meta">WhatsApp (Meta)</option>
        </select>

        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="replied">Replied</option>
          <option value="bounced">Bounced</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <p className="text-gray-500">Loading outreach history...</p>
      ) : filteredOutreach.length === 0 ? (
        <p className="text-gray-500">No outreach records found</p>
      ) : (
        <div className="space-y-3">
          {filteredOutreach.map((o) => (
            <div key={o.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {o.channel === 'email' ? (
                      <Mail size={20} className="text-blue-500" />
                    ) : (
                      <MessageCircle size={20} className="text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {o.channel === 'email' ? 'Email' : 'WhatsApp'} to {o.contact_info}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {o.message_body}
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 flex-shrink-0 ${
                  o.status === 'sent' ? 'bg-purple-100 text-purple-800' :
                  o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  o.status === 'replied' ? 'bg-blue-100 text-blue-800' :
                  o.status === 'bounced' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
