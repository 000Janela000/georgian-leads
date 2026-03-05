#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Georgian Leads Platform - Setup Script${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed. Please install Docker first.${NC}"
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"
echo ""

# Create .env file from example if it doesn't exist
if [ ! -f backend/.env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ .env created from template${NC}"
    echo -e "${YELLOW}  📌 Optional: Edit backend/.env to add API keys for enrichment/email${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Building and starting Docker containers...${NC}"
docker-compose up -d --build

# Wait for backend to be ready
echo ""
echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Backend still starting, this is normal${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Access the application:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Go to Import Data and upload OpenSanctions Georgian registry"
echo "  3. Go to Enrichment to enrich company data"
echo "  4. Go to Campaigns to send bulk outreach"
echo ""
echo -e "${BLUE}🛑 To stop:${NC}"
echo "  docker-compose down"
echo ""
echo -e "${BLUE}📚 More info:${NC}"
echo "  See README.md and COMPLETE_SYSTEM_GUIDE.md"
