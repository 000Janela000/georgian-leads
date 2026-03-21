import { useEffect, useState } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { api } from '../lib/api'

const FIELDS = [
  { key: 'GOOGLE_PLACES_API_KEY', label: 'Google Places API Key (Primary)', section: 'Google Places' },
  { key: 'GOOGLE_PLACES_API_KEY_2', label: 'Google Places API Key 2', section: 'Google Places' },
  { key: 'GOOGLE_PLACES_API_KEY_3', label: 'Google Places API Key 3', section: 'Google Places' },
  { key: 'GOOGLE_CSE_API_KEY', label: 'API Key', section: 'Google Custom Search (for Facebook lookup)' },
  { key: 'GOOGLE_CSE_CX', label: 'Search Engine ID (CX)', section: 'Google Custom Search (for Facebook lookup)' },
  { key: 'FACEBOOK_ACCESS_TOKEN', label: 'Access Token (optional)', section: 'Facebook Graph API' },
]

export default function Settings() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSettings().then((s) => setValues(s)).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await api.saveSettings(values)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-gray-500">Loading...</div>

  const sections = [...new Set(FIELDS.map((f) => f.section))]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-300">{section}</h2>
            <div className="space-y-3">
              {FIELDS.filter((f) => f.section === section).map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs text-gray-500">{field.label}</label>
                  <input
                    type={field.key.includes('TOKEN') || field.key.includes('PASSWORD') ? 'password' : 'text'}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-300">About API Keys</h2>
        <div className="space-y-1.5 text-xs text-gray-500">
          <p><strong className="text-gray-400">Google Places:</strong> Free tier gives $200/month credit per billing account. Add up to 3 keys for extended usage.</p>
          <p><strong className="text-gray-400">Google Custom Search:</strong> Free tier gives 100 queries/day. Used to find Facebook pages for leads.</p>
          <p><strong className="text-gray-400">Facebook Graph API:</strong> Optional. Provides follower count and last post date. Requires a Facebook App token.</p>
        </div>
      </div>
    </div>
  )
}
