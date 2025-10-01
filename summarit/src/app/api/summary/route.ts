import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders as Record<string, string> })
}

export async function POST(req: NextRequest) {
  try {
    const { section, studentId } = await req.json()
    
    // Mock summary for now
    const summary = "Student demonstrated strong technical skills in software development, including database design, API integration, and frontend development. Showed excellent problem-solving abilities and effective communication with team members."
    
    return NextResponse.json({ 
      summary 
    }, { headers: corsHeaders as Record<string, string> })
    
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
