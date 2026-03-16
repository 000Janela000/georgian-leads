import { useEffect, useRef, useState } from 'react'
import { MapPin, RefreshCw, Search } from 'lucide-react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'

interface Category { key: string; label: string }
interface SearchResult {
  source_id: string
  name_en?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  category?: string | null
  user_rating_count?: number
}

const PRESET_CITIES = ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori']

const SWEEP_CATEGORIES = [
  { key: 'restaurant', label: 'Restaurants & cafes', default: true },
  { key: 'salon', label: 'Salons & beauty', default: true },
  { key: 'car_repair', label: 'Auto repair', default: true },
  { key: 'clinic', label: 'Clinics & dentists', default: true },
  { key: 'gym', label: 'Gyms', default: false },
  { key: 'pharmacy', label: 'Pharmacies', default: false },
  { key: 'hotel', label: 'Hotels', default: false },
  { key: 'estate_agent', label: 'Real estate', default: false },
  { key: 'lawyer', label: 'Law offices', default: false },
]

type SweepStatus = { status: string; progress: string; saved: number; error: string }

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }}
      className="ml-1 rounded px-1 py-0.5 text-xs text-gray-500 hover:bg-gray-700 hover:text-gray-300"
    >
      {copied ? '✓' : 'copy'}
    </button>
  )
}

export default function FindLeads() {
  const [categories, setCategories] = useState<Category[]>([])

  // Manual search state
  const [searchCategory, setSearchCategory] = useState('')
  const [city, setCity] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  // Sweep state
  const [sweepCities, setSweepCities] = useState<string[]>(['Tbilisi', 'Batumi'])
  const [sweepCategories, setSweepCategories] = useState<string[]>(
    SWEEP_CATEGORIES.filter(c => c.default).map(c => c.key)
  )
  const [sweep, setSweep] = useState<SweepStatus>({ status: 'idle', progress: '', saved: 0, error: '' })
  const [sweepError, setSweepError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {})
    api.getSweepStatus().then(setSweep).catch(() => {})
  }, [])

  useEffect(() => {
    if (sweep.status === 'running') {
      pollRef.current = setInterval(() => { api.getSweepStatus().then(setSweep).catch(() => {}) }, 2000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [sweep.status])

  const handleSearch = async () => {
    if (!searchCategory || !city.trim()) return
    setSearching(true); setSearchError(''); setResults([]); setSelected(new Set()); setSavedMsg('')
    try {
      const data = await api.searchLeads({ category: searchCategory, city: city.trim(), limit: 200 })
      setResults(data as unknown as SearchResult[])
    } catch (e) { setSearchError(getErrorMessage(e, 'Search failed')) }
    finally { setSearching(false) }
  }

  const toggleOne = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(results.map(r => r.source_id)) : new Set())

  const handleSave = async () => {
    const leads = results.filter(r => selected.has(r.source_id))
    if (!leads.length) return
    setSaving(true); setSearchError('')
    try {
      const res = await api.saveLeads({ leads })
      setSavedMsg(`Saved ${(res as { saved: number }).saved} new leads`)
      setSelected(new Set())
    } catch (e) { setSearchError(getErrorMessage(e, 'Failed to save')) }
    finally { setSaving(false) }
  }

  const handleSweep = async () => {
    if (!sweepCities.length || !sweepCategories.length) return
    setSweepError('')
    try {
      await api.sweepCities(sweepCities, sweepCategories)
      setSweep({ status: 'running', progress: 'Starting...', saved: 0, error: '' })
    } catch (e) { setSweepError(getErrorMessage(e, 'Failed to start sweep')) }
  }

  const isSweeping = sweep.status === 'running'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Find Leads</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Find businesses without websites. Search any city, or sweep preset cities in bulk.
        </p>
      </div>

      {/* Manual search */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Search size={14} /> Search any city
        </h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={searchCategory}
            onChange={e => setSearchCategory(e.target.value)}
            className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none"
          >
            <option value="">Category…</option>
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="City (e.g. Tbilisi, Berlin, Dubai)"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 min-w-40 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchCategory || !city.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
        {searchError && <p className="text-sm text-red-400">{searchError}</p>}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={selected.size === results.length} onChange={e => toggleAll(e.target.checked)} className="accent-blue-500" />
              Select all ({results.length})
              {selected.size > 0 && <span className="text-blue-400">{selected.size} selected</span>}
            </label>
            <div className="flex items-center gap-3">
              {savedMsg && <span className="text-sm text-green-400">{savedMsg}</span>}
              <button
                onClick={handleSave}
                disabled={saving || selected.size === 0}
                className="rounded-lg bg-green-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : `Save ${selected.size > 0 ? selected.size : ''} leads`}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-3 py-2.5 w-8"></th>
                  <th className="px-4 py-2.5">Business</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Address</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.source_id} className="border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer" onClick={() => toggleOne(r.source_id)}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selected.has(r.source_id)} onChange={() => toggleOne(r.source_id)} onClick={e => e.stopPropagation()} className="accent-blue-500" /></td>
                    <td className="px-4 py-3 font-medium text-gray-100">{r.name_en}</td>
                    <td className="px-4 py-3">
                      {r.phone ? <div className="flex items-center text-green-300 font-mono text-xs">{r.phone}<CopyBtn value={r.phone} /></div> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.email ? <div className="flex items-center text-blue-300 font-mono text-xs">{r.email}<CopyBtn value={r.email} /></div> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{r.address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* City sweep */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <MapPin size={14} className="text-green-400" /> Sweep cities
        </h2>
        <p className="text-xs text-gray-500">
          Automatically finds businesses without websites across preset cities and saves them all at once.
        </p>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-400">Cities</p>
          <div className="flex flex-wrap gap-3">
            {PRESET_CITIES.map(c => (
              <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={sweepCities.includes(c)} onChange={() => setSweepCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} disabled={isSweeping} className="accent-green-500" />
                <span className="text-sm text-gray-300">{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-400">Business types</p>
          <div className="flex flex-wrap gap-3">
            {SWEEP_CATEGORIES.map(c => (
              <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={sweepCategories.includes(c.key)} onChange={() => setSweepCategories(prev => prev.includes(c.key) ? prev.filter(x => x !== c.key) : [...prev, c.key])} disabled={isSweeping} className="accent-green-500" />
                <span className="text-sm text-gray-300">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSweep}
            disabled={isSweeping || !sweepCities.length || !sweepCategories.length}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSweeping ? <RefreshCw size={14} className="animate-spin" /> : <MapPin size={14} />}
            {isSweeping ? 'Sweeping…' : 'Sweep Cities'}
          </button>
          {isSweeping && <span className="text-xs text-gray-400">{sweep.progress}</span>}
          {sweep.status === 'done' && <span className="text-xs text-green-400">Done — {sweep.saved} new leads saved</span>}
          {sweep.status === 'error' && <span className="text-xs text-red-400">{sweep.error || 'Sweep failed'}</span>}
        </div>
        {sweepError && <p className="text-sm text-red-400">{sweepError}</p>}
      </div>
    </div>
  )
}
