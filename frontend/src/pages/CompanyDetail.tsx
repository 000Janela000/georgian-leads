import { type ReactNode, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { Company } from '../lib/types'

interface FieldRowProps {
  label: string
  value: ReactNode
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value ?? '-'}</dd>
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

    api.getCompany(Number(id)).then(setCompany).catch(fetchError => {
      setError(getErrorMessage(fetchError, 'Company not found'))
    })
  }, [id])

  const updateField = async (field: string, value: unknown) => {
    if (!company) return
    setSaving(true)
    try {
      const updated = await api.updateCompany(company.id, { [field]: value })
      setCompany(updated)
      setError('')
    } catch (updateError) {
      setError(getErrorMessage(updateError, 'Failed to save changes'))
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
    } catch (enrichError) {
      setError(getErrorMessage(enrichError, 'Enrichment failed'))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!company) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/companies" className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Companies</Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name_en || company.name_ge}</h1>
          {company.name_ge && company.name_en && <p className="text-gray-500">{company.name_ge}</p>}
        </div>
        <select
          value={company.lead_status || 'new'}
          onChange={e => updateField('lead_status', e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="converted">Converted</option>
          <option value="not_interested">Not Interested</option>
        </select>
      </div>

      {saving && <p className="text-xs text-blue-600 mb-2">Saving...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Company Info</h2>
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

        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Online Presence</h2>
          <dl className="grid grid-cols-1 gap-4">
            <FieldRow label="Website" value={company.website_url ? <a href={company.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{company.website_url}</a> : `Status: ${company.website_status || 'unknown'}`} />
            <FieldRow label="Facebook" value={company.facebook_url} />
            <FieldRow label="Instagram" value={company.instagram_url} />
            <FieldRow label="LinkedIn" value={company.linkedin_url} />
          </dl>
        </div>

        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Financial Data</h2>
          <dl className="grid grid-cols-2 gap-4">
            <FieldRow label="Revenue" value={company.revenue_gel ? `${company.revenue_gel.toLocaleString()} GEL` : null} />
            <FieldRow label="Total Assets" value={company.total_assets_gel ? `${company.total_assets_gel.toLocaleString()} GEL` : null} />
            <FieldRow label="Profit" value={company.profit_gel ? `${company.profit_gel.toLocaleString()} GEL` : null} />
            <FieldRow label="Financial Year" value={company.financial_year} />
          </dl>
        </div>

        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Notes</h2>
          <textarea
            className="w-full border rounded-lg p-3 text-sm h-32 resize-none"
            value={company.notes || ''}
            onChange={e => setCompany({ ...company, notes: e.target.value })}
            onBlur={e => updateField('notes', e.target.value)}
            placeholder="Add notes about this company..."
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={enrichCompany}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
        >
          Enrich Company
        </button>
      </div>
    </div>
  )
}
