import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { TemplateRecord } from '../lib/types'

interface TemplateForm {
  name: string
  language: string
  channel: 'email' | 'whatsapp'
  subject: string
  body: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TemplateRecord | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<TemplateForm>({ name: '', language: 'en', channel: 'email', subject: '', body: '' })

  const load = () => api.listTemplates().then(data => {
    setTemplates(data)
    setError('')
  }).catch(fetchError => {
    setError(getErrorMessage(fetchError, 'Failed to load templates'))
  }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (editing?.id) {
        await api.updateTemplate(editing.id, form)
      } else {
        await api.createTemplate(form)
      }
      setEditing(null)
      setCreating(false)
      setForm({ name: '', language: 'en', channel: 'email', subject: '', body: '' })
      load()
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Failed to save template'))
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this template?')) return
    try {
      await api.deleteTemplate(id)
      load()
    } catch (removeError) {
      setError(getErrorMessage(removeError, 'Failed to delete template'))
    }
  }

  const startEdit = (t: TemplateRecord) => {
    setCreating(false)
    setEditing(t)
    setForm({ name: t.name, language: t.language, channel: t.channel, subject: t.subject || '', body: t.body })
  }

  const inputCls = 'w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none'

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Templates</h1>
        <button
          onClick={() => { setEditing(null); setCreating(true); setForm({ name: '', language: 'en', channel: 'email', subject: '', body: '' }) }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Template
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {(editing || creating) && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-200">{editing?.id ? 'Edit' : 'New'} Template</h2>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Template name"
            className={inputCls}
          />
          <div className="flex gap-3">
            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none">
              <option value="en">English</option>
              <option value="ka">Georgian</option>
            </select>
            <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as 'email' | 'whatsapp' })}
              className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none">
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          {form.channel === 'email' && (
            <input
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="Email subject"
              className={inputCls}
            />
          )}
          <textarea
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            placeholder="Message body — use {name} and {company_name} for personalization"
            rows={5}
            className={`${inputCls} resize-none`}
          />
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={() => { setEditing(null); setCreating(false) }}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-100">{t.name}</span>
                <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs text-gray-400">{t.language}</span>
                <span className="rounded-full border border-blue-700 bg-blue-900/40 px-2 py-0.5 text-xs text-blue-300">{t.channel}</span>
                {t.is_default && <span className="rounded-full border border-green-700 bg-green-900/40 px-2 py-0.5 text-xs text-green-300">default</span>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(t)} className="text-xs text-blue-400 hover:underline">Edit</button>
                <button onClick={() => remove(t.id)} className="text-xs text-red-400 hover:underline">Delete</button>
              </div>
            </div>
            {t.subject && <p className="mb-1 text-xs text-gray-400">Subject: {t.subject}</p>}
            <p className="line-clamp-2 text-xs text-gray-500">{t.body}</p>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">No templates yet — create one to use in campaigns.</p>
        )}
      </div>
    </div>
  )
}
