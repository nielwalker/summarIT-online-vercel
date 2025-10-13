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
    const useGPT = body?.useGPT as boolean | undefined
    const analysisType = body?.analysisType as string | undefined
    const isOverall = body?.isOverall as boolean | undefined

    console.log('Summary request:', { section, studentId, week, isOverall, analysisType })
    const reports = await getReports(section, studentId)
    console.log('All reports from DB:', reports.length, 'Week numbers:', reports.map(r => r.weekNumber))
    const filtered = Array.isArray(reports)
      ? (isOverall ? reports : reports.filter(r => !week || Number(r.weekNumber || 1) === Number(week)))
      : []
    
    // For coordinator summaries, use all reports for the selected week
    // For chairman summaries, only use reports with actual content (no excuses)
    const reportsForSummary = analysisType === 'coordinator' ? filtered : filtered.filter(r => !r.excuse)
    console.log('All reports for week:', filtered.length, 'Reports for summary:', reportsForSummary.length, 'Analysis type:', analysisType, 'Week numbers:', filtered.map(r => r.weekNumber))
    // Build a robust combined text. Ensure each entry becomes a complete sentence
    const combinedEntries = reportsForSummary
      .map(r => `${r.activities || ''} ${r.learnings || ''}`.trim())
      .filter(Boolean)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .map(s => (/[.!?]$/.test(s) ? s : `${s}.`))
    const text = combinedEntries.join(' ').trim()
    console.log('Text length:', text.length, 'Text preview:', text.substring(0, 200) + '...')
    console.log('Individual report texts:', reportsForSummary.map(r => ({ week: r.weekNumber, activities: r.activities?.substring(0, 50), learnings: r.learnings?.substring(0, 50) })))

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
    if (apiKey && text && useGPT && analysisType === 'coordinator') {
      // New two-step coordinator flow: (1) Grammar correction, (2) 2–3 sentence summary
      const activitiesText = reportsForSummary.map(r => r.activities || '').filter(Boolean).join(' ')
      const learningsText = reportsForSummary.map(r => r.learnings || '').filter(Boolean).join(' ')

      const extractJson = (str: string | null | undefined): any | null => {
        if (!str) return null
        try {
          return JSON.parse(str)
        } catch {}
        const match = str.match(/```json[\s\S]*?```/i) || str.match(/\{[\s\S]*\}/)
        if (match) {
          const inner = match[0].replace(/```json|```/gi, '')
          try { return JSON.parse(inner) } catch {}
        }
        return null
      }

      // Step 1: Grammar correction
      let correctedActivities = activitiesText
      let correctedLearnings = learningsText
      try {
        const sys1 = `You are a language editor. Correct the grammar, punctuation, and structure of the following Activities and Learnings. Keep the original meaning. Do not summarize or merge them. Return results in JSON format.`
        const usr1 = `Activities: ${activitiesText}\n\nLearnings: ${learningsText}`
        const resp1 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [ { role: 'system', content: sys1 }, { role: 'user', content: usr1 } ],
            temperature: 0
          })
        })
        if (resp1.ok) {
          const data1 = await resp1.json()
          const content1 = data1?.choices?.[0]?.message?.content as string
          const json1 = extractJson(content1)
          if (json1) {
            correctedActivities = json1.corrected_activities || correctedActivities
            correctedLearnings = json1.corrected_learnings || correctedLearnings
          }
        }
      } catch {}

      // Step 2: 2–3 sentence weekly summary (rewrite + summarize Activities and Learnings)
      try {
        const sys2 = `You are a summarization assistant for BSIT internship journals.\n\nYour task is to rewrite and summarize the student's Activities and Learnings into a short, natural, and grammatically correct paragraph (2–3 sentences).\n- Do not simply combine or list the sentences.\n- Rephrase the input into a single, smooth paragraph that reads naturally.\n- Use proper grammar, punctuation, and flow.\n- Keep the original meaning.\n- Ignore filler phrases like "I learned a lot" or "It was a good week."\n\nMake the summary sound natural and professionally written, as if it were part of a formal OJT report. Return JSON with a single field: { "summary": string }.`
        const usr2 = `Activities: ${correctedActivities}\n\nLearnings: ${correctedLearnings}`
        const resp2 = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [ { role: 'system', content: sys2 }, { role: 'user', content: usr2 } ],
            temperature: 0.2
          })
        })
        if (resp2.ok) {
          const data2 = await resp2.json()
          const content2 = data2?.choices?.[0]?.message?.content as string
          const json2 = extractJson(content2)
          gptSummary = (json2 && (json2.summary as string)) || content2 || null
        }
      } catch {}
    } else if (apiKey && text && useGPT && analysisType === 'chairman') {
      // Enhanced Chairman-specific GPT analysis
      const sys = `You are an expert evaluator analyzing BSIT internship journals for chairpersons.

Your goal is to provide ONLY an explanation of which Program Outcomes (POs) have been achieved and which have not been achieved.

The analysis should:
- Focus ONLY on explaining which POs have been hit/achieved and which have not.
- Do NOT provide any summary of activities or learnings.
- Do NOT provide any general text about the student's work.
- Simply list which POs were achieved and which were not achieved.
- Use clear, concise language.

CRITICAL: Provide ONLY PO achievement explanations. No summaries, no activities, no learnings. Just PO hit/miss status.`

      const usr = `Analyze the following student journal entry and provide ONLY an explanation of which Program Outcomes (POs) have been achieved:

**If data is for one week:**
- Analyze which POs were achieved in this week's activities and learnings.

**If overall analysis:**
- Analyze which POs were achieved throughout the entire OJT period.

Requirements:
- Provide ONLY PO achievement explanations.
- List which POs were hit/achieved and which were not.
- Do NOT provide any summary of activities or learnings.
- Do NOT provide any general text about the student's work.
- Focus solely on PO hit/miss status.

Entry:
${text}`

      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ 
            model: 'gpt-4o-mini', 
            messages: [ 
              { role: 'system', content: sys }, 
              { role: 'user', content: usr } 
            ], 
            temperature: 0.2 
          })
        })
        if (resp.ok) {
          const data = await resp.json()
          gptSummary = data?.choices?.[0]?.message?.content || null
        }
      } catch {}
    } else if (apiKey && text) {
      // Fallback to original GPT analysis for other types
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

    const fallback = text || 'No journal entries found.'
    const summary = gptSummary || fallback

    return NextResponse.json({ summary, keywordScores, usedGPT: Boolean(gptSummary) }, { headers: corsHeaders as Record<string, string> })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
