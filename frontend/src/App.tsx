import { NavLink, Route, Routes } from 'react-router-dom'
import { FileText, LayoutDashboard, Mail, Search, Settings, Users } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import FindLeads from './pages/FindLeads'
import Leads from './pages/Leads'
import Campaigns from './pages/Campaigns'
import Templates from './pages/Templates'
import SettingsPage from './pages/Settings'
import CompanyDetail from './pages/CompanyDetail'

function SideNavLink({ to, label, icon: Icon, end }: { to: string; label: string; icon: React.ElementType; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
        }`
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="flex w-52 shrink-0 flex-col border-r border-gray-800 bg-gray-900 px-3 py-4">
        <div className="mb-5 px-1 text-base font-bold tracking-tight text-blue-400">Canvass</div>
        <nav className="flex flex-1 flex-col gap-0.5">
          <SideNavLink to="/" label="Dashboard" icon={LayoutDashboard} end />
          <SideNavLink to="/find" label="Find Leads" icon={Search} />
          <SideNavLink to="/leads" label="My Leads" icon={Users} />
          <SideNavLink to="/campaigns" label="Campaigns" icon={Mail} />
          <div className="flex-1" />
          <div className="mt-3 border-t border-gray-800 pt-3 flex flex-col gap-0.5">
            <SideNavLink to="/templates" label="Templates" icon={FileText} />
            <SideNavLink to="/settings" label="Settings" icon={Settings} />
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/find" element={<FindLeads />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/companies/:id" element={<CompanyDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
