'use client'

import Link from 'next/link'
import { Mail, MessageCircle, Send, History, FileText } from 'lucide-react'

export default function OutreachPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Outreach</h1>
      <p className="text-gray-600 mb-8">Send bulk campaigns via email or WhatsApp and track responses</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Campaigns */}
        <Link
          href="/campaigns"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition"
        >
          <div className="flex items-center gap-4">
            <Send className="text-blue-500 flex-shrink-0" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Create Campaign</h3>
              <p className="text-sm text-gray-600">Send bulk emails or WhatsApp</p>
            </div>
          </div>
        </Link>

        {/* History */}
        <Link
          href="/outreach/history"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition"
        >
          <div className="flex items-center gap-4">
            <History className="text-purple-500 flex-shrink-0" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Outreach History</h3>
              <p className="text-sm text-gray-600">View all sent messages</p>
            </div>
          </div>
        </Link>

        {/* Templates */}
        <Link
          href="/outreach/templates"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition"
        >
          <div className="flex items-center gap-4">
            <FileText className="text-green-500 flex-shrink-0" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Message Templates</h3>
              <p className="text-sm text-gray-600">Create and manage templates</p>
            </div>
          </div>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition"
        >
          <div className="flex items-center gap-4">
            <Mail className="text-orange-500 flex-shrink-0" size={32} />
            <div>
              <h3 className="font-semibold text-gray-900">Email & WhatsApp Setup</h3>
              <p className="text-sm text-gray-600">Configure SMTP and messaging</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Mail size={20} />
            Email Campaigns
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Send to hundreds of prospects</li>
            <li>✓ HTML email support</li>
            <li>✓ Use Georgian or English templates</li>
            <li>✓ Requires SMTP configuration</li>
            <li>✓ Track delivery status</li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <MessageCircle size={20} />
            WhatsApp Campaigns
          </h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>✓ Send via Twilio or Meta API</li>
            <li>✓ Higher engagement rates</li>
            <li>✓ Requires phone numbers</li>
            <li>✓ Perfect for follow-ups</li>
            <li>✓ Read receipts available</li>
          </ul>
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">🚀 Getting Started</h3>
        <ol className="text-sm text-gray-700 space-y-2">
          <li><strong>1.</strong> Configure email/WhatsApp in <Link href="/settings" className="text-blue-600 hover:underline">Settings</Link></li>
          <li><strong>2.</strong> Create message templates in <Link href="/outreach/templates" className="text-blue-600 hover:underline">Templates</Link></li>
          <li><strong>3.</strong> Go to <Link href="/campaigns" className="text-blue-600 hover:underline">Campaigns</Link> and create a new campaign</li>
          <li><strong>4.</strong> Select template and communication channel (Email or WhatsApp)</li>
          <li><strong>5.</strong> Send to all leads or specific companies</li>
          <li><strong>6.</strong> Track results in <Link href="/outreach/history" className="text-blue-600 hover:underline">History</Link></li>
        </ol>
      </div>
    </div>
  )
}
