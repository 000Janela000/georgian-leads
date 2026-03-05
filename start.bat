@echo off
echo Starting Georgian Leads...
echo.
echo Backend: http://localhost:8123
echo Frontend: http://localhost:12312
echo.
wt -w georgian-leads new-tab --title "Georgian Leads - Backend" --suppressApplicationTitle cmd /k "cd /d %~dp0backend && uvicorn app.main:app --host 0.0.0.0 --port 8123 --reload" ; new-tab --title "Georgian Leads - Frontend" --suppressApplicationTitle cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers started in Windows Terminal tabs.
