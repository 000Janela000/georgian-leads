'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await api.listTemplates()
        setTemplates(data)
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Message Templates</h1>

      {loading ? (
        <p className="text-gray-500">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500">No templates found</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {templates.map((template: any) => (
            <div key={template.id} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-500">
                    {template.language === 'ka' ? 'Georgian' : 'English'} • {template.channel}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.is_default ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.is_default ? 'Default' : 'Custom'}
                </span>
              </div>
              {template.subject && (
                <p className="text-sm mb-2"><strong>Subject:</strong> {template.subject}</p>
              )}
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
