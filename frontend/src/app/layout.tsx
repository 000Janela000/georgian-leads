import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { BarChart3, Users, Mail, Settings, TrendingUp, Download, Zap, LineChart, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Georgian Leads',
  description: 'B2B outreach platform for Georgian companies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Georgian Leads</h1>
              <p className="text-sm text-gray-500">B2B Outreach Platform</p>
            </div>

            <nav className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/import"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Download size={20} />
                <span>Import Data</span>
              </Link>

              <Link
                href="/enrichment"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Zap size={20} />
                <span>Enrichment</span>
              </Link>

              <Link
                href="/companies"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Users size={20} />
                <span>Companies</span>
              </Link>

              <Link
                href="/leads"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <TrendingUp size={20} />
                <span>Leads</span>
              </Link>

              <Link
                href="/analytics"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <LineChart size={20} />
                <span>Analytics</span>
              </Link>

              <Link
                href="/outreach"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Mail size={20} />
                <span>Outreach</span>
              </Link>

              <Link
                href="/campaigns"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <MessageSquare size={20} />
                <span>Campaigns</span>
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
