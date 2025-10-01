-- Add missing columns to Company table in Supabase
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "supervisor" TEXT,
ADD COLUMN IF NOT EXISTS "contactNumber" TEXT;
