'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface ImportResult {
  imported: number
  skipped: number
  errors: number
  total: number
  message: string
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatingFromCompanyInfo, setUpdatingFromCompanyInfo] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleUploadOpenSanctions = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/import/opensanctions', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data = await response.json()
      setResult(data)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFromCompanyInfo = async () => {
    setUpdatingFromCompanyInfo(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/import/update-from-companyinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 10 }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Update failed')
      }

      const data = await response.json()
      setResult({
        imported: 0,
        skipped: 0,
        errors: data.errors,
        total: data.updated + data.errors,
        message: data.message,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingFromCompanyInfo(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Import</h1>

      {/* OpenSanctions Import */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Import from OpenSanctions
        </h2>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-2">
            <strong>How to use:</strong>
          </p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Download OpenSanctions Georgian registry from:
              <a
                href="https://www.opensanctions.org/datasets/ext_ge_company_registry/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                opensanctions.org
              </a>
            </li>
            <li>Extract the .jsonl file</li>
            <li>Upload it here to import companies in bulk</li>
            <li>Each file can contain thousands of Georgian companies</li>
          </ol>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
          <input
            type="file"
            accept=".jsonl,.json"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex items-center justify-center cursor-pointer"
          >
            <div className="text-center">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">.jsonl or .json files</p>
            </div>
          </label>
        </div>

        <button
          onClick={handleUploadOpenSanctions}
          disabled={!file || loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Importing...
            </>
          ) : (
            'Upload & Import'
          )}
        </button>
      </div>

      {/* CompanyInfo.ge Update */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Update from CompanyInfo.ge
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Automatically enriches existing companies with data from companyinfo.ge
          (updates companies that haven't been enriched in 30 days).
        </p>

        <button
          onClick={handleUpdateFromCompanyInfo}
          disabled={updatingFromCompanyInfo}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
        >
          {updatingFromCompanyInfo ? (
            <>
              <Loader size={18} className="animate-spin" />
              Updating...
            </>
          ) : (
            'Update Companies'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {result.message}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Imported</p>
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Processed</p>
                  <p className="text-2xl font-bold text-blue-600">{result.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📊 About the Data</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>
            <strong>OpenSanctions:</strong> Georgian company registry with identification codes, legal forms, and founder info
          </li>
          <li>
            <strong>CompanyInfo.ge:</strong> Updates existing companies with additional details and current information
          </li>
          <li>
            <strong>Schedule:</strong> After import, system can auto-detect websites and social media (Phase 3)
          </li>
          <li>
            <strong>Duplicate handling:</strong> Duplicates are automatically skipped
          </li>
        </ul>
      </div>
    </div>
  )
}
