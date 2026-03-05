'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Mail, MessageCircle, Send, Plus, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface Template {
  id: number
  name: string
  language: string
  channel: string
  subject?: string
  body: string
}

interface Campaign {
  id?: number
  name: string
  channel: 'email' | 'whatsapp_twilio' | 'whatsapp_meta'
  template_id: number
  company_ids?: number[]
  total_sent?: number
  total_failed?: number
}

export default function CampaignsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [outreachHistory, setOutreachHistory] = useState([])
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'whatsapp_twilio' | 'whatsapp_meta'>('email')
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [sendToAllLeads, setSendToAllLeads] = useState(true)
  const [campaignName, setCampaignName] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const templatesData = await api.listTemplates()
        setTemplates(templatesData)

        const outreachData = await api.listOutreach({ limit: 100 })
        setOutreachHistory(outreachData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSendCampaign = async () => {
    if (!selectedTemplate) {
      setError('Please select a template')
      return
    }

    setSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:8000/api/outreach/send/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          template_id: selectedTemplate,
          get_all_leads: sendToAllLeads
        })
      })

      if (!response.ok) {
        throw new Error('Campaign send failed')
      }

      const data = await response.json()
      setResult(data)
      setShowNewCampaign(false)
      setCampaignName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outreach Campaigns</h1>
          <p className="text-gray-600">Send bulk messages to leads via email or WhatsApp</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(!showNewCampaign)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      {/* New Campaign Form */}
      {showNewCampaign && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create Campaign</h2>

          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Q1 2024 Web Dev Outreach"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Communication Channel
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedChannel('email')}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedChannel === 'email'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mail size={24} className="mx-auto mb-2" />
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-gray-500">Via SMTP</p>
                </button>

                <button
                  onClick={() => setSelectedChannel('whatsapp_twilio')}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedChannel === 'whatsapp_twilio'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageCircle size={24} className="mx-auto mb-2" />
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-500">Twilio</p>
                </button>

                <button
                  onClick={() => setSelectedChannel('whatsapp_meta')}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedChannel === 'whatsapp_meta'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageCircle size={24} className="mx-auto mb-2" />
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-500">Meta API</p>
                </button>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <select
                value={selectedTemplate || ''}
                onChange={(e) => setSelectedTemplate(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.language.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                {templates.find((t) => t.id === selectedTemplate)?.subject && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Subject:</strong> {templates.find((t) => t.id === selectedTemplate)?.subject}
                  </p>
                )}
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {templates.find((t) => t.id === selectedTemplate)?.body}
                </p>
              </div>
            )}

            {/* Target Selection */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToAllLeads}
                  onChange={(e) => setSendToAllLeads(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">
                  Send to all leads (companies without websites)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                If unchecked, you can select specific companies after creation
              </p>
            </div>

            {/* Confirmation */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <p className="text-sm text-blue-900">
                <strong>⚠️ Important:</strong> Make sure your email/WhatsApp configuration is complete in Settings before sending.
              </p>
            </div>

            {/* Send Button */}
            <div className="flex gap-3">
              <button
                onClick={handleSendCampaign}
                disabled={sending || !selectedTemplate}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Campaign
                  </>
                )}
              </button>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Campaign Sent Successfully!
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>
                  <strong>Total Sent:</strong> {result.total_sent}
                </p>
                {result.total_failed > 0 && (
                  <p>
                    <strong>Failed:</strong> {result.total_failed}
                  </p>
                )}
                <p className="text-sm mt-3">{result.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Outreach History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Outreach</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : outreachHistory.length === 0 ? (
          <p className="text-gray-500">No outreach history yet. Create your first campaign!</p>
        ) : (
          <div className="space-y-3">
            {outreachHistory.slice(0, 20).map((outreach: any) => (
              <div key={outreach.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {outreach.channel === 'email' ? (
                      <Mail size={18} className="text-blue-500" />
                    ) : (
                      <MessageCircle size={18} className="text-green-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {outreach.channel === 'email' ? 'Email' : 'WhatsApp'} to {outreach.contact_info}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(outreach.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  outreach.status === 'sent' ? 'bg-green-100 text-green-800' :
                  outreach.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {outreach.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">✉️ Email Campaign</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Uses SMTP configured in Settings</li>
            <li>• Supports HTML templates</li>
            <li>• Include subject line in template</li>
            <li>• Best for formal outreach</li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <h3 className="font-semibold text-green-900 mb-3">💬 WhatsApp Campaign</h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>• Choose Twilio or Meta API</li>
            <li>• Requires phone numbers</li>
            <li>• Great for follow-ups</li>
            <li>• Higher engagement rates</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
