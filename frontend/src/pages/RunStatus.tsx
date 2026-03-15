import { useEffect, useMemo, useState } from 'react'
import { PlayCircle, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { PipelineRun } from '../lib/types'

type CounterRecord = Record<string, unknown>

function asRecord(value: unknown): CounterRecord {
  return typeof value === 'object' && value !== null ? (value as CounterRecord) : {}
}

function formatStep(step: string | null | undefined): string {
  if (!step) return 'Waiting...'
  if (step === 'Queued') return 'Queued, starting soon...'
  if (step === 'Starting pipeline') return 'Starting up...'
  if (step.startsWith('Importing OpenSanctions'))
    return step.replace('Importing OpenSanctions registry', 'Downloading company registry')
  if (step.startsWith('Skipping registry')) return 'Registry import skipped'
  if (step.startsWith('Importing TI Georgia')) return 'Importing TI Georgia data...'
  if (step.startsWith('Skipping TI Georgia')) return 'TI Georgia import skipped'
  if (step.startsWith('Enriching companies'))
    return step.replace('Enriching companies', 'Finding websites & social profiles')
  if (step.startsWith('Skipping enrichment')) return 'Website & social discovery skipped'
  if (step.startsWith('Scoring leads'))
    return step.replace('Scoring leads and offer lanes', 'Scoring & prioritizing leads')
  if (step.startsWith('Skipping scoring')) return 'Lead scoring skipped'
  if (step === 'Pipeline complete') return 'All done!'
  if (step === 'Pipeline failed') return 'Pipeline failed'
  return step
}

const ALL_STEPS = ['opensanctions', 'ti_georgia', 'enrichment', 'scoring'] as const
type StepKey = (typeof ALL_STEPS)[number]

const STEP_CONFIG: Record<StepKey, { label: string; hint: string }> = {
  opensanctions: {
    label: 'Import company registry (OpenSanctions)',
    hint: '~2 min · downloads & merges ~300k Georgian companies',
  },
  ti_georgia: {
    label: 'Import TI Georgia registry',
    hint: '~1 min · cross-references Transparency International data',
  },
  enrichment: {
    label: 'Find websites & social profiles',
    hint: 'Searches the web for each company\'s online presence',
  },
  scoring: {
    label: 'Score & prioritize leads',
    hint: 'Fast · ranks all enriched companies by opportunity score',
  },
}

export default function RunStatus() {
  const [run, setRun] = useState<PipelineRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [skipSteps, setSkipSteps] = useState<string[]>([])
  const [enrichLimit, setEnrichLimit] = useState(100)

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
      api
        .getPipelineRun(run.id)
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

  const toggleStep = (step: string, enabled: boolean) => {
    setSkipSteps(prev =>
      enabled ? prev.filter(s => s !== step) : [...prev.filter(s => s !== step), step],
    )
  }

  const handleRun = async () => {
    setStarting(true)
    setError('')
    try {
      const nextRun = await api.startPipelineRun(enrichLimit, skipSteps)
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

  const allSkipped = skipSteps.length === ALL_STEPS.length
  const skippingImports =
    skipSteps.includes('opensanctions') && skipSteps.includes('ti_georgia')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="mb-1 text-xl font-bold">Run Pipeline</h1>
        <p className="mb-4 text-sm text-gray-400">
          Choose which steps to run. On first run, keep all enabled. For subsequent runs, you can skip the slow imports and just re-enrich or re-score.
        </p>

        <div className="mb-4 divide-y divide-gray-800 rounded-lg border border-gray-800">
          {ALL_STEPS.map(key => {
            const cfg = STEP_CONFIG[key]
            const isChecked = !skipSteps.includes(key)
            return (
              <div key={key} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/30">
                <input
                  type="checkbox"
                  id={`step-${key}`}
                  className="mt-0.5 accent-blue-500"
                  checked={isChecked}
                  onChange={e => toggleStep(key, e.target.checked)}
                  disabled={isRunning}
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`step-${key}`}
                    className="block cursor-pointer text-sm font-medium text-gray-200"
                  >
                    {cfg.label}
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {key === 'enrichment' && isChecked ? (
                      <>
                        Up to{' '}
                        <input
                          type="number"
                          min={1}
                          max={5000}
                          value={enrichLimit}
                          onChange={e =>
                            setEnrichLimit(Math.max(1, Math.min(5000, Number(e.target.value))))
                          }
                          disabled={isRunning}
                          className="w-16 rounded border border-gray-700 bg-gray-800 px-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />{' '}
                        companies · {cfg.hint}
                      </>
                    ) : (
                      cfg.hint
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {skippingImports && !allSkipped && (
          <p className="mb-3 text-xs text-amber-400">
            Imports skipped — enrichment will use the existing company database.
          </p>
        )}

        <button
          onClick={handleRun}
          disabled={starting || isRunning || allSkipped}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting || isRunning ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <PlayCircle size={16} />
          )}
          {isRunning ? 'Pipeline Running...' : 'Run Pipeline'}
        </button>

        {allSkipped && (
          <p className="mt-2 text-xs text-gray-500">Enable at least one step to run.</p>
        )}
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
              {run.status === 'done'
                ? 'Completed'
                : run.status === 'queued'
                  ? 'Queued'
                  : run.status === 'running'
                    ? 'In progress'
                    : 'Error'}
            </span>
          </div>

          <div className="mb-2 text-sm text-gray-400">{formatStep(run.current_step)}</div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
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
          title="Company Registry Import"
          skipped={opensanctions.step_skipped === true}
          skippedNote="Import skipped — companies already in the database were used for enrichment."
          lines={[
            { label: 'New companies added', value: String(opensanctions.imported ?? 0) },
            { label: 'Existing records updated', value: String(opensanctions.updated ?? 0) },
            { label: 'Already up-to-date', value: String(opensanctions.skipped ?? 0) },
            {
              label: 'Non-company entries ignored',
              value: String(opensanctions.ignored_non_company ?? 0),
            },
          ]}
        />
        <CounterCard
          title="TI Georgia Import"
          skipped={tiGeorgia.step_skipped === true}
          skippedNote="Import skipped — existing TI Georgia records were kept unchanged."
          lines={[
            { label: 'New companies added', value: String(tiGeorgia.imported ?? 0) },
            { label: 'Existing records updated', value: String(tiGeorgia.updated ?? 0) },
            { label: 'Already up-to-date', value: String(tiGeorgia.skipped ?? 0) },
            {
              label: 'Source reachable',
              value: tiGeorgia.source_unavailable ? 'No' : 'Yes',
            },
          ]}
        />
        <CounterCard
          title="Website & Social Discovery"
          skipped={enrichment.step_skipped === true}
          skippedNote="Enrichment skipped — website and social data from previous runs was kept."
          lines={[
            { label: 'Companies selected', value: String(enrichment.targeted ?? 0) },
            { label: 'Successfully enriched', value: String(enrichment.successful ?? 0) },
            { label: 'Failed to enrich', value: String(enrichment.failed ?? 0) },
          ]}
        />
        <CounterCard
          title="Lead Scoring"
          skipped={scoring.step_skipped === true}
          skippedNote="Scoring skipped — lead priorities from the previous run were kept."
          lines={[
            { label: 'Leads scored', value: String(scoring.scored ?? 0) },
            { label: 'Full websites found', value: String(scoring.full_website ?? 0) },
            { label: 'Landing pages found', value: String(scoring.landing_page ?? 0) },
          ]}
        />
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  )
}

function CounterCard({
  title,
  lines,
  skipped,
  skippedNote,
}: {
  title: string
  lines: { label: string; value: string }[]
  skipped?: boolean
  skippedNote?: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        {skipped && (
          <span className="rounded-full border border-gray-700 px-1.5 py-0.5 text-xs text-gray-500">
            skipped
          </span>
        )}
      </div>
      {skipped ? (
        <p className="text-xs text-gray-500 italic">
          {skippedNote ?? 'This step was skipped — existing data was used as-is.'}
        </p>
      ) : (
        <div className="space-y-1 text-sm">
          {lines.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-300">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
