@echo off
REM Georgian Leads Platform - Windows Setup Script

echo.
echo 🚀 Georgian Leads Platform - Setup Script
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not installed or not in PATH
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✓ Docker found

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  docker-compose is not installed
    pause
    exit /b 1
)

echo.
echo 📝 Checking .env file...

if not exist "backend\.env" (
    echo Creating .env file from template...
    copy backend\.env.example backend\.env
    echo ✓ .env created
    echo 📌 Optional: Edit backend\.env to add API keys for enrichment/email
) else (
    echo ✓ .env already exists
)

echo.
echo 🐳 Building and starting Docker containers...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Failed to start containers
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak

echo.
echo ✅ Setup complete!
echo.
echo 🌐 Access the application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo 📝 Next steps:
echo    1. Open http://localhost:3000 in your browser
echo    2. Go to Import Data and upload OpenSanctions Georgian registry
echo    3. Go to Enrichment to enrich company data
echo    4. Go to Campaigns to send bulk outreach
echo.
echo 🛑 To stop:
echo    docker-compose down
echo.
echo 📚 More info:
echo    See README.md and COMPLETE_SYSTEM_GUIDE.md
echo.

pause
