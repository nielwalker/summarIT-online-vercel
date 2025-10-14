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
      const sys = `You are a professional summarization assistant for BSIT chairman reports.\n\nCreate a human-written weekly summary (2–3 sentences) based ONLY on the provided entries for the selected section and week.\n- Avoid repeating phrases or listing daily entries.\n- Do not enumerate POs or include PO numbers.\n- Use a concise, professional tone.\nReturn only JSON in the format: { "summary for this section on a week": "..." }` 
      const usr = `Section: ${section || 'N/A'}\nWeek: ${week || 'N/A'}\n\nEntries for this section and week:\n${text}`
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ], temperature: 0.4, max_tokens: 220 })
        })
        if (resp.ok) {
          const data = await resp.json()
          const content = data?.choices?.[0]?.message?.content || ''
          const match = content.match(/```json[\s\S]*?```/i) || content.match(/\{[\s\S]*\}/)
          if (match) {
            const inner = match[0].replace(/```json|```/gi, '')
            const parsed = JSON.parse(inner)
            result = parsed['summary for this section on a week'] || parsed.summary || content
          } else {
            result = content
          }
        }
      } catch {}
    }

    // Build a simple paragraph fallback when GPT is unavailable
    let fallback = 'No journal entries found.'
    if (text) {
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
      const take = sentences.slice(0, Math.min(3, sentences.length))
      fallback = take.join('. ') + '.'
    }

    return NextResponse.json({ summary: result || fallback }, { headers: corsHeaders as Record<string, string> })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}


