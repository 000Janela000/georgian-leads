import { type ReactNode, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { Company } from '../lib/types'

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-200">{value ?? <span className="text-gray-600">—</span>}</dd>
    </div>
  )
}

export default function CompanyDetail() {
  const { id } = useParams()
  const [company, setCompany] = useState<Company | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getCompany(Number(id)).then(setCompany).catch(e => setError(getErrorMessage(e, 'Company not found')))
  }, [id])

  const updateField = async (field: string, value: unknown) => {
    if (!company) return
    setSaving(true)
    try {
      const updated = await api.updateCompany(company.id, { [field]: value })
      setCompany(updated)
      setError('')
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to save changes'))
    } finally {
      setSaving(false)
    }
  }

  const enrichCompany = async () => {
    if (!company) return
    setSaving(true)
    try {
      await api.enrichCompany(company.id)
      const refreshed = await api.getCompany(company.id)
      setCompany(refreshed)
      setError('')
    } catch (e) {
      setError(getErrorMessage(e, 'Enrichment failed'))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className="text-sm text-red-400">{error}</div>
  if (!company) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <button
          onClick={() => window.history.back()}
          className="mb-3 text-sm text-gray-500 hover:text-gray-300"
        >
          ← Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{company.name_en || company.name_ge}</h1>
            {company.name_ge && company.name_en && <p className="mt-0.5 text-sm text-gray-400">{company.name_ge}</p>}
          </div>
          <select
            value={company.lead_status || 'new'}
            onChange={e => updateField('lead_status', e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:outline-none"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="converted">Converted</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>
        {saving && <p className="mt-1 text-xs text-blue-400">Saving…</p>}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Company Info</h2>
          <dl className="grid grid-cols-2 gap-4">
            <FieldRow label="ID Code" value={company.identification_code} />
            <FieldRow label="Legal Form" value={company.legal_form} />
            <FieldRow label="Status" value={company.status} />
            <FieldRow label="Registered" value={company.registration_date} />
            <FieldRow label="Address" value={company.address} />
            <FieldRow label="Director" value={company.director_name} />
            <FieldRow label="Priority" value={company.priority} />
            <FieldRow label="Tags" value={company.tags?.join(', ')} />
          </dl>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Contact & Online</h2>
          <dl className="grid grid-cols-1 gap-4">
            <FieldRow label="Phone" value={company.phone} />
            <FieldRow label="Email" value={company.email} />
            <FieldRow label="Website" value={company.website_url
              ? <a href={company.website_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{company.website_url}</a>
              : `Status: ${company.website_status || 'unknown'}`}
            />
            <FieldRow label="Facebook" value={company.facebook_url} />
            <FieldRow label="Instagram" value={company.instagram_url} />
          </dl>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Financial Data</h2>
          <dl className="grid grid-cols-2 gap-4">
            <FieldRow label="Revenue" value={company.revenue_gel ? `${company.revenue_gel.toLocaleString()} GEL` : null} />
            <FieldRow label="Total Assets" value={company.total_assets_gel ? `${company.total_assets_gel.toLocaleString()} GEL` : null} />
            <FieldRow label="Revenue Type" value={company.revenue_type} />
            <FieldRow label="Source" value={company.source} />
          </dl>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Notes</h2>
          <textarea
            className="w-full resize-none rounded border border-gray-700 bg-gray-800 p-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none"
            rows={5}
            value={company.notes || ''}
            onChange={e => setCompany({ ...company, notes: e.target.value })}
            onBlur={e => updateField('notes', e.target.value)}
            placeholder="Add notes about this company…"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={enrichCompany}
          disabled={saving}
          className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-60"
        >
          Re-enrich
        </button>
      </div>
    </div>
  )
}
