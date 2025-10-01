# Student Practicum Report Management System - Setup Script
# PowerShell version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Student Practicum Report Management System" -ForegroundColor Cyan
Write-Host "Setup Script for Windows (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js is installed: $nodeVersion ✓" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm is installed: $npmVersion ✓" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Backend (summarit)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to backend directory
Set-Location "summarit"

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Backend dependencies installed ✓" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install backend dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for .env.local file
Write-Host "Checking for .env.local file..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "WARNING: .env.local file not found!" -ForegroundColor Yellow
    Write-Host "Creating template .env.local file..." -ForegroundColor Yellow
    
    $envContent = @"
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# OpenAI API Key
OPENAI_API_KEY="your-openai-api-key-here"

# Supabase Configuration
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-service-role-key"
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "Template .env.local file created ✓" -ForegroundColor Green
    Write-Host "Please edit .env.local with your actual database credentials!" -ForegroundColor Yellow
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "Prisma client generated ✓" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Prisma generate failed. You may need to set up your database first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend (frontend)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location "../frontend"

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Frontend dependencies installed ✓" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install frontend dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Before running the application:" -ForegroundColor Yellow
Write-Host "1. Edit summarit\.env.local with your database credentials" -ForegroundColor White
Write-Host "2. Set up your database (PostgreSQL or Supabase)" -ForegroundColor White
Write-Host "3. Run: npx prisma db push (in summarit folder)" -ForegroundColor White
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "1. Backend: cd summarit && npm run dev" -ForegroundColor White
Write-Host "2. Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Access the application at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
