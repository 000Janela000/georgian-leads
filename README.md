# Georgian Leads - B2B Outreach Platform

## 🎯 What is This Project?

**Georgian Leads** is a B2B sales tool designed for web developers, digital agencies, and freelancers in Georgia. It helps you:

1. **Find** Georgian companies that don't have websites (prime sales targets)
2. **Analyze** their financial health (revenue, assets) to prioritize high-value prospects
3. **Research** their social media presence (Facebook, Instagram, LinkedIn)
4. **Reach out** via email or WhatsApp with pre-made or custom messages
5. **Track** which companies you've contacted and their responses

### Example Use Case
You're a web developer. You want to find local Georgian businesses with 100K-1M GEL revenue who don't have a website. Georgian Leads lets you:
- Search for these companies automatically
- See their financial data to assess if they can afford a website
- Get their contact info
- Send personalized outreach messages at scale
- Track responses and conversions

---

## Getting Started - Quick Option

### 🚀 Recommended: Docker (Easiest - 1 Command!)

Just install **Docker** (https://www.docker.com/products/docker-desktop) and run:

```bash
cd ~/Desktop/additional-projects/georgian-leads
bash setup.sh
```

Done! Everything will start automatically. Open http://localhost:3000

See **QUICKSTART.md** for full Docker instructions.

---

## Getting Started - Manual Setup

### ⚙️ Prerequisites (Install First)

You need to install:
1. **Python 3.9+** - Download from https://www.python.org/
2. **Node.js 18+** - Download from https://nodejs.org/

**Verify installation:**
```bash
python --version
node --version
npm --version
```

---

### 📋 Step 1: Download the Project

The project is already at:
```
~/Desktop/additional-projects/georgian-leads/
```

Open a terminal and navigate there:
```bash
cd ~/Desktop/additional-projects/georgian-leads
```

---

### 🔧 Step 2: Set Up the Backend

The backend is the "brain" - it manages the database, handles data, and provides the API.

**2a. Create a Python virtual environment:**
```bash
cd backend
python -m venv venv
```

**2b. Activate it:**
```bash
# On Mac/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

You should see `(venv)` at the start of your terminal line.

**2c. Install Python packages:**
```bash
pip install -r requirements.txt
```

This downloads all dependencies (FastAPI, SQLAlchemy, Playwright, etc.).

**2d. Create configuration file:**
```bash
cp .env.example .env
```

Open `.env` file in your editor. For now, you can leave default values. We'll configure email/WhatsApp later.

**2e. Start the backend server:**
```bash
python -m app.main
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Keep this terminal open!** The backend needs to keep running.

---

### 💻 Step 3: Set Up the Frontend

Open a **new terminal** (keep the backend running). Navigate to frontend folder.

**3a. Install Node.js packages:**
```bash
cd frontend
npm install
```

This might take 1-2 minutes.

**3b. Create configuration file:**
```bash
cp .env.local.example .env.local
```

Keep default values.

**3c. Start the frontend server:**
```bash
npm run dev
```

You should see:
```
> Local:        http://localhost:3000
```

---

### 🌐 Step 4: Open the Dashboard

Open your browser and go to:
```
http://localhost:3000
```

You should see:
- **Dashboard** with empty stats (no companies yet)
- **Sidebar** with navigation menu
- Stats cards showing: 0 companies, 0 leads, 0 contacted, etc.

---

## 🚀 How to Use the Application

### Page 1: Dashboard (Overview)

This is the home page. Shows:
- **Total Companies** - How many companies in your database
- **With Website** - Companies that already have a website (skip these)
- **Without Website** - Your target leads (these are the prospects!)
- **Contacted** - Companies you've already reached out to
- **Converted** - Companies that said yes
- **Financial Data** - Companies with revenue information

**What to do:** This is your "at a glance" view. Check it daily to see progress.

---

### Page 1.5: Import Data (Phase 2)

**Where:** Click "Import Data" in sidebar.

**What it does:**
1. **Upload OpenSanctions JSON** - Import bulk company data
   - Download free from: https://www.opensanctions.org/datasets/ext_ge_company_registry/
   - File format: `.jsonl` (one JSON object per line)
   - Each line = one company with name, ID code, address, legal form
   - Can contain thousands of companies

2. **Update from CompanyInfo.ge** - Auto-enrich existing companies
   - Fetches additional details from companyinfo.ge
   - Updates companies that haven't been enriched in 30 days
   - Adds missing legal forms, addresses, director info

**How to use:**
1. Go to "Import Data" page
2. Download OpenSanctions data:
   - Visit https://www.opensanctions.org/datasets/ext_ge_company_registry/
   - Download the `.jsonl` file (usually `ext_ge_company_registry.jsonl`)
3. Select the file and click "Upload & Import"
4. Wait for import to complete (shows: Imported count, Skipped, Errors)
5. Click "Update Companies" to auto-enrich with CompanyInfo.ge data
6. Go to "Companies" tab - you'll now see thousands of companies!

**Sample data:**
A sample file (`sample_opensanctions.jsonl`) is included in the backend folder for testing.

---

### Page 2: Companies

**Where:** Click "Companies" in sidebar.

**What it shows:** A table of all companies in your database.

**Columns:**
- **Name** - Company name (Georgian or English) + ID code
- **Legal Form** - LLC, JSC, Individual Entrepreneur, etc.
- **Website** - Status (green=found, yellow=not found, gray=unknown)
- **Revenue** - Annual revenue in GEL (if available)
- **Status** - Lead status (new, contacted, replied, converted)
- **Actions** - Click "View" to see company details

**How to use:**
1. Use **filters** to narrow down:
   - Search by name or ID
   - Filter by website status (find "Not Found" to see targets)
   - Filter by lead status (see contacted vs new)
2. Click **"View"** on a company to see full details

---

### Page 3: Leads (Priority Targets)

**Where:** Click "Leads" in sidebar.

**What it shows:** Only companies WITHOUT a website, sorted by revenue (highest first).

**This is your hot list.** These are prospects who definitely need a website.

**How to use:**
1. Click on a lead name to see more details
2. Check their revenue (can they afford a website?)
3. Look for their social media (indicates they're active)
4. If interested, send them an outreach message

---

### Page 4: Outreach (Send Messages)

**Where:** Click "Outreach" in sidebar.

**This is where you:**
- Send emails to companies
- Send WhatsApp messages
- Track response status
- See all past communications

**Coming in Phase 2:** Full outreach features with message templates.

---

### Page 3.5: Analytics (Phase 4)

**Where:** Click "Analytics" in sidebar.

**What it shows:**
- **KPI Cards:** Company count, conversion rate, web gap opportunity, enrichment %
- **Website Status Distribution:** How many have/don't have websites (visual progress bars)
- **Outreach Status Pipeline:** Not yet contacted → Contacted → Converted (visual funnel)
- **Data Quality Metrics:** Coverage of financial data, website detection completeness
- **Smart Recommendations:** Action items based on your data

**How to use:**
1. Go to "Analytics" page
2. Review key metrics and progress
3. Check recommendations
4. Use insights to prioritize next steps

**Example insights:**
- "You have 500 high-priority leads (revenue > 500K without website)"
- "Your conversion rate is 5% - focus on top performers to improve"
- "80% of companies have financial data - good enrichment coverage"

---

### Page 4: Company Detail (Phase 4)

**Where:** Click "View" on any company in Companies list or click company card in Leads.

**What it shows:** Everything about one company
- **Company Info:** Name, ID code, legal form, registration date, address, director
- **Web Presence:** Website URL (clickable), website status (found/not found), social media links
- **Financial Data:** Revenue, total assets, profit (formatted in GEL)
- **Lead Status:** Current status with dropdown to change
- **Notes:** Add internal notes for your team
- **Data Quality:** Indicators for website, financial data, social media presence
- **Enrichment Status:** When last enriched, button to re-enrich

**How to use:**
1. Click on any company name
2. Review all enriched information
3. Update status (New → Contacted → Replied → Converted)
4. Add notes about conversations/follow-ups
5. Click social media links or website to visit
6. Re-enrich if data is old

---

### Page 3.5: Enrichment (Phase 3)

**Where:** Click "Enrichment" in sidebar.

**What it does:**
1. **Auto-detect websites** - Clearbit → Google CSE → HTTP check
2. **Find social media** - Facebook, Instagram, LinkedIn, Twitter profiles
3. **Fetch financial data** - Revenue, assets, profit from reportal.ge
4. **Score leads** - Priority based on financial health + web presence gap

**Three enrichment modes:**

1. **Enrich Leads**
   - Auto-enrich all companies without websites
   - Prioritized by revenue (highest first)
   - Specify limit (how many to process)
   - 1 second delay between requests

2. **Single Company**
   - Enrich one specific company by ID
   - See detailed results for that company
   - Used for testing or targeted research

3. **Batch** (Future)
   - Enrich specific list of company IDs
   - Useful after filtering in Companies page

**Requirements to work:**
- Set Clearbit API key in Settings
- Set Google CSE API key + CX in Settings
- Internet connection
- At least 1 company in database

**How to use:**
1. Go to "Enrichment" page
2. Select enrichment mode
3. Click "Start Enrichment"
4. Wait for results (shows progress)
5. See: websites found, social profiles, financial data, priority score

---

### Page 5: Templates

**Where:** Click "Outreach" → "Templates".

**What it is:** Pre-written message templates in Georgian and English.

**Built-in Templates (automatically added):**

1. **Georgian - Web Development Offer (Email)**
   - Professional email in Georgian
   - Suitable for formal outreach
   - Includes call-to-action and contact fields

2. **Georgian - Web Development Offer (WhatsApp)**
   - Casual, friendly tone
   - Shorter format for WhatsApp
   - Includes emoji for engagement

3. **English - Web Development Offer (Email)**
   - Professional English email
   - For international companies
   - Detailed benefits explanation

4. **English - Web Development Offer (WhatsApp)**
   - Friendly English message
   - WhatsApp-appropriate length
   - Direct and actionable

**How to use:**
1. View built-in templates (auto-imported on first startup)
2. Edit templates to match your company name and contact info
3. Create custom templates for different scenarios (different services, audiences)
4. When sending outreach, pick a template and personalize
5. Replace placeholders like `[Company Name]` and `[Your Name]` before sending

---

### Page 6: Settings

**Where:** Click "Settings" in sidebar.

**What to configure:**

**Email Setup (SMTP):**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: Your Gmail app password (not regular password)

[How to get Gmail app password](https://support.google.com/accounts/answer/185833)

**WhatsApp Setup:**
- **Twilio** (easier for testing): Get account from https://www.twilio.com/
- **Meta Business API** (official): More complex, for production use

**API Keys (for finding websites & social media):**
- **Clearbit API** - Free for basic usage: https://clearbit.com/
- **Google CSE** - Free 100 queries/day: https://programmablesearchengine.google.com/

Once you add credentials, the system can automatically find websites and social media for companies.

---

## 🔄 Typical Workflow

1. **Add Companies** (Phase 2)
   - Import from OpenSanctions Georgian registry
   - Or manually add companies

2. **Enrich Company Data** (Phase 3)
   - Check if they have a website
   - Find their social media
   - Get their financial data

3. **Find Leads**
   - Go to "Leads" page
   - Filter by revenue, status, etc.

4. **Send Outreach** (Phase 5)
   - Pick a lead
   - Select or write message
   - Send via email or WhatsApp
   - Track response

5. **Follow Up**
   - Mark as "replied", "interested", "converted", etc.
   - Re-engage with custom follow-up messages

---

## 🏗️ How It Works (Technical Overview)

**Two parts work together:**

1. **Backend** (Python FastAPI)
   - Stores companies in SQLite database
   - Provides an API (like a waiter taking orders)
   - Handles scraping, enrichment, email/WhatsApp sending
   - Runs on `http://localhost:8000`

2. **Frontend** (Next.js React)
   - The pretty interface you see in browser
   - Talks to backend API to get/save data
   - Shows tables, charts, forms
   - Runs on `http://localhost:3000`

**Data Flow:**
```
You click "Send Email" in Frontend
    ↓
Frontend sends request to Backend API
    ↓
Backend processes request (sends email, updates database)
    ↓
Backend returns response
    ↓
Frontend shows success message
```

---

## Project Structure

```
georgian-leads/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app - start here
│   │   ├── models.py          # Database tables (Company, Outreach, Template)
│   │   ├── schemas.py         # Data validation schemas
│   │   ├── database.py        # SQLite setup
│   │   │
│   │   ├── routers/           # API endpoints
│   │   │   ├── companies.py   # GET/POST/PUT companies
│   │   │   ├── outreach.py    # Send messages, track responses
│   │   │   ├── templates.py   # Manage message templates
│   │   │   └── stats.py       # Dashboard statistics
│   │   │
│   │   ├── scrapers/          # (Phase 2-3) Data collection
│   │   │   ├── opensanctions.py    # Import bulk company data
│   │   │   ├── companyinfo.py      # Scrape companyinfo.ge
│   │   │   ├── reportal.py         # Get financial data
│   │   │   ├── web_checker.py      # Find websites
│   │   │   └── social_finder.py    # Find social media
│   │   │
│   │   ├── services/          # (Phase 5) Business logic
│   │   │   ├── email_sender.py          # Send emails
│   │   │   ├── whatsapp_twilio.py       # WhatsApp via Twilio
│   │   │   ├── whatsapp_meta.py         # WhatsApp via Meta
│   │   │   └── enrichment.py            # Company data enrichment
│   │   │
│   │   └── scheduler.py       # Background jobs (auto-enrichment, cleanup)
│   │
│   ├── data/                  # SQLite database file created here
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment variables template
│
└── frontend/                  # Next.js 14 React dashboard
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx           # Dashboard home page
    │   │   ├── companies/         # Companies list & detail
    │   │   ├── leads/             # Leads (no website) page
    │   │   ├── outreach/          # Outreach history & templates
    │   │   ├── settings/          # API key configuration
    │   │   ├── layout.tsx         # Sidebar navigation
    │   │   └── globals.css        # Styling
    │   │
    │   ├── components/            # Reusable UI components (coming soon)
    │   │   ├── CompanyTable.tsx
    │   │   ├── OutreachModal.tsx
    │   │   └── StatsCards.tsx
    │   │
    │   └── lib/api.ts             # API client (talks to backend)
    │
    ├── package.json               # Node.js dependencies
    ├── tsconfig.json              # TypeScript config
    ├── tailwind.config.ts         # CSS styling framework
    └── .env.local.example         # Frontend environment variables
```

---

## 💾 Database

The app uses **SQLite** - a simple file-based database. No setup needed!

**Tables created automatically:**

1. **companies** - All companies
   - Name, ID code, legal form, address
   - Website URL + status
   - Facebook, Instagram, LinkedIn links
   - Revenue, assets, profit
   - Lead status (new/contacted/converted)
   - Notes and tags

2. **outreach** - Message history
   - Which company contacted
   - Channel (email/WhatsApp)
   - Message content
   - Status (sent/delivered/replied)
   - When sent

3. **templates** - Message templates
   - Template name
   - Language (Georgian/English)
   - For which channel (email/WhatsApp)
   - Message subject and body

## 📦 Current Features

### ✅ Phase 1: Foundation (Complete)
- Dashboard with statistics
- Company list with search & filters
- Leads list (companies without websites)
- API for managing all data
- Settings page for configuration

### ✅ Phase 2: Data Import (Complete)
- **Import from OpenSanctions** - Bulk upload Georgian companies (JSONL format)
  - Download free from: https://www.opensanctions.org/datasets/ext_ge_company_registry/
  - Import hundreds/thousands of companies in one click
  - Automatic duplicate detection
- **Update from CompanyInfo.ge** - Auto-enrich existing companies
  - Scrapes companyinfo.ge for detailed company info
  - Updates legal form, address, director names
  - Respects rate limits
- **Pre-built Message Templates** (Georgian + English)
  - 4 default templates (email + WhatsApp in 2 languages)
  - Easy to customize
  - Reference templates available

### ✅ Phase 3: Enrichment Pipeline (Complete)
- **Website Detection** - Clearbit API + Google Custom Search + HTTP validation
  - Multi-method approach for reliability
  - Validates websites are live before adding
  - Marks companies as "found" or "not_found"
- **Social Media Finder** - Find profiles on Facebook, Instagram, LinkedIn, Twitter
  - Uses Google Custom Search with site: operators
  - Stores all found profiles
  - Helps identify active companies
- **Financial Data Scraper** - Fetch annual reports from reportal.ge
  - Extracts: revenue, total assets, profit, year
  - Updates company financial info
  - Supports priority scoring
- **Enrichment Service** - Orchestrate all scrapers
  - Single company enrichment endpoint
  - Batch enrichment with rate limiting
  - Auto-enrich leads (no website) by financial size
  - Priority scoring based on financial health
- **Enrichment UI Page** - Trigger and monitor enrichment
  - Multiple enrichment modes (leads, single company, batch)
  - Real-time progress tracking
  - Result display with all enriched data

### ✅ Phase 4: Dashboard & UI Enhancements (Complete)
- **Company Detail Page** - Full company profile with all data
  - Complete business information (legal form, address, director)
  - Web presence status and social media links
  - Financial data visualization (revenue, assets, profit)
  - Lead status management with status dropdown
  - Notes field for team collaboration
  - Enrichment history and re-enrichment option
  - Data quality indicators
- **Lead Board** - Advanced lead filtering and management
  - Multi-criteria filtering (priority, status)
  - Quick statistics overview
  - CSV export for CRM integration
  - Lead cards with key metrics
  - Direct links to company details
  - Responsive card-based layout
- **Analytics Dashboard** - Data-driven insights
  - KPI cards (companies, conversion rate, web gap, enrichment %)
  - Website status distribution charts
  - Outreach status tracking (pipeline visualization)
  - Data quality metrics
  - Smart recommendations for next actions
  - Visual progress bars and indicators
- **Enhanced Leads Page** - Improved lead browsing
  - Multiple view options (list and board)
  - Quick stats summary
  - Priority and status indicators
  - Revenue visualization
  - Links to advanced features
  - Better empty state messaging

### ✅ Phase 5: Outreach & Campaign Automation (Complete)
- **Email Sender Service** - SMTP-based email delivery
  - Single and bulk sending
  - HTML and plain text support
  - Template support with personalization
  - Support for Gmail, Outlook, custom SMTP
- **WhatsApp Twilio Integration** - Twilio WhatsApp API
  - Single and bulk message sending
  - Media support (images, videos)
  - E.164 phone number handling
  - Sandbox mode for testing
- **WhatsApp Meta Business API** - Official Meta integration
  - Template message support
  - Language-specific templates (Georgian)
  - Enterprise-level API
- **Campaign Management** - Create and send bulk campaigns
  - Campaign creation interface
  - Channel selection (Email, WhatsApp Twilio, WhatsApp Meta)
  - Template selection and preview
  - Target all leads or specific companies
  - Bulk send with error handling
- **Outreach History Tracker** - Monitor all communications
  - Comprehensive message history
  - Filter by channel and status
  - CSV export for analysis
  - Real-time status tracking
- **Campaign Hub** - Central outreach interface
  - Quick navigation to all features
  - Getting started guide
  - Feature comparison and benefits

---

## 🆘 Troubleshooting

### "Backend won't start"
```bash
# Make sure you're in the backend folder
cd ~/Desktop/additional-projects/georgian-leads/backend

# Make sure virtual environment is activated
source venv/bin/activate

# Try again
python -m app.main
```

### "Frontend says 'cannot find API'"
```bash
# Make sure backend is running (check terminal 1)
# Make sure frontend .env.local has correct URL:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### "Database error"
The database creates automatically. If there's an issue:
```bash
# Delete the database and let it recreate
rm backend/data/leads.db

# Restart backend
python -m app.main
```

### "npm install doesn't work"
```bash
# Try clearing npm cache
npm cache clean --force

# Then retry
npm install
```

---

## 📚 API Documentation

Once backend is running, visit:
```
http://localhost:8000/docs
```

This shows all available API endpoints with test buttons!

---

## 🔒 Security Notes

**For local use:**
- Default settings are fine
- Database is local (SQLite file)

**For production/team use:**
- Use `.env` file to store secrets
- Never commit `.env` to version control
- Use strong passwords for email/WhatsApp APIs
- Consider deploying to a VPS or cloud service

---

## 📞 API Reference (Quick)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Stats & Data** | | |
| GET | `/api/stats` | Get dashboard numbers |
| **Companies** | | |
| GET | `/api/companies` | List all companies |
| POST | `/api/companies` | Add new company |
| PUT | `/api/companies/{id}` | Update company |
| GET | `/api/companies/lead-status/no-website` | Get leads (no website) |
| **Import Data** | | |
| POST | `/api/import/opensanctions` | Upload OpenSanctions JSON file |
| POST | `/api/import/update-from-companyinfo` | Update companies from companyinfo.ge |
| **Outreach** | | |
| POST | `/api/outreach` | Send email/WhatsApp |
| **Templates** | | |
| GET | `/api/templates` | View message templates |
| POST | `/api/templates` | Create template |

See `http://localhost:8000/docs` for full details and test endpoints directly in browser.

---

## 🎓 Learning Resources

**New to web development?**
- [What is FastAPI?](https://fastapi.tiangolo.com/) - Backend framework
- [What is Next.js?](https://nextjs.org/) - Frontend framework
- [What is SQLite?](https://www.sqlite.org/about.html) - Database

**API Testing:**
- Use built-in docs at `http://localhost:8000/docs`
- Or try [Postman](https://www.postman.com/)

**Web Scraping (for Phase 2):**
- BeautifulSoup - HTML parsing
- Playwright - Browser automation
- httpx - HTTP requests

---

## 🚀 Next: What To Do Now

1. ✅ Complete all setup steps above
2. ✅ Open `http://localhost:3000` in browser
3. ✅ Explore the dashboard
4. ⏭️ **Phase 2**: Import Georgian companies (ask to proceed)
5. ⏭️ **Phase 3**: Auto-detect websites
6. ⏭️ **Phase 4**: Build outreach system

---

## 📝 Notes

- **Backup your data:** SQLite file is at `backend/data/leads.db`. Backup regularly!
- **Daily use:** Start both servers with:
  - Terminal 1: `cd backend && source venv/bin/activate && python -m app.main`
  - Terminal 2: `cd frontend && npm run dev`
- **Stop servers:** Press `Ctrl+C` in each terminal

---

## 📞 Need Help?

If something doesn't work:
1. Check **Troubleshooting** section above
2. Check backend terminal for error messages
3. Check browser console (F12) for frontend errors
4. Try restarting both servers

---

**You're all set! Open http://localhost:3000 and start exploring! 🎉**
# georgian-leads
