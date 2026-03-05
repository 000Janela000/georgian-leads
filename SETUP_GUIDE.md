# Setup Guide - Choose Your Method

This document explains the different ways to set up Georgian Leads with minimal effort.

---

## 🚀 Quickest Option: Docker (Recommended)

**Time:** 2-3 minutes
**Requirements:** Docker Desktop only

### macOS / Linux
```bash
cd georgian-leads
bash setup.sh
```

### Windows
```bash
cd georgian-leads
setup.bat
```

Both scripts will:
- ✅ Check Docker is installed
- ✅ Create `.env` file from template
- ✅ Build images
- ✅ Start all services
- ✅ Show you the URLs

Then open http://localhost:3000 and start using!

---

## 🐳 Manual Docker Commands

If you prefer manual control:

```bash
# Create .env from template
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## ⚙️ Make Commands (Unix Only)

If you have `make` installed:

```bash
# Setup
make setup

# Start
make up

# Stop
make down

# View logs
make logs

# Reset database (careful!)
make reset-db

# See all commands
make help
```

---

## 🖥️ Manual Setup (No Docker)

If you don't want to use Docker:

### 1. Install Prerequisites
- Python 3.9+ from https://www.python.org/
- Node.js 18+ from https://nodejs.org/

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Start backend
python -m app.main
```

### 3. Frontend Setup (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## 📁 Files Explained

| File | Purpose | When to Use |
|------|---------|------------|
| `setup.sh` | Automatic setup for Mac/Linux | First time, Docker |
| `setup.bat` | Automatic setup for Windows | First time, Docker, Windows |
| `Makefile` | Unix make commands | Prefer `make up` over long commands |
| `docker-compose.yml` | Development Docker setup | Docker development |
| `docker-compose.prod.yml` | Production Docker setup | Deploying to production |
| `QUICKSTART.md` | 2-minute getting started | First time users |
| `DEPLOYMENT.md` | Production deployment guide | Deploying to server |
| `README.md` | Full project documentation | Understanding the project |
| `COMPLETE_SYSTEM_GUIDE.md` | User workflow guide | Learning how to use it |

---

## 🔧 Common Setup Issues

### Issue: Port 3000 or 8000 already in use

**Docker Solution:**
Edit `docker-compose.yml`:
```yaml
backend:
    ports:
      - "8001:8000"  # Changed 8000 to 8001

frontend:
    ports:
      - "3001:3000"  # Changed 3000 to 3001
```

Then access at http://localhost:3001

**Manual Solution:**
```bash
# Kill process on port 3000
# Mac/Linux:
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Docker says "image not found"

Rebuild images:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Database file exists but is empty

Reset database:
```bash
docker-compose down
rm backend/data/leads.db
docker-compose up -d
```

### Issue: Connection refused to localhost:8000

Wait a bit longer for backend to start:
```bash
# Wait 10 seconds
sleep 10

# Then check if backend is ready
curl http://localhost:8000/health
```

### Issue: npm install hangs

Use different registry:
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

---

## ✅ Verify Setup

After setup, verify everything works:

```bash
# Test backend
curl http://localhost:8000/health

# Test frontend (should return HTML)
curl http://localhost:3000
```

You should see:
```json
{"status": "ok"}
```

And your browser should show Georgian Leads home page.

---

## 📚 Next Steps

1. **Read QUICKSTART.md** for basic usage (2 min)
2. **Read COMPLETE_SYSTEM_GUIDE.md** for full features (10 min)
3. **Import data** from OpenSanctions (5 min)
4. **Enrich companies** to find websites (5 min)
5. **Send campaigns** to start outreach (varies)

---

## 💡 Pro Tips

- **Save API keys:** Add them to `.env` before running enrichment
- **Backup database:** Copy `backend/data/leads.db` regularly
- **Check logs:** Use `docker-compose logs backend` for errors
- **Use Makefile:** Less typing than docker-compose commands
- **Customize port:** Change `docker-compose.yml` if ports conflict

---

## 🆘 Getting Help

1. Check logs: `docker-compose logs backend`
2. Read errors: They usually tell you what's wrong
3. Verify prerequisites: `docker --version`, `npm --version`
4. Restart everything: `docker-compose down && docker-compose up -d`

---

**Ready? Start with `bash setup.sh` (Mac/Linux) or `setup.bat` (Windows)** 🚀
