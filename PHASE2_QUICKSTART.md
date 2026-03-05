# Phase 2: Data Import - Quick Start Guide

## What's New in Phase 2

✅ **Import companies from OpenSanctions** - Bulk upload Georgian companies
✅ **Auto-enrich from CompanyInfo.ge** - Update company details
✅ **Pre-built message templates** - Georgian & English (email + WhatsApp)

---

## Step 1: Get OpenSanctions Data

1. Visit: https://www.opensanctions.org/datasets/ext_ge_company_registry/
2. Scroll to "Download" section
3. Download the `.jsonl` file (usually ~20-30 MB)
4. Extract if compressed (`.zip` or `.gz`)

**What you'll get:**
- ~77,000+ Georgian companies
- Name, ID code, legal form, address
- Registration dates
- Director/shareholder info (some)

---

## Step 2: Import Companies via Dashboard

1. **Start the app** (if not already running):
   ```bash
   # Terminal 1: Backend
   cd backend && source venv/bin/activate && python -m app.main

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Open browser**: http://localhost:3000

3. **Go to "Import Data"** tab in sidebar

4. **Upload OpenSanctions file:**
   - Drag & drop the `.jsonl` file
   - OR click and select the file
   - Click "Upload & Import"

5. **Wait for completion:**
   - Shows: Imported count, Skipped (duplicates), Errors
   - Should show thousands of imported companies

---

## Step 3: Auto-Enrich Companies

1. **Still on "Import Data" page**
2. **Click "Update Companies"** button
3. This will:
   - Fetch additional data from companyinfo.ge
   - Update companies with missing details
   - Add legal forms, addresses, directors
   - Processes 10 companies at a time (can repeat)

---

## Step 4: View Your Companies

1. **Go to "Companies"** tab
2. **You should see:**
   - Thousands of companies listed
   - Searchable by name or ID
   - Filterable by status
   - Table shows: Name, Legal Form, Website Status, Revenue, Status

3. **Go to "Leads"** tab to see:
   - Only companies WITHOUT websites (your sales targets!)
   - Sorted by revenue (highest first)
   - These are prime prospects

---

## Step 5: Message Templates

On startup, the system auto-creates 4 default templates:

1. **Georgian Email** - Formal, professional
2. **Georgian WhatsApp** - Casual, friendly
3. **English Email** - For international companies
4. **English WhatsApp** - Direct, action-oriented

**View them:**
1. Go to "Outreach" → "Templates"
2. See all 4 pre-built templates
3. Edit them to add your name/company
4. Create new ones for different scenarios

---

## Using the Sample Data (For Testing)

If you don't want to download the full 20+ MB file, there's a sample:

```bash
# In backend folder, there's a sample file:
backend/sample_opensanctions.jsonl

# You can:
# 1. Download it to test import
# 2. Or use it to understand the format
# 3. It has 3 sample Georgian companies
```

---

## API Endpoints (Phase 2)

### Import OpenSanctions
```bash
POST /api/import/opensanctions
# Upload multipart form-data with "file" field
# Returns: {imported, skipped, errors, message}
```

### Update from CompanyInfo.ge
```bash
POST /api/import/update-from-companyinfo?limit=10
# Returns: {updated, errors, message}
```

---

## Troubleshooting

### "Import stuck/slow"
- Large files take time (20-30 MB = 1-2 minutes)
- Don't close browser during import
- Check backend terminal for errors

### "0 companies imported"
- Check file format (must be `.jsonl`)
- Make sure it's not corrupted
- Try sample file first to test

### "File format error"
- Must be JSONL (one JSON per line)
- Not standard JSON array
- Download from OpenSanctions official site

### "CompanyInfo update failed"
- Network error - try again
- Might be rate-limited - wait a minute
- Try with `limit=5` (fewer companies)

---

## What's Next (Phase 3)

Phase 3 will add:
- **Auto-detect websites** - Check if company has website
- **Find social media** - Facebook, Instagram, LinkedIn profiles
- **Financial data** - Revenue, assets, profit data

Coming soon!

---

## Data Privacy Notes

- **OpenSanctions**: Public Georgian company registry data
- **CompanyInfo.ge**: Publicly available business information
- **Your outreach**: You control who you contact
- No scraping is done illegally
- All data sources are public/permitted

---

**You're ready to import! 🚀 Start with the Import Data tab.**
