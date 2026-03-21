const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options

  let url = `${API_URL}${endpoint}`
  if (params) {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, String(value))
      }
    })
    const queryString = query.toString()
    if (queryString) url += `?${queryString}`
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  // Stats
  getStats: () => fetchAPI('/api/leads/stats'),

  // Leads
  listLeads: (params?: any) => fetchAPI('/api/leads', { params }),
  getLead: (id: number) => fetchAPI(`/api/leads/${id}`),
  updateLead: (id: number, data: any) =>
    fetchAPI(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLeadStatus: (id: number, status: string) =>
    fetchAPI(`/api/leads/${id}/status`, { method: 'PUT', body: JSON.stringify({ lead_status: status }) }),
  deleteLead: (id: number) =>
    fetchAPI(`/api/leads/${id}`, { method: 'DELETE' }),
  enrichLead: (id: number) =>
    fetchAPI(`/api/leads/${id}/enrich`, { method: 'POST' }),
  enrichBatch: (ids?: number[]) =>
    fetchAPI('/api/leads/enrich-batch', { method: 'POST', body: JSON.stringify({ lead_ids: ids || [] }) }),
  getEnrichStatus: () => fetchAPI('/api/leads/enrich-batch/status'),

  // Discover
  getCities: () => fetchAPI('/api/discover/cities'),
  getCategories: () => fetchAPI('/api/discover/categories'),
  searchPlaces: (data: { city: string; category: string; api_key_index?: number }) =>
    fetchAPI('/api/discover/search', { method: 'POST', body: JSON.stringify(data) }),
  saveLeads: (leads: any[]) =>
    fetchAPI('/api/discover/save', { method: 'POST', body: JSON.stringify({ leads }) }),
  startSweep: (cities: string[], categories: string[]) =>
    fetchAPI('/api/discover/sweep', { method: 'POST', body: JSON.stringify({ cities, categories }) }),
  getSweepStatus: () => fetchAPI('/api/discover/sweep/status'),

  // Settings
  getSettings: () => fetchAPI('/api/settings'),
  saveSettings: (data: Record<string, string>) =>
    fetchAPI('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
}
