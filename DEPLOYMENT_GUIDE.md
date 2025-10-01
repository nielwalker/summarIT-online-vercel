# Student Practicum Report Management System - Deployment Guide

## 🚀 Complete Setup Guide for New Computer

This guide will help you set up the Student Practicum Report Management System on any computer without errors.

## 📋 Prerequisites

### Required Software (Install in this order):
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **PostgreSQL** (Database)
   - Download from: https://www.postgresql.org/download/
   - Or use Supabase (cloud database) - recommended for easier setup

## 🗂️ Project Structure
```
summarize application/
├── frontend/          # React/Vite frontend
├── summarit/          # Next.js backend
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## 🔧 Step-by-Step Setup

### Step 1: Clone/Transfer the Project
```bash
# Option A: If using Git
git clone <repository-url>
cd "summarize application"

# Option B: If transferring files
# Copy the entire "summarize application" folder to the new computer
```

### Step 2: Backend Setup (summarit folder)

#### 2.1 Navigate to Backend Directory
```bash
cd summarit
```

#### 2.2 Install Dependencies
```bash
npm install
```

#### 2.3 Set Up Environment Variables
Create a file named `.env.local` in the `summarit` folder:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# OpenAI API Key (for AI summaries)
OPENAI_API_KEY="your-openai-api-key-here"

# Supabase Configuration (if using Supabase)
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-service-role-key"
```

#### 2.4 Database Setup Options

**Option A: Using Supabase (Recommended - Easier)**
1. Go to https://supabase.com
2. Create a new project
3. Get your database URL and keys
4. Update `.env.local` with your Supabase credentials

**Option B: Local PostgreSQL**
1. Install PostgreSQL
2. Create a database
3. Update `DATABASE_URL` in `.env.local`

#### 2.5 Initialize Database Schema
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

#### 2.6 Start Backend Server
```bash
npm run dev
```
Backend will run on: http://localhost:3000

### Step 3: Frontend Setup (frontend folder)

#### 3.1 Navigate to Frontend Directory
```bash
cd ../frontend
```

#### 3.2 Install Dependencies
```bash
npm install
```

#### 3.3 Start Frontend Server
```bash
npm run dev
```
Frontend will run on: http://localhost:5173

## 🌐 Access the Application

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:3000

## 🔑 Default Login Credentials

### Chairman Login:
- **Student ID**: Any valid student ID (for testing)
- **Role**: chairman

### Coordinator Login:
- **Student ID**: Any valid student ID (for testing)  
- **Role**: coordinator

### Student Login:
- **Student ID**: Must be registered by chairman first
- **Role**: student

## 🛠️ Troubleshooting Common Issues

### Issue 1: "Cannot find module" errors
**Solution**: Run `npm install` in both frontend and summarit folders

### Issue 2: Database connection errors
**Solutions**:
- Check your `.env.local` file has correct database URL
- Ensure database server is running
- Verify database credentials

### Issue 3: Port already in use
**Solutions**:
- Kill existing processes: `npx kill-port 3000` and `npx kill-port 5173`
- Or change ports in package.json scripts

### Issue 4: CORS errors
**Solution**: Ensure backend is running on port 3000 and frontend on port 5173

### Issue 5: OpenAI API errors
**Solution**: 
- Get API key from https://platform.openai.com/api-keys
- Add it to `.env.local` as `OPENAI_API_KEY`

## 📱 Production Deployment

### For Production Use:

#### 1. Build the Application
```bash
# Backend
cd summarit
npm run build

# Frontend  
cd ../frontend
npm run build
```

#### 2. Environment Variables for Production
Update `.env.local` with production database and API keys.

#### 3. Start Production Servers
```bash
# Backend
cd summarit
npm start

# Frontend (serve built files)
cd ../frontend
npm run preview
```

## 🔒 Security Notes

1. **Never commit `.env.local`** to version control
2. **Use strong database passwords**
3. **Keep API keys secure**
4. **Use HTTPS in production**

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure database connection is working
4. Check that both servers are running

## 🎯 Quick Start Commands

```bash
# Complete setup in one go
cd summarit && npm install && npx prisma generate && npx prisma db push && npm run dev &
cd ../frontend && npm install && npm run dev
```

## 📊 Features Overview

- **Chairman Dashboard**: Register students/coordinators, view section summaries
- **Coordinator Dashboard**: View individual student progress
- **Student Dashboard**: Submit weekly reports
- **AI-Powered Analysis**: Automatic PO (Program Outcome) scoring
- **Week-by-Week Analysis**: Filter reports by specific weeks
- **CSV Export**: Download analysis reports

## 🗃️ Database Schema

The system uses these main tables:
- `StudentEnrollment`: Student information
- `Coordinator`: Coordinator information  
- `WeeklyReport`: Student weekly reports
- `Company`: Company information

---

**Note**: This application requires both frontend and backend to be running simultaneously for full functionality.
