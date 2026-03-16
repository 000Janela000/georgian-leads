import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { ContactBadge, LeadCompany } from '../lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  hotel: 'Hotel',
  clinic: 'Clinic',
  salon: 'Salon',
  gym: 'Gym',
  car_repair: 'Auto repair',
  pharmacy: 'Pharmacy',
  estate_agent: 'Real estate',
  lawyer: 'Law office',
}

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: 'bg-orange-900/60 border-orange-700 text-orange-300',
  hotel: 'bg-purple-900/60 border-purple-700 text-purple-300',
  clinic: 'bg-blue-900/60 border-blue-700 text-blue-300',
  salon: 'bg-pink-900/60 border-pink-700 text-pink-300',
  gym: 'bg-green-900/60 border-green-700 text-green-300',
  car_repair: 'bg-yellow-900/60 border-yellow-700 text-yellow-300',
  pharmacy: 'bg-teal-900/60 border-teal-700 text-teal-300',
  estate_agent: 'bg-indigo-900/60 border-indigo-700 text-indigo-300',
  lawyer: 'bg-gray-800 border-gray-600 text-gray-300',
}

const REV_CAT_COLORS: Record<string, string> = {
  I: 'bg-green-900/60 border-green-700 text-green-300',
  II: 'bg-blue-900/60 border-blue-700 text-blue-300',
  III: 'bg-yellow-900/60 border-yellow-700 text-yellow-300',
  IV: 'bg-gray-800 border-gray-700 text-gray-400',
}

function Badge({ lead }: { lead: LeadCompany }) {
  const cat = (lead as unknown as { category?: string | null }).category
  if (cat && CATEGORY_LABELS[cat]) {
    const color = CATEGORY_COLORS[cat] ?? 'bg-gray-800 border-gray-700 text-gray-400'
    return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>{CATEGORY_LABELS[cat]}</span>
  }
  const data = lead.financial_data_json
  const revCat = typeof data?.category === 'string' ? data.category.toUpperCase() : ''
  if (revCat) {
    const color = REV_CAT_COLORS[revCat] ?? 'bg-gray-800 border-gray-700 text-gray-400'
    return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>Cat {revCat}</span>
  }
  return <span className="text-gray-600 text-xs">—</span>
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}
      className="ml-1.5 rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-700 hover:text-gray-300"
    >
      {copied ? '✓' : 'copy'}
    </button>
  )
}

export default function Leads() {
  const [items, setItems] = useState<LeadCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [hasPhone, setHasPhone] = useState<'' | 'true' | 'false'>('')
  const [hasEmail, setHasEmail] = useState<'' | 'true' | 'false'>('')
  const [contactBadge, setContactBadge] = useState<'' | ContactBadge>('')
  const [source, setSource] = useState<'all' | 'local' | 'registry'>('all')
  const [includeRecent, setIncludeRecent] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getLeads({
      limit: 500,
      has_phone: hasPhone || undefined,
      has_email: hasEmail || undefined,
      contact_badge: contactBadge || undefined,
      include_contacted_recently: includeRecent || undefined,
      source,
    })
      .then(data => { setItems(data); setError('') })
      .catch(e => setError(getErrorMessage(e, 'Failed to load leads')))
      .finally(() => setLoading(false))
  }, [hasPhone, hasEmail, contactBadge, includeRecent, source])

  const withPhone = items.filter(i => i.phone).length
  const withEmail = items.filter(i => i.email).length

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Leads</h1>
          <p className="mt-0.5 text-sm text-gray-400">Saved businesses without websites</p>
        </div>
        <div className="flex gap-3 text-sm text-gray-400">
          <span><span className="font-semibold text-white">{items.length}</span> leads</span>
          <span><span className="font-semibold text-green-400">{withPhone}</span> with phone</span>
          <span><span className="font-semibold text-blue-400">{withEmail}</span> with email</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
        <label className="text-sm text-gray-300">
          Source
          <select value={source} onChange={e => setSource(e.target.value as typeof source)}
            className="ml-2 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100">
            <option value="all">All</option>
            <option value="local">Local businesses</option>
            <option value="registry">Registry only</option>
          </select>
        </label>
        <label className="text-sm text-gray-300">
          Phone
          <select value={hasPhone} onChange={e => setHasPhone(e.target.value as '' | 'true' | 'false')}
            className="ml-2 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100">
            <option value="">Any</option>
            <option value="true">Has phone</option>
            <option value="false">No phone</option>
          </select>
        </label>
        <label className="text-sm text-gray-300">
          Email
          <select value={hasEmail} onChange={e => setHasEmail(e.target.value as '' | 'true' | 'false')}
            className="ml-2 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100">
            <option value="">Any</option>
            <option value="true">Has email</option>
            <option value="false">No email</option>
          </select>
        </label>
        <label className="text-sm text-gray-300">
          Status
          <select value={contactBadge} onChange={e => { const v = e.target.value as '' | ContactBadge; setContactBadge(v); if (v === 'contacted_recently') setIncludeRecent(true) }}
            className="ml-2 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100">
            <option value="">Any</option>
            <option value="never_contacted">Never contacted</option>
            <option value="tried">Tried</option>
            <option value="contacted_recently">Recently contacted</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-400">
          <input type="checkbox" checked={includeRecent} onChange={e => setIncludeRecent(e.target.checked)} />
          Include recently contacted
        </label>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-4 py-2.5">Business</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(lead => (
                <tr key={lead.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3">
                    <Link to={`/companies/${lead.id}`} className="font-medium text-gray-100 hover:text-blue-400">
                      {lead.name_en || lead.name_ge || `#${lead.id}`}
                    </Link>
                    {lead.address && <div className="mt-0.5 text-xs text-gray-500 truncate max-w-xs">{lead.address}</div>}
                  </td>
                  <td className="px-4 py-3"><Badge lead={lead} /></td>
                  <td className="px-4 py-3">
                    {lead.phone
                      ? <div className="flex items-center text-green-300 font-mono text-xs">{lead.phone}<CopyBtn value={lead.phone} /></div>
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.email
                      ? <div className="flex items-center text-blue-300 font-mono text-xs">{lead.email}<CopyBtn value={lead.email} /></div>
                      : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${
                      lead.contact_badge === 'never_contacted' ? 'border-gray-700 bg-gray-800 text-gray-400'
                      : lead.contact_badge === 'tried' ? 'border-amber-700 bg-amber-900/50 text-amber-300'
                      : 'border-blue-700 bg-blue-900/50 text-blue-300'
                    }`}>
                      {lead.contact_badge.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">No leads match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
