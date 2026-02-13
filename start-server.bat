@echo off
echo ========================================
echo   Process Flow Designer - Local Server
echo ========================================
echo.
echo Starting web server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo Opening browser...
echo.

start http://localhost:8000

python -m http.server 8000
