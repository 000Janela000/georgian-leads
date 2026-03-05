import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', language: 'en', channel: 'email', subject: '', body: '' })

  const load = () => api.listTemplates().then(setTemplates).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (editing?.id) {
        await api.updateTemplate(editing.id, form)
      } else {
        await api.createTemplate(form)
      }
      setEditing(null)
      setForm({ name: '', language: 'en', channel: 'email', subject: '', body: '' })
      load()
    } catch { }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this template?')) return
    await api.deleteTemplate(id).catch(() => {})
    load()
  }

  const startEdit = (t: any) => {
    setEditing(t)
    setForm({ name: t.name, language: t.language, channel: t.channel, subject: t.subject || '', body: t.body })
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <button onClick={() => { setEditing({}); setForm({ name: '', language: 'en', channel: 'email', subject: '', body: '' }) }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">New Template</button>
      </div>

      {editing && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h2 className="font-semibold mb-3">{editing.id ? 'Edit' : 'New'} Template</h2>
          <div className="space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Template name" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="flex gap-3">
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="en">English</option>
                <option value="ka">Georgian</option>
              </select>
              <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            {form.channel === 'email' && (
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" className="w-full px-3 py-2 border rounded-lg text-sm" />
            )}
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Message body (use {name} and {company_name} for personalization)" rows={5} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={save} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Save</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((t: any) => (
          <div key={t.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{t.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{t.language}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">{t.channel}</span>
                {t.is_default && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-600">default</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(t)} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => remove(t.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
            {t.subject && <p className="text-sm text-gray-600 mb-1">Subject: {t.subject}</p>}
            <p className="text-sm text-gray-500 line-clamp-2">{t.body}</p>
          </div>
        ))}
        {templates.length === 0 && <p className="text-gray-500 text-center py-8">No templates yet.</p>}
      </div>
    </div>
  )
}
