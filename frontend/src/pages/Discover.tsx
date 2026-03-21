import { useEffect, useState } from 'react'
import { Search, Save, Loader2, Play } from 'lucide-react'
import { api } from '../lib/api'
import type { DiscoverResult, Category } from '../lib/types'

export default function Discover() {
  const [cities, setCities] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [results, setResults] = useState<DiscoverResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ saved: number; skipped_existing: number } | null>(null)
  const [error, setError] = useState('')

  // Sweep state
  const [sweepCities, setSweepCities] = useState<Set<string>>(new Set())
  const [sweepCategories, setSweepCategories] = useState<Set<string>>(new Set())
  const [sweepStatus, setSweepStatus] = useState<{ status: string; progress: string; saved: number; error: string }>({
    status: 'idle', progress: '', saved: 0, error: '',
  })
  const [sweepPolling, setSweepPolling] = useState(false)

  useEffect(() => {
    api.getCities().then((c) => { setCities(c); if (c.length) setCity(c[0]) })
    api.getCategories().then((c: Category[]) => { setCategories(c); if (c.length) setCategory(c[0].key) })
  }, [])

  // Poll sweep status
  useEffect(() => {
    if (!sweepPolling) return
    const interval = setInterval(async () => {
      const s = await api.getSweepStatus()
      setSweepStatus(s)
      if (s.status === 'done' || s.status === 'error' || s.status === 'idle') {
        setSweepPolling(false)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [sweepPolling])

  const handleSearch = async () => {
    setSearching(true)
    setError('')
    setSaveResult(null)
    try {
      const data = await api.searchPlaces({ city, category })
      setResults(data.results)
      // Pre-select businesses without websites
      const noWebsite = new Set(data.results.filter((r: DiscoverResult) => !r.has_website).map((r: DiscoverResult) => r.google_place_id))
      setSelected(noWebsite)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSave = async () => {
    const toSave = results.filter((r) => selected.has(r.google_place_id))
    if (!toSave.length) return
    setSaving(true)
    try {
      const result = await api.saveLeads(toSave)
      setSaveResult(result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const toggleSweepCity = (c: string) => {
    const next = new Set(sweepCities)
    next.has(c) ? next.delete(c) : next.add(c)
    setSweepCities(next)
  }

  const toggleSweepCategory = (c: string) => {
    const next = new Set(sweepCategories)
    next.has(c) ? next.delete(c) : next.add(c)
    setSweepCategories(next)
  }

  const handleSweep = async () => {
    try {
      await api.startSweep([...sweepCities], [...sweepCategories])
      setSweepPolling(true)
      setSweepStatus({ status: 'running', progress: 'Starting...', saved: 0, error: '' })
    } catch (e: any) {
      setError(e.message)
    }
  }

  const noWebsiteCount = results.filter((r) => !r.has_website).length

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Discover Leads</h1>

      {/* Search section */}
      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Search Google Maps</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
              {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-950 p-3 text-sm text-red-400">{error}</div>}

      {/* Results */}
      {results.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div className="text-sm text-gray-400">
              Found <span className="font-medium text-white">{results.length}</span> businesses
              {noWebsiteCount > 0 && <> — <span className="font-medium text-green-400">{noWebsiteCount} without website</span></>}
            </div>
            <div className="flex items-center gap-3">
              {saveResult && (
                <span className="text-xs text-green-400">
                  Saved {saveResult.saved}, {saveResult.skipped_existing} already existed
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || selected.size === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save {selected.size} Leads
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
                <th className="px-4 py-2 w-8"></th>
                <th className="px-4 py-2">Business</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Reviews</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Website</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.google_place_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.google_place_id)}
                      onChange={() => toggleSelect(r.google_place_id)}
                      disabled={r.has_website}
                      className="rounded border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-white">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.address}</div>
                  </td>
                  <td className="px-4 py-2 text-yellow-400">{r.google_rating ? `${r.google_rating}` : '—'}</td>
                  <td className="px-4 py-2 text-gray-300">{r.google_review_count}</td>
                  <td className="px-4 py-2 text-gray-300">{r.phone || '—'}</td>
                  <td className="px-4 py-2">
                    {r.has_website ? (
                      <span className="rounded-full bg-green-900 px-2 py-0.5 text-xs text-green-400">Yes</span>
                    ) : (
                      <span className="rounded-full bg-red-900 px-2 py-0.5 text-xs text-red-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sweep section */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Bulk Sweep</h2>
        <p className="mb-3 text-xs text-gray-500">Search all categories across multiple cities at once.</p>

        <div className="mb-3">
          <label className="mb-1.5 block text-xs text-gray-500">Cities</label>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => toggleSweepCity(c)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  sweepCities.has(c) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-gray-500">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => toggleSweepCategory(c.key)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  sweepCategories.has(c.key) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSweep}
            disabled={sweepStatus.status === 'running' || sweepCities.size === 0 || sweepCategories.size === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {sweepStatus.status === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Start Sweep
          </button>
          {sweepStatus.status === 'running' && (
            <div className="text-sm text-gray-400">
              {sweepStatus.progress} — <span className="text-green-400">{sweepStatus.saved} saved</span>
            </div>
          )}
          {sweepStatus.status === 'done' && (
            <div className="text-sm text-green-400">Complete — {sweepStatus.saved} leads saved</div>
          )}
          {sweepStatus.status === 'error' && (
            <div className="text-sm text-red-400">{sweepStatus.error}</div>
          )}
        </div>
      </div>
    </div>
  )
}
