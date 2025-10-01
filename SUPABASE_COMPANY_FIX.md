# Fix Company Table Missing Columns

## Problem
The Company table in your Supabase database is missing the `address`, `supervisor`, and `contactNumber` columns, causing the update operation to fail.

## Solution
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Add missing columns to Company table
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "supervisor" TEXT,
ADD COLUMN IF NOT EXISTS "contactNumber" TEXT;
```

## Steps to Fix:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the SQL command above
4. Click "Run" to execute the command
5. Verify the columns were added by checking the Table Editor

## Alternative: Manual Column Addition
If the SQL doesn't work, you can manually add the columns in the Table Editor:

1. Go to Table Editor in Supabase
2. Select the "Company" table
3. Click "Add Column" for each missing field:
   - `address` (Text, nullable)
   - `supervisor` (Text, nullable) 
   - `contactNumber` (Text, nullable)

After adding these columns, the company update functionality should work properly.
