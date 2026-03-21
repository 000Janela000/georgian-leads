# LeadScout

Personal lead discovery tool for finding Georgian businesses that need websites.

## What It Does

1. **Discover** businesses via Google Maps that don't have a website
2. **Enrich** leads with Facebook page data (followers, last post, contact info)
3. **Track** outreach status manually (New > Messaged > Replied > Won)
4. **Prioritize** by Google review count and reachability tier (Hot/Warm/Cold)

## Stack

- **Backend:** Python FastAPI + SQLite
- **Frontend:** React + Vite + Tailwind CSS
- **Discovery:** Google Places API (free tier)
- **Enrichment:** Google Custom Search + Facebook Graph API

## Quick Start

### Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000

### Manual

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Configuration

Add API keys in the Settings page (http://localhost:3000/settings):

| Key | Purpose | Free Tier |
|-----|---------|-----------|
| Google Places API Key | Business discovery | $200/month per account |
| Google CSE API Key + CX | Facebook page lookup | 100 queries/day |
| Facebook Access Token | Page data enrichment | Unlimited reads |

Support up to 3 Google Places API keys for extended free usage.

## Cities

Tbilisi, Batumi, Kutaisi, Rustavi, Gori

## API Docs

http://localhost:8000/docs
