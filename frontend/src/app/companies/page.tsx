'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Search, Filter } from 'lucide-react'

interface Company {
  id: number
  name_ge: string
  name_en: string
  identification_code: string
  legal_form: string
  website_status: string
  lead_status: string
  revenue_gel: number | null
  created_at: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [websiteFilter, setWebsiteFilter] = useState<string | null>(null)
  const [leadFilter, setLeadFilter] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [limit] = useState(50)

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      try {
        const params: any = { skip, limit }
        if (websiteFilter) params.website_status = websiteFilter
        if (leadFilter) params.lead_status = leadFilter
        if (search) params.search = search

        const data = await api.listCompanies(params)
        setCompanies(data)
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchCompanies, 300)
    return () => clearTimeout(debounce)
  }, [search, websiteFilter, leadFilter, skip])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Companies</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSkip(0)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={websiteFilter || ''}
            onChange={(e) => {
              setWebsiteFilter(e.target.value || null)
              setSkip(0)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Website Status: All</option>
            <option value="found">Has Website</option>
            <option value="not_found">No Website</option>
            <option value="unknown">Unknown</option>
          </select>

          <select
            value={leadFilter || ''}
            onChange={(e) => {
              setLeadFilter(e.target.value || null)
              setSkip(0)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Lead Status: All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="converted">Converted</option>
          </select>

          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Filter size={18} className="inline mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Companies Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No companies found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Legal Form</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Website</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Revenue</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{company.name_ge || company.name_en}</p>
                      <p className="text-xs text-gray-500">{company.identification_code}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{company.legal_form}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      company.website_status === 'found' ? 'bg-green-100 text-green-800' :
                      company.website_status === 'not_found' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {company.website_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {company.revenue_gel ? `₾${(company.revenue_gel / 1000000).toFixed(1)}M` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      company.lead_status === 'new' ? 'bg-blue-100 text-blue-800' :
                      company.lead_status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {company.lead_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/companies/${company.id}`} className="text-blue-500 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex gap-4 mt-6 justify-center">
        <button
          onClick={() => setSkip(Math.max(0, skip - limit))}
          disabled={skip === 0}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setSkip(skip + limit)}
          disabled={companies.length < limit}
          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
