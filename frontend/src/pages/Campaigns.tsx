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
    api.listTemplates().then(setTemplates).catch(e => setError(getErrorMessage(e, 'Failed to load templates')))
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
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to send campaign'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Campaigns</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Batch send email or WhatsApp to your saved leads.
        </p>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Channel</label>
          <select
            value={channel}
            onChange={e => { setChannel(e.target.value); setTemplateId('') }}
            className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none"
          >
            <option value="email">Email</option>
            <option value="whatsapp_twilio">WhatsApp (Twilio)</option>
            <option value="whatsapp_meta">WhatsApp (Meta)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-400">Template</label>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none"
          >
            <option value="">Select a template…</option>
            {filteredTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="mb-1 text-xs text-gray-500">Preview</p>
            {selectedTemplate.subject && (
              <p className="mb-1 text-sm font-medium text-gray-200">{selectedTemplate.subject}</p>
            )}
            <p className="whitespace-pre-wrap text-sm text-gray-300">{selectedTemplate.body}</p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!templateId || sending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send to All Saved Leads'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {result && (
          <div className="rounded-lg border border-green-700 bg-green-900/30 p-4 text-sm">
            <p className="font-medium text-green-300">Campaign sent</p>
            <p className="mt-1 text-green-400">
              Sent: {result.total_sent} · Failed: {result.total_failed}
              {result.skipped_dedup > 0 && ` · Skipped (already contacted): ${result.skipped_dedup}`}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-300">
        Make sure SMTP or WhatsApp credentials are configured in <strong>Settings</strong> before sending.
      </div>
    </div>
  )
}
