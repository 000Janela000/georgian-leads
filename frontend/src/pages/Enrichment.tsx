import { useState } from 'react'
import { api } from '../lib/api'

export default function Enrichment() {
  const [mode, setMode] = useState<'leads' | 'single' | 'batch'>('leads')
  const [limit, setLimit] = useState(10)
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      if (mode === 'single' && companyId) {
        const res = await api.enrichCompany(Number(companyId))
        setResult(res)
      } else {
        const res = await api.enrichBatch({ limit })
        setResult(res)
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const websitesFound = result?.results?.filter((r: any) => r.website_found).length || 0
  const socialFound = result?.results?.filter((r: any) => Object.keys(r.social_profiles || {}).length > 0).length || 0
  const highPriority = result?.results?.filter((r: any) => r.priority === 'high').length || 0

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Enrichment</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('leads')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'leads' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>Auto (Leads)</button>
          <button onClick={() => setMode('single')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'single' ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}>Single Company</button>
        </div>

        {mode === 'leads' && (
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-1">Limit (how many to enrich)</label>
            <input type="number" min={1} max={100} value={limit} onChange={e => setLimit(Number(e.target.value))} className="px-3 py-2 border rounded-lg text-sm w-32" />
          </div>
        )}

        {mode === 'single' && (
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-1">Company ID</label>
            <input type="text" value={companyId} onChange={e => setCompanyId(e.target.value)} placeholder="Enter company ID" className="px-3 py-2 border rounded-lg text-sm w-48" />
          </div>
        )}

        <button onClick={run} disabled={loading} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm font-medium">
          {loading ? 'Enriching...' : 'Start Enrichment'}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-medium text-green-800">Enrichment Complete</p>
              {result.total != null && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-green-700">
                  <span>Total processed: {result.total}</span>
                  <span>Successful: {result.successful}</span>
                  <span>Websites found: {websitesFound}</span>
                  <span>Social found: {socialFound}</span>
                  <span>High priority: {highPriority}</span>
                  <span>Failed: {result.failed}</span>
                </div>
              )}
            </div>

            {result.results && result.results.length > 0 && (
              <div className="p-4 bg-gray-50 border rounded-lg text-sm max-h-64 overflow-y-auto">
                <p className="font-medium text-gray-700 mb-2">Details</p>
                {result.results.map((r: any, i: number) => (
                  <div key={i} className="py-1 border-b border-gray-200 last:border-0 flex justify-between">
                    <span className="text-gray-600">#{r.company_id}</span>
                    <span className={`font-medium ${r.priority === 'high' ? 'text-red-600' : r.priority === 'medium' ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {r.priority}
                    </span>
                    <span className="text-gray-500">
                      {r.website_found ? 'has site' : 'no site'}
                      {Object.keys(r.social_profiles || {}).length > 0 ? ' + social' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
        <h3 className="font-medium text-purple-900 mb-2">What Gets Enriched (all free, no API keys)</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>Website detection via DNS + HTTP check (Georgian transliteration)</li>
          <li>Reportal.ge profile (directors, contact info, company category)</li>
          <li>Social media (Facebook, Instagram - direct URL checks)</li>
          <li>Priority scoring: no website + large company = HIGH priority lead</li>
        </ul>
      </div>
    </div>
  )
}
