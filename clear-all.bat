@echo off
echo Stopping all Node.js processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul

echo.
echo Clearing browser cache instructions:
echo 1. Open your browser (Chrome/Edge/Firefox)
echo 2. Press Ctrl+Shift+Delete
echo 3. Select "All time" or "Everything"
echo 4. Check "Cached images and files" and "Cookies and other site data"
echo 5. Click "Clear data"
echo.
echo OR use the clear-storage.html file in this directory
echo.
echo Clearing Supabase database...
echo Please manually clear your database tables:
echo - WeeklyReport
echo - User  
echo - StudentEnrollment
echo.
echo You can do this in Supabase dashboard or run:
echo npx prisma db push --force-reset
echo.
pause
