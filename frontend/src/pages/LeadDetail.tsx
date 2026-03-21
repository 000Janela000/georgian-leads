import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Facebook, Phone, Mail, Star, Trash2, RefreshCw, Flame, Thermometer, Snowflake, Loader2 } from 'lucide-react'
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

const TIER_CONFIG = {
  hot: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-900/50', label: 'Hot' },
  warm: { icon: Thermometer, color: 'text-yellow-400', bg: 'bg-yellow-900/50', label: 'Warm' },
  cold: { icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-900/50', label: 'Cold' },
}

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getLead(Number(id)).then((l) => { setLead(l); setNotes(l.notes || '') }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (!lead) return <div className="text-red-400">Lead not found</div>

  const tc = TIER_CONFIG[lead.reachability_tier]
  const TierIcon = tc.icon

  const handleStatusChange = async (status: string) => {
    const updated = await api.updateLeadStatus(lead.id, status)
    setLead(updated)
  }

  const handleEnrich = async () => {
    setEnriching(true)
    try {
      const updated = await api.enrichLead(lead.id)
      setLead(updated)
    } finally {
      setEnriching(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this lead?')) return
    await api.deleteLead(lead.id)
    navigate('/leads')
  }

  const handleNotesBlur = async () => {
    if (notes === (lead.notes || '')) return
    setSaving(true)
    const updated = await api.updateLead(lead.id, { notes })
    setLead(updated)
    setSaving(false)
  }

  return (
    <div>
      <button onClick={() => navigate('/leads')} className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={14} /> Back to Leads
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
            {lead.city && <span>{lead.city}</span>}
            {lead.address && <span>{lead.address}</span>}
          </div>
          <div className="mt-2 flex items-center gap-3">
            {lead.category && <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">{lead.category}</span>}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${tc.bg} ${tc.color}`}>
              <TierIcon size={10} /> {tc.label}
            </span>
            {lead.google_rating && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Star size={11} className="text-yellow-400" /> {lead.google_rating} ({lead.google_review_count} reviews)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lead.lead_status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white"
          >
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Contact section */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-300">Contact</h2>
          <div className="space-y-3">
            {/* Facebook */}
            <div className="flex items-center gap-3">
              <Facebook size={16} className={lead.facebook_url ? 'text-blue-400' : 'text-gray-700'} />
              {lead.facebook_url ? (
                <div>
                  <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                    Facebook Page
                  </a>
                  {lead.facebook_followers && (
                    <div className="text-xs text-gray-500">{lead.facebook_followers.toLocaleString()} followers</div>
                  )}
                  {lead.facebook_last_post_date && (
                    <div className="text-xs text-gray-500">Last post: {lead.facebook_last_post_date}</div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-600">No Facebook page found</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <Phone size={16} className={lead.phone ? 'text-green-400' : 'text-gray-700'} />
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="text-sm text-green-400 hover:underline">{lead.phone}</a>
              ) : (
                <span className="text-sm text-gray-600">No phone</span>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail size={16} className={lead.email ? 'text-purple-400' : 'text-gray-700'} />
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-sm text-purple-400 hover:underline">{lead.email}</a>
              ) : (
                <span className="text-sm text-gray-600">No email</span>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {enriching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Find Facebook
            </button>
          </div>
        </div>

        {/* Notes section */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Notes</h2>
            {saving && <span className="text-xs text-gray-500">Saving...</span>}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes about this lead..."
            className="h-40 w-full resize-none rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600"
          />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950"
        >
          <Trash2 size={12} /> Delete Lead
        </button>
      </div>
    </div>
  )
}
