import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'

const FIELDS = [
  {
    section: 'Email (SMTP)',
    items: [
      { key: 'SMTP_HOST', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
      { key: 'SMTP_PORT', label: 'SMTP Port', placeholder: '587' },
      { key: 'SMTP_USER', label: 'SMTP User', placeholder: 'your@gmail.com' },
      { key: 'SMTP_PASSWORD', label: 'SMTP Password', placeholder: '••••••••', type: 'password' },
    ],
  },
  {
    section: 'WhatsApp (Twilio)',
    items: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxx' },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: '••••••••', type: 'password' },
      { key: 'TWILIO_WHATSAPP_NUMBER', label: 'WhatsApp Number', placeholder: '+14155238886' },
    ],
  },
  {
    section: 'WhatsApp (Meta)',
    items: [
      { key: 'META_WHATSAPP_TOKEN', label: 'Access Token', placeholder: '••••••••', type: 'password' },
      { key: 'META_WHATSAPP_PHONE_ID', label: 'Phone Number ID', placeholder: '1234567890' },
    ],
  },
  {
    section: 'International Search',
    hint: 'Optional. Without this key, Overpass (OpenStreetMap) is used — free, no sign-up. Add a Google Places API key to get phone numbers more reliably and sort by business activity.',
    items: [
      { key: 'GOOGLE_PLACES_API_KEY', label: 'Google Places API Key', placeholder: 'AIza...', type: 'password' },
    ],
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSettings().then(setValues).catch(e => setError(getErrorMessage(e, 'Failed to load settings')))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await api.saveSettings(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {FIELDS.map(({ section, hint, items }) => (
        <div key={section} className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-1 text-sm font-semibold text-gray-200">{section}</h2>
          {hint && <p className="mb-3 text-xs text-gray-500">{hint}</p>}
          <div className="mt-3 space-y-3">
            {items.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="mb-1 block text-xs text-gray-400">{label}</label>
                <input
                  type={type || 'text'}
                  value={values[key] || ''}
                  onChange={e => setValues({ ...values, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <span className="text-sm text-green-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  )
}
