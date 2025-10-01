// Script to add missing columns to Company table in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addCompanyColumns() {
  try {
    console.log('Adding missing columns to Company table...')
    
    // Execute SQL to add the missing columns
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE "Company" 
        ADD COLUMN IF NOT EXISTS "address" TEXT,
        ADD COLUMN IF NOT EXISTS "supervisor" TEXT,
        ADD COLUMN IF NOT EXISTS "contactNumber" TEXT;
      `
    })

    if (error) {
      console.error('Error adding columns:', error)
      return
    }

    console.log('Successfully added columns to Company table')
    console.log('Columns added: address, supervisor, contactNumber')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

addCompanyColumns()
