# LeadScout — Roadmap

> Last updated: 2026-03-21

## Planned

### Phase 1: Core Discovery (Full Rebuild)

**Google Maps Discovery Engine** — Approved
Search Georgian cities via Google Places API. Pull all businesses. Filter to those without a website. Store results. Support 2-3 API accounts for extended free tier usage.

**Facebook Enrichment Pipeline** — Approved
For each lead, use Google CSE to find their Facebook page. Scrape public page data: follower count, last post date, phone, email. Link Facebook URL to the lead.

**Lead List UI** — Approved
Simple, scannable list of leads. Show: name, category, Google rating/reviews, contact icons (Facebook/phone/email), address. Sort by review count. Filter by reachability tier (Hot/Warm/Cold).

**Lead Card with Contact Options** — Approved
Each lead shows available contact methods with clickable links. Facebook link opens their page directly. Phone is clickable. Email is clickable.

**Manual Status Tracking** — Approved
Simple status dropdown per lead: New, Messaged, Replied, Interested, Won, Not interested, No response. No automation — you update it yourself.

**Reachability Tier System** — Approved
Classify leads as Hot (has Facebook), Warm (phone/email only), Cold (no contact). Visual indicator on lead card. Filter by tier.

### Phase 2: Polish

**City-by-City Sweep** — Proposed
Background job that sweeps all businesses in all Georgian cities. Run once, then periodic refresh (monthly).

**Duplicate Detection** — Proposed
Same business might appear in multiple searches. Detect by name + address similarity and merge.

**Lead Freshness** — Proposed
Track when a lead was last checked. Re-verify periodically that they still don't have a website. Remove leads who got a website since last check.

### Phase 3: Future (Only If Needed)

**Additional Georgian Cities** — Proposed
Expand beyond the initial 5 cities based on demand.

**Outdated Website Detection** — Proposed
Find businesses that HAVE a website but it's terrible (no SSL, not mobile-friendly, broken). Type C leads. Roughly doubles the addressable market.

**Foreign Market Support** — Proposed
Add automated email outreach for non-Georgian leads. Only if Georgian pipeline is fully working and you want to expand.

---

## Completed

**Google Maps Discovery Engine** — Completed 2026-03-21
Search Georgian cities via Google Places API. Returns all businesses with rating/review data. Filters to those without a website on save. Supports 3 API keys for extended free tier usage with automatic rotation.

**Facebook Enrichment Pipeline** — Completed 2026-03-21
Google CSE lookup to find Facebook page URLs. Optional Facebook Graph API enrichment for follower count, last post date, phone, email. Manual URL entry fallback.

**Lead List UI** — Completed 2026-03-21
Sortable lead table with name, category, Google rating/reviews, contact icons (Facebook/phone/email — lit or greyed), reachability tier badge, inline status dropdown. Filter by city, tier, status, search text. Tier summary counts at top.

**Lead Card with Contact Options** — Completed 2026-03-21
Detail page with clickable Facebook link, tel: phone link, mailto: email link. Facebook enrichment button. Notes with auto-save.

**Manual Status Tracking** — Completed 2026-03-21
Inline status dropdown on lead list and detail page: New, Messaged, Replied, Interested, Won, Not interested, No response.

**Reachability Tier System** — Completed 2026-03-21
Automatic classification: Hot (has Facebook), Warm (phone/email only), Cold (no contact). Recomputed on save and enrichment. Visual badges and filter support.

---

## Dropped

**OpenSanctions Registry Import** — Dropped 2026-03-21
Was importing Georgian company registry data. Not needed — Google Maps is a better source for finding active businesses without websites. Registry data is static and doesn't show online activity.

**Automated Email Outreach** — Dropped 2026-03-21
Complex email sender with SMTP, domain warming concerns, deliverability issues. Not needed — Georgian outreach is manual via Facebook DM. May revisit for foreign markets later.

**WhatsApp Twilio/Meta Integration** — Dropped 2026-03-21
Two WhatsApp API integrations. Not needed for manual Georgian outreach. May revisit later.

**Campaign Management** — Dropped 2026-03-21
Bulk send campaigns with templates. Not needed for manual outreach workflow.

**Template System** — Dropped 2026-03-21
Pre-built message templates in Georgian and English. Not needed — you write messages personally on Facebook.

**Reportal.ge Financial Scraper** — Dropped 2026-03-21
Scraped Georgian company financial data (revenue, assets, profit). Not needed — Google review count is a better activity/quality signal for this use case.

**Complex Lead Scoring Algorithm** — Dropped 2026-03-21
Point-based scoring with category revenue estimates, contact bonuses, recency penalties. Replaced by simple sort: review count + reachability tier.

**Overpass/OSM Scraper** — Dropped 2026-03-21
OpenStreetMap data for Georgia is too sparse. Google Maps has far better coverage.

**CompanyInfo.ge Scraper** — Dropped 2026-03-21
Was enriching registry companies. Not needed in the Google Maps-first approach.

---

## Competitive Intelligence

**Closest competitor: Grape Leads** — Canadian tool for web dev agencies to find businesses without websites via Google Maps. Key differences: Grape Leads has map-based visual UI and outdated website detection, but no outreach tracking or Facebook enrichment. Data export only.

**Outscraper** — Google Maps scraping service with a "businesses without websites" filter. Data export only, no lead management. Pay-as-you-go pricing.

**No tool serves the Georgian market specifically.** LeadScout's combination of Google Maps discovery + Facebook enrichment + manual outreach tracking for Georgia is unique.

Sources:
- https://grapeleads.com/
- https://outscraper.com/google-maps-scrape-businesses-without-websites/

## Audit History

- 2026-03-21: Full product audit and rebuild decision. Scoped to Georgian market, manual outreach, Google Maps + Facebook pipeline. Dropped registry import, automated outreach, WhatsApp, campaigns, templates, financial scraping.
