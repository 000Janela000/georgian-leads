# ⚡ Quick Start - 2 Minutes to Running

## Prerequisites
- **Docker** (download from https://www.docker.com/products/docker-desktop)
- **Nothing else required!**

## 1. Start Everything (One Command)

```bash
cd georgian-leads
bash setup.sh
```

That's it! The script will:
- ✅ Check Docker is installed
- ✅ Create `.env` file from template
- ✅ Build and start all containers
- ✅ Wait for services to be ready

## 2. Open in Browser

Once setup.sh finishes:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 3. First Steps

### Import Companies
1. Click **"Import Data"** in sidebar
2. Download OpenSanctions Georgian registry from:
   https://www.opensanctions.org/datasets/ext_ge_company_registry/
3. Upload the `.jsonl` file
4. Watch 77,000+ companies get imported! 📊

### Enrich Companies
1. Click **"Enrichment"** in sidebar
2. Click **"Enrich Leads"** (uses free Clearbit tier by default)
3. Data loads in ~30 seconds
4. Companies get websites, social media, and financial data

### Send Campaigns
1. Click **"Campaigns"** in sidebar
2. Create new campaign
3. Select email or WhatsApp template
4. Send to all leads or specific companies
5. Track in **"Outreach History"**

---

## Configuration (Optional)

To use more powerful features, edit `backend/.env`:

```bash
# For better website detection (50K free/month)
CLEARBIT_API_KEY=your-key-here

# For email campaigns (Gmail + app password)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# For WhatsApp campaigns via Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

See `backend/.env.example` for all options.

---

## Useful Commands

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop everything
```bash
docker-compose down
```

### Restart
```bash
docker-compose down
docker-compose up -d
```

### Reset database (delete all companies)
```bash
rm backend/data/leads.db
docker-compose restart backend
```

### Shell into backend
```bash
docker-compose exec backend bash
```

---

## Troubleshooting

**Port already in use?**
```bash
# Change ports in docker-compose.yml
# Change 3000:3000 to 3001:3000 (frontend)
# Change 8000:8000 to 8001:8000 (backend)
```

**Docker won't start?**
```bash
# Check if Docker Desktop is running
docker ps
# If it fails, start Docker Desktop
```

**Containers crash?**
```bash
# View detailed logs
docker-compose logs backend
# Rebuild
docker-compose down
docker-compose up -d --build
```

---

## Full Documentation

- **User Guide:** See `COMPLETE_SYSTEM_GUIDE.md`
- **Phase Details:** See `PHASE2_SUMMARY.md` through `PHASE5_SUMMARY.md`
- **API Reference:** Visit http://localhost:8000/docs

---

**That's it! You're ready to find and reach out to Georgian companies 🚀**
