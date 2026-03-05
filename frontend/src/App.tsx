import { Routes, Route, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Target, Upload, Sparkles,
  Send, BarChart3, Settings, FileText, MessageSquare
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Leads from './pages/Leads'
import LeadsBoard from './pages/LeadsBoard'
import Import from './pages/Import'
import Enrichment from './pages/Enrichment'
import Outreach from './pages/Outreach'
import OutreachHistory from './pages/OutreachHistory'
import Templates from './pages/Templates'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import SettingsPage from './pages/Settings'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/import', icon: Upload, label: 'Import Data' },
  { to: '/enrichment', icon: Sparkles, label: 'Enrichment' },
  { to: '/outreach', icon: Send, label: 'Outreach' },
  { to: '/templates', icon: FileText, label: 'Templates' },
  { to: '/campaigns', icon: MessageSquare, label: 'Campaigns' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Georgian Leads</h1>
          <p className="text-xs text-gray-500">B2B Platform</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/board" element={<LeadsBoard />} />
          <Route path="/import" element={<Import />} />
          <Route path="/enrichment" element={<Enrichment />} />
          <Route path="/outreach" element={<Outreach />} />
          <Route path="/outreach/history" element={<OutreachHistory />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
