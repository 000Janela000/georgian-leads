import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const fields = [
  { section: 'Email (SMTP)', items: [
    { key: 'SMTP_HOST', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
    { key: 'SMTP_PORT', label: 'SMTP Port', placeholder: '587' },
    { key: 'SMTP_USER', label: 'SMTP User', placeholder: 'your@email.com' },
    { key: 'SMTP_PASSWORD', label: 'SMTP Password', placeholder: '****', type: 'password' },
  ]},
  { section: 'WhatsApp (Twilio)', items: [
    { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxxxx' },
    { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: '****', type: 'password' },
    { key: 'TWILIO_WHATSAPP_NUMBER', label: 'WhatsApp Number', placeholder: '+14155238886' },
  ]},
  { section: 'WhatsApp (Meta)', items: [
    { key: 'META_WHATSAPP_TOKEN', label: 'Access Token', placeholder: '****', type: 'password' },
    { key: 'META_WHATSAPP_PHONE_ID', label: 'Phone Number ID', placeholder: '1234567890' },
  ]},
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSettings().then(setValues).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await api.saveSettings(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {fields.map(({ section, items }) => (
        <div key={section} className="bg-white rounded-lg border p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">{section}</h2>
          <div className="space-y-3">
            {items.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-sm text-gray-600 block mb-1">{label}</label>
                <input
                  type={type || 'text'}
                  value={values[key] || ''}
                  onChange={e => setValues({ ...values, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {saved && <p className="mt-3 text-green-600 text-sm">Settings saved successfully!</p>}
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    </div>
  )
}
