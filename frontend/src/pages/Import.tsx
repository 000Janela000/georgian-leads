import { useState } from 'react'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { ImportResponse, PipelineResponse } from '../lib/types'

export default function Import() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchResult, setFetchResult] = useState<ImportResponse | null>(null)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineResult, setPipelineResult] = useState<PipelineResponse | null>(null)
  const [tiLoading, setTiLoading] = useState(false)
  const [tiResult, setTiResult] = useState<ImportResponse | null>(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.importFile(file)
      setResult(res)
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, 'Upload failed'))
    }
    setUploading(false)
  }

  const handleAutoFetch = async () => {
    setFetching(true)
    setError('')
    setFetchResult(null)
    try {
      const res = await api.autoFetch()
      setFetchResult(res)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Fetch failed'))
    }
    setFetching(false)
  }

  const handlePipeline = async () => {
    setPipelineRunning(true)
    setError('')
    setPipelineResult(null)
    try {
      const res = await api.fullPipeline(20)
      setPipelineResult(res)
    } catch (pipelineError) {
      setError(getErrorMessage(pipelineError, 'Pipeline failed'))
    }
    setPipelineRunning(false)
  }

  const handleTiGeorgia = async () => {
    setTiLoading(true)
    setError('')
    setTiResult(null)
    try {
      const res = await api.importTiGeorgia()
      setTiResult(res)
    } catch (tiError) {
      setError(getErrorMessage(tiError, 'TI Georgia import failed'))
    }
    setTiLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Data</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Full Pipeline</h2>
        <p className="text-sm text-gray-600 mb-4">
          One-click: fetch companies from the Georgian registry and enrich new leads automatically.
        </p>
        <button
          onClick={handlePipeline}
          disabled={pipelineRunning}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          {pipelineRunning ? 'Running Pipeline...' : 'Run Full Pipeline'}
        </button>
        {pipelineResult && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm">
            <p className="font-medium text-purple-800">Pipeline Complete</p>
            <p className="text-purple-700">
              Imported: {pipelineResult.import_result?.imported || 0} |
              Skipped: {pipelineResult.import_result?.skipped || 0} |
              Errors: {pipelineResult.import_result?.errors || 0}
            </p>
            <p className="text-purple-700 mt-1">{pipelineResult.enrich_message}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Fetch from Registry</h2>
        <p className="text-sm text-gray-600 mb-4">
          Auto-download companies from the OpenSanctions Georgian company registry. No file needed.
        </p>
        <button
          onClick={handleAutoFetch}
          disabled={fetching}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 text-sm font-medium"
        >
          {fetching ? 'Fetching...' : 'Fetch from Registry'}
        </button>
        {fetchResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-medium text-green-800">Fetch Complete</p>
            <p className="text-green-700">Imported: {fetchResult.imported} | Skipped: {fetchResult.skipped} | Errors: {fetchResult.errors}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">TI Georgia Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Import directors, shareholders, and legal form data from Transparency International Georgia.
          Enriches existing companies and imports new ones.
        </p>
        <button
          onClick={handleTiGeorgia}
          disabled={tiLoading}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium"
        >
          {tiLoading ? 'Importing...' : 'Import TI Georgia Data'}
        </button>
        {tiResult && (
          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg text-sm">
            <p className="font-medium text-teal-800">Import Complete</p>
            <p className="text-teal-700">
              Imported: {tiResult.imported} | Updated: {tiResult.updated || 0} | Skipped: {tiResult.skipped}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Manual Upload</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload a .jsonl file from the OpenSanctions Georgian company registry.
        </p>
        <input
          type="file"
          accept=".jsonl,.json"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload & Import'}
        </button>
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-medium text-green-800">Import Complete</p>
            <p className="text-green-700">Imported: {result.imported} | Skipped: {result.skipped} | Errors: {result.errors}</p>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="font-medium text-blue-900 mb-2">Data Sources (all free, no API keys)</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>OpenSanctions - 700K+ Georgian company registry records</li>
          <li>TI Georgia - Directors, shareholders, ownership data</li>
          <li>Reportal.ge - Company profiles, categories (via enrichment)</li>
          <li>Website detection - DNS + HTTP checks with Georgian transliteration</li>
        </ul>
      </div>
    </div>
  )
}
