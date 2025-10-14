import { NextRequest, NextResponse } from 'next/server'
import { getReports } from '../../../../lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// Normalize any model output that may contain JSON or code fences
function normalizeSummary(raw: string | null | undefined): string {
  if (!raw) return ''
  let content = String(raw).trim()
  // Remove code fences
  content = content.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, ''))
  // Try to parse as JSON with common keys
  try {
    const parsed = JSON.parse(content)
    const v = parsed['summary for this section on a week'] || parsed.summary || parsed.result
    if (typeof v === 'string' && v.trim()) return v.trim()
  } catch {}
  // Try to extract summary value via regex
  const m = content.match(/"summary for this section on a week"\s*:\s*"([\s\S]*?)"/i) || content.match(/"summary"\s*:\s*"([\s\S]*?)"/i)
  if (m && m[1]) return m[1].trim()
  // Strip leading/trailing braces and quotes if present
  content = content.replace(/^\{\s*|\s*\}$/g, '')
  content = content.replace(/^"|"$/g, '')
  return content.trim()
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
      const sys = `You are an evaluator for BSIT internship journals.

Your job is to:
1. Correct and refine the student’s writing (Activities and Learnings) so it’s grammatically correct, well-punctuated, and clearly structured, without changing meaning.
2. Identify which BSIT Program Outcomes (PO1–PO15) are achieved based on the corrected text.

The analysis must be accurate, context-based, and explainable. Avoid matching by single words — check meaning and intent.

Rules for Evaluation:
1) Consider Activities (primary) and Learnings (secondary).
2) Use Bloom’s taxonomy verbs to judge cognitive level.
3) Use keyword/synonym hints only as guidance, not triggers.
4) For each PO, explain why it applies and why others do not (if not hit).
5) Ignore vague filler statements.
6) Before summarizing, automatically correct grammar/punctuation/structure of both Activities and Learnings (keep meaning).

Reference hints (guidance only):
PO1 apply/compute/solve; PO2 standards/quality; PO3 analyze/test/debug; PO4 user needs/feedback; PO5 design/develop/implement; PO6 integrate/environment/safety; PO7 tools/configure; PO8 collaborate/team; PO9 plan/schedule/docs; PO10 communicate/present/report; PO11 impact/society; PO12 ethics/privacy/security; PO13 self-study/research; PO14 research/innovation; PO15 culture/heritage.

Return JSON strictly in this shape:
{
  "corrected_activities": string,
  "corrected_learnings": string,
  "summary for this section on a week": string,
  "pos_hit": Array<{ po: string, reason: string }>,
  "pos_not_hit": Array<{ po: string, reason: string }>
}`

      const usr = `Evaluate the following for Section ${section || 'N/A'}, Week ${week || 'N/A'}.

Activities & Learnings (raw):
${text}

Tasks:
1) Correct grammar, punctuation, and structure (keep meaning).
2) Create a short weekly summary (2–3 sentences) combining corrected Activities and Learnings.
3) Identify the POs that were hit and briefly explain why.
4) Identify the POs that were not hit and explain why they don’t apply.
5) If no POs match, write "No PO matched."`
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ], temperature: 0.4, max_tokens: 220 })
        })
        if (resp.ok) {
          const data = await resp.json()
          const content = data?.choices?.[0]?.message?.content || ''
          result = normalizeSummary(content)
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

    const finalSummary = normalizeSummary(result) || normalizeSummary(fallback)
    return NextResponse.json({ summary: finalSummary }, { headers: corsHeaders as Record<string, string> })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}


