import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Users, Globe, Zap, Mail, CheckCircle } from 'lucide-react'

interface Stats {
  total_companies: number
  companies_with_website: number
  companies_without_website: number
  contacted: number
  converted: number
  financial_data_available: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setError('Failed to load stats'))
  }, [])

  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!stats) return <div className="p-8 text-gray-500">Loading...</div>

  const cards = [
    { label: 'Total Companies', value: stats.total_companies, icon: Users, color: 'text-blue-500' },
    { label: 'With Website', value: stats.companies_with_website, icon: Globe, color: 'text-green-500' },
    { label: 'Without Website', value: stats.companies_without_website, icon: Zap, color: 'text-yellow-500' },
    { label: 'Contacted', value: stats.contacted, icon: Mail, color: 'text-purple-500' },
    { label: 'Converted', value: stats.converted, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Financial Data', value: stats.financial_data_available, icon: Zap, color: 'text-indigo-500' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <Icon className={color} size={22} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Link to="/import" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium">Import Companies</Link>
          <Link to="/companies" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">View Companies</Link>
          <Link to="/leads" className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium">View Leads</Link>
          <Link to="/enrichment" className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium">Enrich Data</Link>
        </div>
      </div>

      {stats.total_companies === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Getting Started</h3>
          <ol className="space-y-2 text-blue-800 text-sm">
            <li><strong>1.</strong> Go to <Link to="/import" className="underline">Import Data</Link> and upload OpenSanctions Georgian registry</li>
            <li><strong>2.</strong> View imported companies in the <Link to="/companies" className="underline">Companies</Link> tab</li>
            <li><strong>3.</strong> Go to <Link to="/enrichment" className="underline">Enrichment</Link> to find websites and financial data</li>
            <li><strong>4.</strong> Check <Link to="/leads" className="underline">Leads</Link> for companies without websites</li>
            <li><strong>5.</strong> Configure email/WhatsApp in <Link to="/settings" className="underline">Settings</Link> and launch campaigns</li>
          </ol>
        </div>
      )}
    </div>
  )
}
