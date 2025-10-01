# Complete Cleanup Instructions

## 1. Stop All Running Processes
Run the `clear-all.bat` file or manually:
```bash
# Stop all Node.js processes
taskkill /f /im node.exe
taskkill /f /im npm.exe
```

## 2. Clear Browser Storage
### Option A: Use the HTML file
1. Open `clear-storage.html` in your browser
2. Click "Clear All Local Storage"
3. Close the tab

### Option B: Manual browser cleanup
1. Open your browser (Chrome/Edge/Firefox)
2. Press `Ctrl+Shift+Delete`
3. Select "All time" or "Everything"
4. Check "Cached images and files" and "Cookies and other site data"
5. Click "Clear data"

## 3. Clear Database
### Option A: Reset via Prisma (Recommended)
```bash
cd summarit
npx prisma db push --force-reset
```

### Option B: Manual Supabase cleanup
1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Delete all rows from:
   - `WeeklyReport`
   - `User`
   - `StudentEnrollment`

## 4. Clear Node Modules (Optional)
If you want a completely fresh start:
```bash
# This might fail if processes are running, that's OK
rmdir /s /q frontend\node_modules
rmdir /s /q summarit\node_modules
rmdir /s /q summarit\.next
```

## 5. Restart Applications
```bash
# From the root directory
npm run dev
```

## 6. Test with Fresh Data
1. Register a student via Chairman dashboard
2. Login as that student
3. Submit a weekly report
4. Check the summary in Coordinator dashboard

## Troubleshooting
- If summary still shows old data, check browser Network tab to see what API calls are being made
- Ensure the database is actually empty by checking Supabase dashboard
- Make sure you're not using cached API responses (check browser DevTools)
