# Georgian Leads — Full Project Audit

---

## PART 1: WHAT THE BUSINESS ACTUALLY NEEDS

### What is this business?
A web development agency (or solo operator) selling websites to Georgian SMBs that have **no web presence**. Product: landing pages and full websites. Market: Georgian companies in the national registry that have no website.

### The Core Business Loop
```
Find companies with no website + money → get their phone/contact → reach out → pitch → close
```

That's it. Everything else is secondary to this loop.

---

### Priority 1 — Must Have (Cannot Make Money Without These)

**1. A qualified, manageable lead list**
- Not 300,000 companies. 300–500 curated leads you can actually work.
- Qualification: active company + no website + revenue signal + reachable contact
- "Qualified" requires revenue data + contact info, not just registry data

**2. Phone numbers as primary contact method**
- In Georgia, business is done on the phone. Cold calling/WhatsApp DM is 10x more effective than cold email for SMBs.
- reportal.ge has phone numbers — they need to be a first-class field, not buried in a JSON blob.
- WhatsApp requires phone numbers — without them stored, WhatsApp outreach is impossible.

**3. Email addresses for companies that have them**
- Secondary to phone, but important.
- Without emails stored, the entire "email campaign" feature is a ghost — nowhere to send.

**4. A simple CRM: who did you contact, what happened, what's next**
- Company + last action + outcome + next step
- Lead stages: New → Called → Replied → Meeting → Closed / Not Interested

**5. A follow-up system**
- Sales = follow-up. Without reminders, leads go cold.
- Minimum: a `next_followup_date` field + "Needs follow-up today" view on Dashboard.

---

### Priority 2 — Important (Revenue Bottleneck Once P1 Is Working)

**6. Message templates that actually convert**
- One tested template beats 20 untested ones. Build after you know what works.

**7. Batch outreach that doesn't get you banned**
- Email: warmed domains, SPF/DKIM/DMARC, 50–100/day max.
- WhatsApp bulk = account ban. Must be manual/1:1.

**8. Reply detection**
- Manual status updates kill CRM adoption. Need some form of inbox sync.

---

### Priority 3 — Nice To Have Later

- Analytics (useful only after 100+ outreach attempts)
- Advanced scoring (useful at scale, premature now)
- Multiple channels (pick one that works first)

---

## PART 2: CRITICAL AUDIT OF WHAT'S ACTUALLY BUILT

### Fatal Gaps (Block the Core Loop)

**GAP 1: No phone field on Company model — CRITICAL**
- reportal.ge scraper extracts phone numbers but stores them inside `financial_data_json` blob
- No `phone` or `email` field exists in the Company model
- Cannot filter leads by "has phone number", cannot display phone in any list
- WhatsApp outreach requires a phone number — architecturally invisible in this system

**GAP 2: Email addresses don't exist anywhere**
- Company model has no `email` field
- Outreach send flow requires `contact_info` typed manually every time
- No email scraping, no email collection, no email storage
- The "bulk email campaign" feature is inoperable — you have no emails to send to
- The entire email campaign feature is a facade

**GAP 3: No follow-up scheduling**
- `scheduler.py` exists but is completely empty (all TODO comments)
- No `next_followup_date` field on Company
- After contacting someone, there is no mechanism to remember to follow up
- This is the #1 missing sales tool — follow-up is how deals close

**GAP 4: Reply tracking is purely manual**
- Outreach statuses (sent/delivered/read/replied) require manual update
- No email reply detection, no webhook integration
- In practice, outreach history is a log of sends — no actual CRM signal

---

### Serious Design Problems

**PROBLEM 1: Scoring system is logically redundant**
- Base score is 100 for every "no website" company
- But ALL leads are no-website companies — base score provides zero differentiation
- Actual differentiation is only from +30 social / +revenue bonuses
- Score ranges (100–149 = "high", 150+ = "very high") are misleading — all leads land here

**PROBLEM 2: "Social active" as positive lead signal is backwards**
- Current: has Facebook/Instagram → higher score → better lead
- Reality: a company comfortable with social media may say "we don't need a website, we have Facebook"
- Companies with ZERO digital presence (no website, no social) are likely MORE receptive to the pitch

**PROBLEM 3: `offer_lane` auto-assignment is premature**
- "full_website" vs "landing_page" is decided algorithmically before ever talking to the prospect
- You cannot decide what to sell someone before a conversation
- Creates false precision — makes the salesperson look unprepared if the assigned lane is wrong
- Should be a manual field set after first contact

**PROBLEM 4: 300k company import is operationally unworkable**
- Enriching all OpenSanctions companies at 1 req/s = 83+ hours of HTTP requests
- Imports everything and then filters, instead of filtering at import
- A focused import of 1,000–5,000 companies in target sectors would be far more useful
- SQLite with 300k enriched records will slow down badly

**PROBLEM 5: Social media URL detection is unreliable**
- Guesses Facebook/Instagram URLs from Georgian company names → Latin transliteration
- Generic words (hotel, store, market) match hundreds of unrelated pages
- No verification that a found page actually belongs to this company
- High false positive rate — social presence data cannot be trusted

**PROBLEM 6: WhatsApp bulk outreach = account ban**
- WhatsApp bans numbers used for bulk cold messaging
- Meta Business API requires approved templates, business verification, phone registration
- The bulk WhatsApp campaign feature as designed would destroy your WhatsApp number
- Should be a manual 1:1 tool only

---

### Navigation / UX Problems

**PROBLEM 7: 13 pages for a 1–2 person operation**
- Dashboard, Analytics, Pipeline, Import, Leads, Board, Companies, Company Detail, Enrichment, Campaigns, Outreach, Outreach History, Templates, Settings
- Cognitive overhead. Most pages overlap in purpose.
- Leads + Companies + Board = three overlapping views of the same data

**PROBLEM 8: Pipeline page is the homepage**
- Route `/` goes to the Pipeline runner (a background job monitor)
- Opening the app to see pipeline progress is backwards
- Dashboard should be `/`

**PROBLEM 9: Campaigns feature assumes bulk email works**
- Sends bulk email to "all leads" — but there are no email addresses stored
- Built on a non-functional assumption

---

### What Is Genuinely Good (Do Not Touch)

| What | Why it's valuable |
|------|-------------------|
| **reportal.ge scraper** | Real financial data, phone numbers, directors. Most valuable enrichment source. |
| **Website detection via DNS + HTTP** | Core business logic. Well implemented. Free, no API keys. |
| **30-day outreach dedup** | Smart anti-spam logic. Keep it. |
| **Background pipeline runner** | Solid async implementation with proper progress tracking. |
| **SQLAlchemy + Pydantic + FastAPI** | Clean, maintainable, right tool for the job. |
| **Lead filter system** | revenue_type, contact_badge, social_active_only — good concepts, just need real contact data. |
| **Lead status tracking** | new/contacted/replied/not_interested/converted — right states for a sales pipeline. |
| **TI Georgia import** | Directors/shareholders useful for enrichment depth. |

---

## PART 3: WHAT TO FIX AND IN WHAT ORDER

### Fix 1 — Add `phone` + `email` + `next_followup_date` to Company model
- `phone` (String) — extracted from reportal.ge profile
- `email` (String) — extracted from reportal.ge / social profiles
- `next_followup_date` (Date) — manually set, drives follow-up queue
- Update reportal.ge scraper to write phone to `company.phone`
- Add filter in leads list: `has_phone`, `has_email`
- Surface phone prominently in leads list UI

### Fix 2 — Make Dashboard the homepage, simplify navigation
- `/` → Dashboard
- Consolidate: Leads + Board → one "Sales Pipeline" view (list/kanban toggle)
- Merge: Outreach + Campaigns → single "Send Message" page
- Target nav: **Dashboard | Leads | Outreach | Settings**

### Fix 3 — Add "Needs Follow-up Today" section to Dashboard
- Query companies where `next_followup_date <= today` and `lead_status` not closed
- Show as a highlighted list at the top of Dashboard

### Fix 4 — Revise scoring logic
- Remove social media bonus (+30) — it's a bad signal, possibly backwards
- Add phone availability bonus (+20) — having contact info makes a lead actionable
- Score should reflect: revenue strength + contact availability
- Top lead = phone + revenue cat I/II + no website + no social

### Fix 5 — Make `offer_lane` manual, not auto-assigned
- Remove auto-assignment from `lead_scoring.py`
- Default: `null` / unset
- User sets it manually in company detail after first conversation

### Fix 6 — Filter at import, not after
- Add optional sector/keyword filter to OpenSanctions import
- Skip government entities, NGOs, banks at import time
- Target: import 2,000–5,000 companies maximum for first run

---

## Files to Change

| File | Change needed |
|------|---------------|
| `backend/app/models.py` | Add `phone`, `email`, `next_followup_date` to Company |
| `backend/app/schemas.py` | Add fields to CompanyResponse, LeadResponse, CompanyUpdate |
| `backend/app/scrapers/reportal.py` | Return phone number from profile data |
| `backend/app/services/enrichment.py` | Write phone to `company.phone` after reportal scrape |
| `backend/app/services/lead_scoring.py` | Remove social bonus; add phone bonus; remove offer_lane auto-assign |
| `backend/app/routers/companies.py` | Add `has_phone` / `has_email` filters |
| `frontend/src/App.tsx` | Move `/` to Dashboard; restructure routes |
| `frontend/src/pages/Leads.tsx` | Show phone column; next_followup_date display |
| `frontend/src/pages/Dashboard.tsx` | Add "follow up today" section |
