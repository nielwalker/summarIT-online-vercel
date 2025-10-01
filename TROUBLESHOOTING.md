# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 🚨 Critical Issues

#### 1. "Cannot find module" or "Module not found" errors
**Symptoms**: 
- `Error: Cannot find module 'react'`
- `Module not found: Can't resolve 'react-router-dom'`

**Solutions**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or for Windows:
rmdir /s node_modules
del package-lock.json
npm install
```

#### 2. Database Connection Errors
**Symptoms**:
- `Error: connect ECONNREFUSED`
- `PrismaClientInitializationError`
- `Database connection failed`

**Solutions**:
1. **Check .env.local file exists** in `summarit` folder
2. **Verify database URL format**:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```
3. **Test database connection**:
   ```bash
   cd summarit
   npx prisma db push
   ```

#### 3. Port Already in Use
**Symptoms**:
- `Error: listen EADDRINUSE :::3000`
- `Error: listen EADDRINUSE :::5173`

**Solutions**:
```bash
# Kill processes on ports
npx kill-port 3000
npx kill-port 5173

# Or manually kill processes
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### ⚠️ Warning Issues

#### 4. CORS Errors
**Symptoms**:
- `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solutions**:
- Ensure backend runs on port 3000
- Ensure frontend runs on port 5173
- Check that both servers are running

#### 5. OpenAI API Errors
**Symptoms**:
- `Error: Missing OPENAI_API_KEY`
- `Error: Invalid API key`

**Solutions**:
1. Get API key from https://platform.openai.com/api-keys
2. Add to `summarit/.env.local`:
   ```env
   OPENAI_API_KEY="sk-proj-your-key-here"
   ```
3. Restart backend server

#### 6. Prisma Errors
**Symptoms**:
- `Prisma schema not found`
- `Database schema is not up to date`

**Solutions**:
```bash
cd summarit
npx prisma generate
npx prisma db push
```

### 🔍 Debugging Steps

#### Step 1: Check Prerequisites
```bash
# Check Node.js
node --version  # Should be v18+

# Check npm
npm --version   # Should be v8+

# Check if ports are free
netstat -an | findstr :3000
netstat -an | findstr :5173
```

#### Step 2: Verify File Structure
```
summarize application/
├── frontend/
│   ├── package.json
│   ├── node_modules/
│   └── src/
├── summarit/
│   ├── package.json
│   ├── .env.local
│   ├── node_modules/
│   └── src/
└── DEPLOYMENT_GUIDE.md
```

#### Step 3: Check Environment Variables
```bash
# In summarit folder, verify .env.local exists and has:
cat .env.local  # Should show DATABASE_URL, OPENAI_API_KEY, etc.
```

#### Step 4: Test Database Connection
```bash
cd summarit
npx prisma db push  # Should succeed without errors
```

#### Step 5: Test API Endpoints
```bash
# Test backend health
curl http://localhost:3000/api/admin?action=listStudents&section=IT4R8

# Should return JSON array (empty or with data)
```

### 🆘 Emergency Reset

If nothing works, perform a complete reset:

```bash
# 1. Stop all servers (Ctrl+C in all terminal windows)

# 2. Clean everything
cd frontend
rm -rf node_modules package-lock.json
cd ../summarit
rm -rf node_modules package-lock.json

# 3. Reinstall everything
cd ../frontend
npm install
cd ../summarit
npm install

# 4. Regenerate Prisma
npx prisma generate

# 5. Start servers
cd ../summarit
npm run dev &
cd ../frontend
npm run dev
```

### 📞 Getting Help

If you're still having issues:

1. **Check the console output** for specific error messages
2. **Verify all prerequisites** are installed correctly
3. **Ensure database is accessible** and credentials are correct
4. **Check network connectivity** if using cloud database
5. **Try the emergency reset** procedure above

### 🎯 Quick Health Check

Run this to verify everything is working:

```bash
# 1. Check if servers are running
curl http://localhost:3000/api/admin?action=listStudents&section=IT4R8
curl http://localhost:5173

# 2. Check database connection
cd summarit
npx prisma db push

# 3. Check environment variables
cat .env.local | grep -E "(DATABASE_URL|OPENAI_API_KEY)"
```

All commands should succeed without errors for a healthy installation.
