import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { ContactBadge, LeadCompany, RevenueType } from '../lib/types'

const badgeStyles: Record<ContactBadge, string> = {
  never_contacted: 'border border-gray-700 bg-gray-800 text-gray-300',
  tried: 'border border-amber-700 bg-amber-900/50 text-amber-300',
  contacted_recently: 'border border-blue-700 bg-blue-900/50 text-blue-300',
}

const revenueStyles: Record<RevenueType, string> = {
  exact: 'border border-green-700 bg-green-900/50 text-green-300',
  estimated: 'border border-yellow-700 bg-yellow-900/50 text-yellow-300',
  unknown: 'border border-gray-700 bg-gray-800 text-gray-300',
}

export default function Leads() {
  const [items, setItems] = useState<LeadCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [socialOnly, setSocialOnly] = useState(false)
  const [revenueType, setRevenueType] = useState<'' | RevenueType>('')
  const [contactBadge, setContactBadge] = useState<'' | ContactBadge>('')
  const [includeRecent, setIncludeRecent] = useState(false)

  useEffect(() => {
    api.getLeads({
      limit: 300,
      social_active_only: socialOnly || undefined,
      revenue_type: revenueType || undefined,
      contact_badge: contactBadge || undefined,
      include_contacted_recently: includeRecent || undefined,
    })
      .then(data => {
        setItems(data)
        setError('')
      })
      .catch(fetchError => setError(getErrorMessage(fetchError, 'Failed to load leads')))
      .finally(() => setLoading(false))
  }, [socialOnly, revenueType, contactBadge, includeRecent])

  const totals = useMemo(() => {
    return {
      total: items.length,
      socialActive: items.filter(i => i.social_active).length,
      fullWebsite: items.filter(i => i.offer_lane === 'full_website').length,
      landingPage: items.filter(i => i.offer_lane === 'landing_page').length,
    }
  }, [items])

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="text-xl font-bold">No-Website Leads</h1>
        <p className="mt-1 text-sm text-gray-400">Prioritized by score with social and revenue signals.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total Leads" value={totals.total} />
        <StatCard label="Social Active" value={totals.socialActive} />
        <StatCard label="Full Website Lane" value={totals.fullWebsite} />
        <StatCard label="Landing Page Lane" value={totals.landingPage} />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={socialOnly} onChange={e => setSocialOnly(e.target.checked)} />
            Social active only
          </label>
          <label className="text-sm text-gray-300">
            Revenue type
            <select
              value={revenueType}
              onChange={e => setRevenueType(e.target.value as '' | RevenueType)}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100"
            >
              <option value="">Any</option>
              <option value="exact">Exact</option>
              <option value="estimated">Estimated</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="text-sm text-gray-300">
            Contact badge
            <select
              value={contactBadge}
              onChange={e => {
                const nextBadge = e.target.value as '' | ContactBadge
                setContactBadge(nextBadge)
                if (nextBadge === 'contacted_recently') {
                  setIncludeRecent(true)
                }
              }}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100"
            >
              <option value="">Any</option>
              <option value="never_contacted">Never Contacted</option>
              <option value="tried">Tried</option>
              <option value="contacted_recently">Contacted Recently</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={includeRecent} onChange={e => setIncludeRecent(e.target.checked)} />
            Include contacted recently
          </label>
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-left text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Social</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Offer Lane</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Sources</th>
            </tr>
          </thead>
          <tbody>
            {items.map(lead => (
              <tr key={lead.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-100">{lead.name_en || lead.name_ge || `Company ${lead.id}`}</div>
                  <div className="text-xs text-gray-500">{lead.identification_code || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  {lead.social_active ? (
                    <span className="rounded-full border border-green-700 bg-green-900/60 px-2 py-0.5 text-xs font-medium text-green-300">active</span>
                  ) : (
                    <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-400">none</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-200">
                  <div>{lead.revenue_gel ? `${lead.revenue_gel.toLocaleString()} GEL` : '-'}</div>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${revenueStyles[lead.revenue_type]}`}>
                    {lead.revenue_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-100">{lead.score}</td>
                <td className="px-4 py-3 text-gray-200">{lead.offer_lane === 'full_website' ? 'Full Website' : 'Landing Page'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[lead.contact_badge]}`}>
                    {lead.contact_badge.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(lead.source_meta || {}).slice(0, 3).map(([key, meta]) => (
                      <span key={key} className="rounded border border-blue-700 bg-blue-900/40 px-1.5 py-0.5 text-xs text-blue-300">
                        {key}:{meta?.source || 'n/a'}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                  No leads found for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-100">{value}</div>
    </div>
  )
}
