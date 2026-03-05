import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { SendBulkResponse, TemplateRecord } from '../lib/types'

export default function Campaigns() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [channel, setChannel] = useState('email')
  const [templateId, setTemplateId] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendBulkResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listTemplates().then(data => {
      setTemplates(data)
      setError('')
    }).catch(fetchError => {
      setError(getErrorMessage(fetchError, 'Failed to load templates'))
    })
  }, [])

  const filteredTemplates = templates.filter(t =>
    channel.startsWith('whatsapp') ? t.channel === 'whatsapp' : t.channel === 'email'
  )

  const selectedTemplate = templates.find(t => t.id === Number(templateId))

  const handleSend = async () => {
    if (!templateId) return
    setSending(true)
    setError('')
    setResult(null)
    try {
      const res = await api.sendBulk({ channel, template_id: Number(templateId), get_all_leads: true })
      setResult(res)
    } catch (sendError) {
      setError(getErrorMessage(sendError, 'Failed to send campaign'))
    }
    setSending(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Campaigns</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">New Campaign</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Channel</label>
            <select value={channel} onChange={e => { setChannel(e.target.value); setTemplateId('') }} className="px-3 py-2 border rounded-lg text-sm w-full">
              <option value="email">Email</option>
              <option value="whatsapp_twilio">WhatsApp (Twilio)</option>
              <option value="whatsapp_meta">WhatsApp (Meta)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Template</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm w-full">
              <option value="">Select a template...</option>
              {filteredTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Preview</p>
              {selectedTemplate.subject && <p className="text-sm font-medium mb-1">{selectedTemplate.subject}</p>}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTemplate.body}</p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!templateId || sending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
          >
            {sending ? 'Sending...' : 'Send to All Leads'}
          </button>
        </div>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-medium text-green-800">Campaign Sent</p>
            <p className="text-green-700">
              Sent: {result.total_sent || 0} | Failed: {result.total_failed || 0}
              {result.skipped_dedup > 0 && ` | Skipped (already contacted): ${result.skipped_dedup}`}
              {(result.skipped_missing_contact || 0) > 0 && ` | Skipped (missing contacts): ${result.skipped_missing_contact}`}
            </p>
            {result.message && <p className="text-green-600 mt-1">{result.message}</p>}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
        <h3 className="font-medium text-yellow-900 mb-2">Important</h3>
        <p className="text-sm text-yellow-800">Make sure you've configured your email/WhatsApp credentials in Settings before sending campaigns.</p>
      </div>
    </div>
  )
}
