import { NextRequest, NextResponse } from 'next/server'
import { getReports } from '../../../lib/supabase'

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

    const reports = await getReports(section, studentId)
    const filtered = Array.isArray(reports)
      ? reports.filter(r => !week || Number(r.weekNumber || 1) === Number(week))
      : []
    const text = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`).join(' ').trim()

    const KEYWORD_SETS: string[][] = [
      ['math', 'mathematics', 'science', 'algorithm', 'compute', 'analysis'],
      ['best practice', 'standard', 'policy', 'method', 'procedure', 'protocol'],
      ['analyze', 'analysis', 'problem', 'root cause', 'diagnose', 'troubleshoot'],
      ['user need', 'requirement', 'stakeholder', 'ux', 'usability'],
      ['design', 'implement', 'evaluate', 'build', 'develop', 'test', 'setup', 'configure', 'configuration', 'install'],
      ['safety', 'health', 'environment', 'security', 'ethical'],
      ['tool', 'framework', 'library', 'technology', 'platform'],
      ['team', 'collaborat', 'leader', 'group'],
      ['plan', 'schedule', 'timeline', 'project plan'],
      ['communicat', 'present', 'documentation', 'write', 'report'],
      ['impact', 'society', 'organization', 'community'],
      ['ethical', 'privacy', 'legal', 'compliance'],
      ['learn', 'self-study', 'latest', 'new skill'],
      ['research', 'experiment', 'study', 'investigation'],
      ['filipino', 'heritage', 'culture', 'tradition']
    ]
    
    const lower = text.toLowerCase()
    const counts = KEYWORD_SETS.map(set => {
      let count = 0
      for (const keyword of set) {
        if (lower.includes(keyword)) { count++; continue }
        const words = keyword.split(' ')
        if (words.length > 1 && words.some(w => lower.includes(w))) { count++; continue }
        const stem = keyword.replace(/(ing|ed|es|s)$/,'')
        if (stem.length > 3 && lower.includes(stem)) { count++; continue }
        const variations = [keyword + 's', keyword + 'ing', keyword + 'ed', keyword.replace(/s$/,'')]
        if (variations.some(v => lower.includes(v))) { count++; continue }
      }
      return count
    })
    const total = counts.reduce((a, b) => a + b, 0)
    const keywordScores = counts.map(c => total > 0 ? Math.round((c / total) * 100) : 0)

    let gptSummary: string | null = null
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && text) {
      const sys = 'You are an educational evaluator for BSIT internships. Your job is to analyze student OJT journal entries and determine which BSIT Program Outcomes (PO1–PO15) apply based on context and intent — not just keywords. Be objective, logical, and consistent.'
      const usr = `Analyze the following student journal entry and produce:\n\n1) A concise summary (2–3 sentences) of what the student actually did.\n2) A list of BSIT Program Outcomes (PO1–PO15) that are relevant based on context.\n3) A short reasoning (1–2 sentences) why each PO applies.\n4) If none clearly fit, write "No PO matched."\n\nEntry:\n${text}`
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ], temperature: 0.2 })
        })
        if (resp.ok) {
          const data = await resp.json()
          gptSummary = data?.choices?.[0]?.message?.content || null
        }
      } catch {}
    }

    const fallback = text ? text.slice(0, 240) : 'No journal entries found.'
    const summary = gptSummary || fallback

    return NextResponse.json({ summary, keywordScores, usedGPT: Boolean(gptSummary) }, { headers: corsHeaders as Record<string, string> })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
