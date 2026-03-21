import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Phone, Mail, Flame, Thermometer, Snowflake, Star } from 'lucide-react'
import { api } from '../lib/api'
import type { Lead, LeadStatus } from '../lib/types'

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'messaged', label: 'Messaged' },
  { value: 'replied', label: 'Replied' },
  { value: 'interested', label: 'Interested' },
  { value: 'won', label: 'Won' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'no_response', label: 'No response' },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-700 text-gray-300',
  messaged: 'bg-blue-900 text-blue-300',
  replied: 'bg-purple-900 text-purple-300',
  interested: 'bg-yellow-900 text-yellow-300',
  won: 'bg-green-900 text-green-300',
  not_interested: 'bg-red-900 text-red-300',
  no_response: 'bg-gray-800 text-gray-500',
}

const TIER_CONFIG = {
  hot: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-900/50', label: 'Hot' },
  warm: { icon: Thermometer, color: 'text-yellow-400', bg: 'bg-yellow-900/50', label: 'Warm' },
  cold: { icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-900/50', label: 'Cold' },
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [tier, setTier] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [cities, setCities] = useState<string[]>([])

  // Stats for tier summary
  const [tierCounts, setTierCounts] = useState({ hot: 0, warm: 0, cold: 0 })

  useEffect(() => {
    api.getCities().then(setCities)
    api.getStats().then((s) => setTierCounts(s.leads_by_tier))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: any = { sort_by: 'google_review_count', sort_order: 'desc', limit: 200 }
    if (city) params.city = city
    if (tier) params.reachability_tier = tier
    if (status) params.lead_status = status
    if (search) params.search = search
    api.listLeads(params).then(setLeads).finally(() => setLoading(false))
  }, [city, tier, status, search])

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    await api.updateLeadStatus(leadId, newStatus)
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus as LeadStatus } : l)))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Leads</h1>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-orange-400"><Flame size={12} /> {tierCounts.hot} Hot</span>
          <span className="flex items-center gap-1 text-yellow-400"><Thermometer size={12} /> {tierCounts.warm} Warm</span>
          <span className="flex items-center gap-1 text-blue-400"><Snowflake size={12} /> {tierCounts.cold} Cold</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white">
          <option value="">All Tiers</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-white placeholder-gray-500"
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">No leads found. Try adjusting filters or discover new leads.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs text-gray-500">
                <th className="px-3 py-2">Business</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Rating</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const tc = TIER_CONFIG[lead.reachability_tier]
                const TierIcon = tc.icon
                return (
                  <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-3 py-2.5">
                      <Link to={`/leads/${lead.id}`} className="font-medium text-white hover:text-blue-400">{lead.name}</Link>
                      <div className="text-xs text-gray-500">{lead.city}{lead.address ? ` — ${lead.address}` : ''}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      {lead.category && <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{lead.category}</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400" />
                        <span className="text-white">{lead.google_rating || '—'}</span>
                        <span className="text-gray-500">({lead.google_review_count})</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {lead.facebook_url ? (
                          <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Facebook size={14} className="text-blue-400 hover:text-blue-300" />
                          </a>
                        ) : (
                          <Facebook size={14} className="text-gray-700" />
                        )}
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}>
                            <Phone size={14} className="text-green-400 hover:text-green-300" />
                          </a>
                        ) : (
                          <Phone size={14} className="text-gray-700" />
                        )}
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}>
                            <Mail size={14} className="text-purple-400 hover:text-purple-300" />
                          </a>
                        ) : (
                          <Mail size={14} className="text-gray-700" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${tc.bg} ${tc.color}`}>
                        <TierIcon size={10} />
                        {tc.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={lead.lead_status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${STATUS_COLORS[lead.lead_status] || 'bg-gray-700 text-gray-300'}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
