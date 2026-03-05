import { Link } from 'react-router-dom'
import { Send, History, FileText, Settings } from 'lucide-react'

const actions = [
  { to: '/campaigns', icon: Send, label: 'Create Campaign', desc: 'Send bulk messages to leads' },
  { to: '/outreach/history', icon: History, label: 'Outreach History', desc: 'View all sent messages and statuses' },
  { to: '/templates', icon: FileText, label: 'Message Templates', desc: 'Create and manage templates' },
  { to: '/settings', icon: Settings, label: 'Email & WhatsApp Setup', desc: 'Configure sending credentials' },
]

export default function Outreach() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Outreach</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {actions.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Icon size={20} className="text-blue-500" />
              <h3 className="font-semibold text-gray-900">{label}</h3>
            </div>
            <p className="text-sm text-gray-600">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="font-medium text-blue-900 mb-2">Supported Channels</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Email</strong> - Via SMTP (Gmail, custom server)</li>
          <li><strong>WhatsApp (Twilio)</strong> - Via Twilio API</li>
          <li><strong>WhatsApp (Meta)</strong> - Via Meta Business API</li>
        </ul>
      </div>
    </div>
  )
}
