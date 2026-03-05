import { NavLink, Route, Routes } from 'react-router-dom'
import { History, PlayCircle, Target } from 'lucide-react'
import RunStatus from './pages/RunStatus'
import Leads from './pages/Leads'
import OutreachHistory from './pages/OutreachHistory'

const navItems = [
  { to: '/', label: 'Run & Status', icon: PlayCircle },
  { to: '/leads', label: 'Leads', icon: Target },
  { to: '/outreach/history', label: 'Outreach History', icon: History },
]

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-6 px-4">
          <div className="text-lg font-bold tracking-tight text-blue-400">Georgian Leads</div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<RunStatus />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/outreach/history" element={<OutreachHistory />} />
        </Routes>
      </main>
    </div>
  )
}
