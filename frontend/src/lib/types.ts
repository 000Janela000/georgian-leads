export interface Lead {
  id: number
  name: string
  google_place_id: string
  category: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  website_url: string | null
  website_status: string
  google_rating: number | null
  google_review_count: number
  facebook_url: string | null
  facebook_followers: number | null
  facebook_last_post_date: string | null
  reachability_tier: 'hot' | 'warm' | 'cold'
  lead_status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type LeadStatus = 'new' | 'messaged' | 'replied' | 'interested' | 'won' | 'not_interested' | 'no_response'
export type ReachabilityTier = 'hot' | 'warm' | 'cold'

export interface Stats {
  total_leads: number
  leads_by_city: Record<string, number>
  leads_by_tier: { hot: number; warm: number; cold: number }
  leads_by_status: Record<string, number>
  leads_with_facebook: number
  leads_with_phone: number
  leads_with_email: number
}

export interface DiscoverResult {
  google_place_id: string
  name: string
  phone: string | null
  address: string | null
  city: string
  category: string
  google_rating: number | null
  google_review_count: number
  website_url: string | null
  has_website: boolean
}

export interface Category {
  key: string
  label: string
}
