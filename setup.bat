@echo off
echo ========================================
echo Student Practicum Report Management System
echo Setup Script for Windows
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed ✓

echo.
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo npm is installed ✓

echo.
echo ========================================
echo Setting up Backend (summarit)
echo ========================================
cd summarit

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)
echo Backend dependencies installed ✓

echo.
echo Checking for .env.local file...
if not exist .env.local (
    echo WARNING: .env.local file not found!
    echo Creating template .env.local file...
    echo # Database Configuration > .env.local
    echo DATABASE_URL="postgresql://username:password@localhost:5432/database_name" >> .env.local
    echo. >> .env.local
    echo # OpenAI API Key >> .env.local
    echo OPENAI_API_KEY="your-openai-api-key-here" >> .env.local
    echo. >> .env.local
    echo # Supabase Configuration >> .env.local
    echo SUPABASE_URL="your-supabase-url" >> .env.local
    echo SUPABASE_KEY="your-supabase-service-role-key" >> .env.local
    echo.
    echo Please edit .env.local with your actual database credentials!
    echo.
)

echo Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo WARNING: Prisma generate failed. You may need to set up your database first.
)

echo.
echo ========================================
echo Setting up Frontend (frontend)
echo ========================================
cd ..\frontend

echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)
echo Frontend dependencies installed ✓

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Before running the application:
echo 1. Edit summarit\.env.local with your database credentials
echo 2. Set up your database (PostgreSQL or Supabase)
echo 3. Run: npx prisma db push (in summarit folder)
echo.
echo To start the application:
echo 1. Backend: cd summarit && npm run dev
echo 2. Frontend: cd frontend && npm run dev
echo.
echo Access the application at: http://localhost:5173
echo.
pause