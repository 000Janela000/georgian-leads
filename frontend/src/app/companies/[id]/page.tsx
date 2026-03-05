'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Globe, Facebook, Instagram, Linkedin, DollarSign, TrendingUp, Calendar, MapPin, Building2, User, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: number
  name_ge: string
  name_en: string
  identification_code: string
  legal_form: string
  registration_date: string
  status: string
  address: string
  director_name: string
  website_url: string
  website_status: string
  facebook_url: string
  instagram_url: string
  linkedin_url: string
  revenue_gel: number | null
  total_assets_gel: number | null
  profit_gel: number | null
  lead_status: string
  priority: string
  tags: string[]
  notes: string
  last_enriched_at: string
  created_at: string
  updated_at: string
}

export default function CompanyDetailPage() {
  const params = useParams()
  const companyId = params.id as string
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [newNotes, setNewNotes] = useState<string>('')

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await api.getCompany(parseInt(companyId))
        setCompany(data)
        setNewStatus(data.lead_status)
        setNewNotes(data.notes || '')
      } catch (error) {
        console.error('Failed to fetch company:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [companyId])

  const handleUpdateStatus = async () => {
    if (!company) return

    setUpdating(true)
    try {
      const updated = await api.updateCompany(company.id, { lead_status: newStatus })
      setCompany(updated)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateNotes = async () => {
    if (!company) return

    setUpdating(true)
    try {
      const updated = await api.updateCompany(company.id, { notes: newNotes })
      setCompany(updated)
    } catch (error) {
      console.error('Failed to update notes:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading company details...</p>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-8">
        <p className="text-red-500">Company not found</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/companies" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft size={18} />
          Back to Companies
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {company.name_ge || company.name_en}
              </h1>
              <p className="text-gray-600">ID: {company.identification_code}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {company.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Legal Form</p>
                <p className="text-gray-900 font-medium">{company.legal_form || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Date</p>
                <p className="text-gray-900 font-medium">{company.registration_date || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <MapPin size={16} /> Address
                </p>
                <p className="text-gray-900 font-medium">{company.address || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <User size={16} /> Director/Owner
                </p>
                <p className="text-gray-900 font-medium">{company.director_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Web Presence */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe size={20} />
              Web Presence
            </h2>

            <div className="space-y-4">
              {/* Website */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  {company.website_url ? (
                    <a
                      href={company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {company.website_url}
                    </a>
                  ) : (
                    <p className="text-gray-600">No website found</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  company.website_status === 'found' ? 'bg-green-100 text-green-800' :
                  company.website_status === 'not_found' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {company.website_status}
                </span>
              </div>

              {/* Social Media */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Social Media Profiles</p>
                <div className="space-y-2">
                  {company.facebook_url && (
                    <a
                      href={company.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Facebook size={18} />
                      Facebook Profile
                    </a>
                  )}
                  {company.instagram_url && (
                    <a
                      href={company.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-pink-600 hover:underline"
                    >
                      <Instagram size={18} />
                      Instagram Profile
                    </a>
                  )}
                  {company.linkedin_url && (
                    <a
                      href={company.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-700 hover:underline"
                    >
                      <Linkedin size={18} />
                      LinkedIn Profile
                    </a>
                  )}
                  {!company.facebook_url && !company.instagram_url && !company.linkedin_url && (
                    <p className="text-gray-600">No social media profiles found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Data */}
          {company.revenue_gel || company.total_assets_gel || company.profit_gel ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Financial Data
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {company.revenue_gel && (
                  <div className="bg-blue-50 rounded p-4">
                    <p className="text-sm text-gray-600 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-blue-900">
                      ₾{(company.revenue_gel / 1000000).toFixed(2)}M
                    </p>
                  </div>
                )}
                {company.total_assets_gel && (
                  <div className="bg-green-50 rounded p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                    <p className="text-xl font-bold text-green-900">
                      ₾{(company.total_assets_gel / 1000000).toFixed(2)}M
                    </p>
                  </div>
                )}
                {company.profit_gel && (
                  <div className="bg-yellow-50 rounded p-4">
                    <p className="text-sm text-gray-600 mb-1">Profit</p>
                    <p className="text-xl font-bold text-yellow-900">
                      ₾{(company.profit_gel / 1000000).toFixed(2)}M
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              Notes
            </h2>

            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Add notes about this company..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={handleUpdateNotes}
              disabled={updating}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Lead Status</h3>

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
              <option value="not_interested">Not Interested</option>
              <option value="converted">Converted</option>
            </select>

            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Update Status
            </button>
          </div>

          {/* Priority & Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Lead Priority
            </h3>

            <div className={`p-4 rounded-lg text-center mb-4 ${
              company.priority === 'high' ? 'bg-red-100 text-red-900' :
              company.priority === 'medium' ? 'bg-yellow-100 text-yellow-900' :
              'bg-green-100 text-green-900'
            }`}>
              <p className="text-sm text-gray-600 mb-1">Priority Level</p>
              <p className="text-2xl font-bold capitalize">{company.priority}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Web Presence:</span>
                <span className="font-medium">
                  {company.website_url ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Financial Data:</span>
                <span className="font-medium">
                  {company.revenue_gel ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Social Media:</span>
                <span className="font-medium">
                  {company.facebook_url || company.instagram_url || company.linkedin_url ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          </div>

          {/* Enrichment Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Data Enrichment
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              {company.last_enriched_at ? (
                <p>
                  Last enriched:
                  <br />
                  <span className="font-medium">
                    {new Date(company.last_enriched_at).toLocaleDateString()}
                  </span>
                </p>
              ) : (
                <p>Not yet enriched</p>
              )}

              <p>
                Added:
                <br />
                <span className="font-medium">
                  {new Date(company.created_at).toLocaleDateString()}
                </span>
              </p>
            </div>

            <a
              href={`/enrichment`}
              className="block mt-4 text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Re-enrich Company
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
