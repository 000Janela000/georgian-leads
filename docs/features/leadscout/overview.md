# LeadScout — Product Overview

> Last updated: 2026-03-21

## What It Is

LeadScout is a personal lead discovery tool for finding Georgian businesses that need websites. It finds businesses that are active online (Google Maps reviews, Facebook pages) but don't have a website — and gives you everything you need to reach out to them manually.

## Who It's For

You. A web developer in Georgia looking for clients. This is a personal tool, not a product for sale.

## Core Idea

Businesses that are active on Google Maps and Facebook but have no website are the best prospects for web development services. They already care about being found online — they just haven't invested in a proper site yet.

## How It Works

### Discovery Pipeline

1. **Google Maps search** — Find all businesses in Georgian cities using the Google Places API (free tier, 2-3 accounts)
2. **Filter** — Keep only businesses where the "website" field is empty
3. **Facebook enrichment** — For each lead, search Google for their Facebook page using Google Custom Search API (free tier)
4. **Scrape public Facebook data** — Follower count, last post date, phone, email (if available on public page)
5. **Save and score** — Store all leads, sorted by Google review count (activity signal)

### Data Sources

| Source | What It Provides | Cost |
|--------|-----------------|------|
| Google Places API | Business name, category, phone, address, rating, review count, website (or lack of) | Free tier: $200/month per account |
| Google Custom Search API | Find Facebook page URL for a business | Free tier: 100 queries/day per key |
| Facebook public pages | Follower count, last post date, phone, email, about info | Free (public scraping) |

### Lead Card

Each lead shows:

- **Business name**
- **Category** (from Google Maps, e.g., Restaurant, Dentist, Auto Repair)
- **Google rating and review count** (quality/activity signal)
- **Contact options** (icons showing what's available):
  - Facebook page link (click to open and message)
  - Phone number
  - Email
- **Address / area**

### Reachability Tiers

| Tier | Contact Available | Action |
|------|------------------|--------|
| Hot | Facebook page found | Message them on Facebook |
| Warm | Phone or email only (no Facebook) | Call or email them |
| Cold | No contact info — just name and address | Save for later |

Leads are shown Hot first, then Warm, then Cold. You work from the top.

### Sorting

Primary sort: **Google review count** (descending). More reviews means more established, more active, more likely to afford a website.

Within the same tier, higher review count = higher priority.

### Status Tracking

After you contact a lead, you mark what happened:

| Status | Meaning |
|--------|---------|
| New | Haven't contacted yet |
| Messaged | Sent a message (Facebook, email, or phone) |
| Replied | They responded |
| Interested | They want to discuss further |
| Won | They're your client |
| Not interested | They said no |
| No response | Messaged but never heard back |

### Geography

Georgian cities only:

- Tbilisi
- Batumi
- Kutaisi
- Rustavi
- Gori

More cities can be added later.

### Categories

Categories are NOT a filter for discovery. LeadScout pulls ALL businesses without websites, regardless of type. The category from Google Maps is shown as a label on the lead card for context only.

Over time, you'll naturally discover which categories convert best from the data.

## What LeadScout Is NOT

- Not an outreach automation tool — you message people manually
- Not a CRM — it tracks lead status, nothing more
- Not a multi-user platform — it's for you alone
- Not a SaaS product — it will not be sold or distributed
