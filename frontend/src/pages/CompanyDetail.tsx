import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function CompanyDetail() {
  const { id } = useParams()
  const [company, setCompany] = useState<any>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) api.getCompany(Number(id)).then(setCompany).catch(() => setError('Company not found'))
  }, [id])

  const updateField = async (field: string, value: any) => {
    if (!company) return
    setSaving(true)
    try {
      const updated = await api.updateCompany(company.id, { [field]: value })
      setCompany(updated)
    } catch { }
    setSaving(false)
  }

  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!company) return <div className="p-8 text-gray-500">Loading...</div>

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value || '-'}</dd>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/companies" className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Companies</Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name_en || company.name_ka}</h1>
          {company.name_ka && company.name_en && <p className="text-gray-500">{company.name_ka}</p>}
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
            <Field label="ID Code" value={company.identification_code} />
            <Field label="Legal Form" value={company.legal_form} />
            <Field label="Status" value={company.status} />
            <Field label="Registered" value={company.registration_date} />
            <Field label="Address" value={company.address} />
            <Field label="Director" value={company.director_name} />
            <Field label="Priority" value={company.priority} />
            <Field label="Tags" value={company.tags} />
          </dl>
        </div>

        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Online Presence</h2>
          <dl className="grid grid-cols-1 gap-4">
            <Field label="Website" value={company.website_url ? <a href={company.website_url} target="_blank" className="text-blue-600 hover:underline">{company.website_url}</a> : `Status: ${company.website_status || 'unknown'}`} />
            <Field label="Facebook" value={company.facebook_url} />
            <Field label="Instagram" value={company.instagram_url} />
            <Field label="LinkedIn" value={company.linkedin_url} />
          </dl>
        </div>

        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Financial Data</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Revenue" value={company.revenue ? `${company.revenue.toLocaleString()} GEL` : null} />
            <Field label="Total Assets" value={company.total_assets ? `${company.total_assets.toLocaleString()} GEL` : null} />
            <Field label="Profit" value={company.profit ? `${company.profit.toLocaleString()} GEL` : null} />
            <Field label="Financial Year" value={company.financial_year} />
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
          onClick={() => api.enrichCompany(company.id).then(setCompany).catch(() => {})}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
        >
          Enrich Company
        </button>
      </div>
    </div>
  )
}
