# LeadScout — Todo

> Last updated: 2026-03-21

Small fixes, tweaks, and polish items. Not features — those go in roadmap.md.

## Before Rebuild

- [x] Rename project from "Canvass" to "LeadScout" everywhere (code, config, README, repo folder)
- [x] Remove unused files from old vision (phase summaries, old audit report, system guide, deployment docs)
- [x] Clean up README to reflect new product vision

## During Rebuild

- [x] Frontend api.ts must define all methods it calls (10+ missing in current code)
- [x] Add visual contact icons on lead card (Facebook, phone, email — lit/greyed)
- [x] Add reachability tier badge (Hot/Warm/Cold) to lead card
- [x] Lead list should show total counts per tier
- [x] Status dropdown should be quick-access (not buried in detail page)
- [x] Google Places API key rotation — support multiple keys, switch when one hits limit
- [ ] Store which API account was used for each request (for tracking usage)

## After Rebuild

- [ ] Verify Google Maps coverage for all 5 Georgian cities
- [ ] Test Facebook page detection accuracy — sample 50 leads, check manually
- [ ] Check if any leads marked "no website" actually have one (false positive rate)
- [x] Remove all leftover "Georgian Leads" branding from documentation files
