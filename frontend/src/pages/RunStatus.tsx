import { useEffect, useMemo, useState } from 'react'
import { PlayCircle, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { PipelineRun } from '../lib/types'

type CounterRecord = Record<string, unknown>

function asRecord(value: unknown): CounterRecord {
  return typeof value === 'object' && value !== null ? (value as CounterRecord) : {}
}

export default function RunStatus() {
  const [run, setRun] = useState<PipelineRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const isRunning = run?.status === 'running' || run?.status === 'queued'

  const loadLatest = async () => {
    try {
      const latest = await api.getLatestPipelineRun()
      setRun(latest)
      setError('')
    } catch (fetchError) {
      const message = getErrorMessage(fetchError, 'Failed to load latest run')
      if (message.toLowerCase().includes('no pipeline runs yet')) {
        setRun(null)
        setError('')
        return
      }
      setError(message)
    }
  }

  useEffect(() => {
    loadLatest().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!run?.id || !isRunning) return

    const timer = setInterval(() => {
      api.getPipelineRun(run.id)
        .then(setRun)
        .catch(pollError => setError(getErrorMessage(pollError, 'Failed to poll run status')))
    }, 2000)

    return () => clearInterval(timer)
  }, [run?.id, isRunning])

  const counters = useMemo(() => asRecord(run?.counters_json), [run?.counters_json])
  const opensanctions = asRecord(counters.opensanctions)
  const tiGeorgia = asRecord(counters.ti_georgia)
  const enrichment = asRecord(counters.enrichment)
  const scoring = asRecord(counters.scoring)

  const handleRun = async () => {
    setStarting(true)
    setError('')
    try {
      const nextRun = await api.startPipelineRun(100)
      setRun(nextRun)
    } catch (runError) {
      setError(getErrorMessage(runError, 'Failed to start pipeline'))
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="mb-2 text-xl font-bold">Run Pipeline</h1>
        <p className="mb-4 text-sm text-gray-400">
          One click runs import, enrichment, website detection, social detection, and lead scoring.
        </p>
        <button
          onClick={handleRun}
          disabled={starting || isRunning}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting || isRunning ? <RefreshCw size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          {isRunning ? 'Pipeline Running...' : 'Run Pipeline'}
        </button>
      </div>

      {run && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Run #{run.id}</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                run.status === 'done'
                  ? 'border border-green-700 bg-green-900/60 text-green-300'
                  : run.status === 'error'
                    ? 'border border-red-700 bg-red-900/60 text-red-300'
                    : 'border border-blue-700 bg-blue-900/60 text-blue-300'
              }`}
            >
              {run.status}
            </span>
          </div>

          <div className="mb-2 text-sm text-gray-400">{run.current_step || 'Waiting...'}</div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full ${
                run.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${run.progress_pct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">{run.progress_pct}%</div>

          {run.error_text && (
            <div className="mt-3 rounded-lg border border-red-700 bg-red-900/40 px-3 py-2 text-sm text-red-300">
              {run.error_text}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <CounterCard
          title="OpenSanctions"
          lines={[
            `Imported: ${String(opensanctions.imported ?? 0)}`,
            `Updated: ${String(opensanctions.updated ?? 0)}`,
            `Skipped: ${String(opensanctions.skipped ?? 0)}`,
            `Ignored non-company: ${String(opensanctions.ignored_non_company ?? 0)}`,
          ]}
        />
        <CounterCard
          title="TI Georgia"
          lines={[
            `Imported: ${String(tiGeorgia.imported ?? 0)}`,
            `Updated: ${String(tiGeorgia.updated ?? 0)}`,
            `Skipped: ${String(tiGeorgia.skipped ?? 0)}`,
            `Source unavailable: ${String(Boolean(tiGeorgia.source_unavailable ?? false))}`,
          ]}
        />
        <CounterCard
          title="Enrichment"
          lines={[
            `Targeted: ${String(enrichment.targeted ?? 0)}`,
            `Successful: ${String(enrichment.successful ?? 0)}`,
            `Failed: ${String(enrichment.failed ?? 0)}`,
          ]}
        />
        <CounterCard
          title="Scoring"
          lines={[
            `Scored: ${String(scoring.scored ?? 0)}`,
            `Full website: ${String(scoring.full_website ?? 0)}`,
            `Landing page: ${String(scoring.landing_page ?? 0)}`,
          ]}
        />
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  )
}

function CounterCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-200">{title}</h3>
      <div className="space-y-1 text-sm text-gray-400">
        {lines.map(line => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
}
