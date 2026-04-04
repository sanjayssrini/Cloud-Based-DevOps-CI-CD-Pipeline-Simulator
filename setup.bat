@echo off
REM Cloud-Based DevOps CI/CD Pipeline Simulator - Setup Script
REM This script automates the initial setup process

echo.
echo ========================================
echo DevOps Simulator Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js v18 or higher from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/5] Generating Prisma client...
cd apps\backend
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo.

echo [4/5] Building backend...
cd apps\backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build backend
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo.

echo [5/5] Building frontend...
cd apps\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build frontend
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo.

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure PostgreSQL is running on localhost:5432
echo 2. Run: npm run dev:backend  (in one terminal)
echo 3. Run: npm run dev:frontend (in another terminal)
echo 4. Open http://localhost:3000 in your browser
echo.
echo For more information, see BUILD_AND_RUN.md
echo.
pause
