import { NextRequest, NextResponse } from 'next/server'
import { getReports, createReport, deleteReport } from '../../../lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders as Record<string, string> })
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const section = url.searchParams.get('section')
    const studentId = url.searchParams.get('studentId')
    
    // Use Supabase database only - no mock data fallbacks
    const reports = await getReports(section || undefined, studentId || undefined)
    
    return NextResponse.json(reports, { headers: corsHeaders as Record<string, string> })
  } catch (error: any) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports: ' + error.message }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log('Report submitted:', data)
    
    // Use Supabase database only - no mock data fallbacks
    const report = await createReport({
      userName: data.userName || 'Unknown',
      role: data.role || 'student',
      section: data.section || 'Unknown',
      studentId: data.studentId || null,
      weekNumber: data.weekNumber || 1,
      date: data.date || new Date().toISOString().split('T')[0],
      hours: data.hours || 0,
      activities: data.activities || '',
      learnings: data.learnings || ''
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report saved successfully',
      id: report.id
    }, { headers: corsHeaders as Record<string, string> })
    
  } catch (error: any) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Failed to save report: ' + error.message }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400, headers: corsHeaders as Record<string, string> })
    }
    
    console.log('Delete report:', id)
    
    // Use Supabase database only - no mock data fallbacks
    await deleteReport(parseInt(id))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully' 
    }, { headers: corsHeaders as Record<string, string> })
    
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete report: ' + error.message }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
