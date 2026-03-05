# Deployment Guide

This guide covers deploying Georgian Leads to production environments.

## Table of Contents
1. [Docker Setup](#docker-setup)
2. [Environment Configuration](#environment-configuration)
3. [Running in Production](#running-in-production)
4. [Backup & Maintenance](#backup--maintenance)
5. [Cloud Deployment](#cloud-deployment)

---

## Docker Setup

### Build Images
```bash
docker-compose -f docker-compose.prod.yml build
```

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## Environment Configuration

### 1. Create Production .env File
```bash
cp backend/.env.example backend/.env
```

### 2. Configure Critical Settings
```bash
# Database (use PostgreSQL for production)
DATABASE_URL=postgresql://user:password@db-host:5432/georgian-leads

# Email (required for outreach)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Enrichment (optional but recommended)
CLEARBIT_API_KEY=your-key
GOOGLE_CSE_API_KEY=your-key
GOOGLE_CSE_CX=your-cx

# WhatsApp (optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+...
```

### 3. Security Checklist
- [ ] All API keys are from production accounts
- [ ] SMTP password is app-specific (not main password)
- [ ] Database is backed up regularly
- [ ] `.env` file is **not** committed to git
- [ ] `.env` file has restricted permissions (600)

```bash
chmod 600 backend/.env
```

---

## Running in Production

### Option 1: Local Server with Docker Compose

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:8000/health
curl http://localhost:3000
```

### Option 2: Use Nginx as Reverse Proxy

Create `nginx.conf`:
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Add to docker-compose.prod.yml:
```yaml
nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend
```

### Option 3: Cloud Platforms

#### Heroku
```bash
heroku create georgian-leads
heroku config:set CLEARBIT_API_KEY=...
git push heroku main
```

#### Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

#### Vercel (Frontend only)
```bash
vercel --prod
```

#### AWS
- Backend: Lambda, EC2, or Fargate
- Frontend: S3 + CloudFront
- Database: RDS PostgreSQL

---

## Backup & Maintenance

### Daily Backup
```bash
# Backup SQLite database
cp backend/data/leads.db backup/leads.db.$(date +%Y%m%d)

# Or use PostgreSQL dump
pg_dump georgian_leads > backup/leads.sql.$(date +%Y%m%d)
```

### Automated Backup Script
Create `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups/georgian-leads"
mkdir -p $BACKUP_DIR

# Backup database
cp /app/data/leads.db $BACKUP_DIR/leads.db.$(date +%Y%m%d_%H%M%S)

# Keep only last 30 days
find $BACKUP_DIR -name "leads.db.*" -mtime +30 -delete

# Optional: Upload to cloud
# aws s3 cp $BACKUP_DIR/leads.db.* s3://my-bucket/backups/
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Database Migration to PostgreSQL

When ready to scale:

```bash
# Install dependencies
pip install psycopg2-binary

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/georgian_leads

# Alembic migration (future)
alembic upgrade head
```

---

## Monitoring

### Health Checks
```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000
```

### Logs
```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Container Stats
```bash
docker stats
```

---

## Troubleshooting

### Backend won't start
```bash
docker-compose logs backend
# Check .env file exists and is valid
# Check database permissions
```

### High memory usage
- Reduce import batch size
- Limit concurrent enrichment jobs
- Archive old outreach records

### Database locked
```bash
# Restart backend to release locks
docker-compose restart backend
```

### API timeout on enrichment
- Reduce batch size
- Increase timeout in web_checker.py
- Use background job queue (future enhancement)

---

## Performance Tuning

### SQLite Optimization
```python
# backend/app/database.py
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    poolclass=StaticPool,
    echo_pool=False,  # Reduce logging
)
```

### Rate Limiting
Add to FastAPI:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.get("/")
@limiter.limit("100/minute")
def list_companies(...):
    ...
```

### Enable Gzip Compression
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

## Scaling to PostgreSQL

When you outgrow SQLite (100K+ companies):

```bash
# 1. Create PostgreSQL database
createdb georgian_leads

# 2. Update DATABASE_URL
DATABASE_URL=postgresql://user:password@localhost:5432/georgian_leads

# 3. Run migrations
alembic upgrade head

# 4. Restart backend
docker-compose restart backend
```

No code changes needed! SQLAlchemy handles the database abstraction.

---

## SSL/TLS with Let's Encrypt

```bash
# Using Certbot
sudo certbot certonly --standalone -d your-domain.com

# Add to docker-compose.prod.yml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt
```

Update nginx.conf:
```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

---

## Support

For issues or questions, see:
- COMPLETE_SYSTEM_GUIDE.md - User guide
- AUDIT_REPORT.md - Technical analysis
- Backend logs - docker-compose logs backend
