import { NextRequest, NextResponse } from 'next/server'
import { getReports } from '../../../../lib/supabase'

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
    const body = await req.json().catch(() => null) as any
    const section = body?.section as string | undefined
    const studentId = body?.studentId as string | undefined
    const week = body?.week as number | undefined
    const isOverall = body?.isOverall as boolean | undefined
    const useGPT = body?.useGPT as boolean | undefined

    const reports = await getReports(section, studentId)
    const filtered = Array.isArray(reports)
      ? (isOverall ? reports : reports.filter(r => !week || Number(r.weekNumber || 1) === Number(week)))
      : []

    const entries = filtered
      .filter(r => !r.excuse)
      .map(r => `${r.activities || ''} ${r.learnings || ''}`.trim())
      .filter(Boolean)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .map(s => (/[.!?]$/.test(s) ? s : `${s}.`))
    const text = entries.join(' ').trim()

    let result: string | null = null
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && useGPT && text) {
      const sys = `You are an expert evaluator analyzing BSIT internship journals for chairpersons.\nYour goal is to provide ONLY an explanation of which Program Outcomes (POs) have been achieved and which have not been achieved.\n- Focus ONLY on explaining which POs have been hit/achieved and which have not.\n- Do NOT provide any summary of activities or learnings.\n- Do NOT provide any general text about the student's work.\n- Simply list which POs were achieved and which were not achieved.\n- Use clear, concise language.`
      const usr = `Entry:\n${text}`
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ], temperature: 0.2 })
        })
        if (resp.ok) {
          const data = await resp.json()
          result = data?.choices?.[0]?.message?.content || null
        }
      } catch {}
    }

    return NextResponse.json({ summary: result || text || 'No journal entries found.' }, { headers: corsHeaders as Record<string, string> })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}


