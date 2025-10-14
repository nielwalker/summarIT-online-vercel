import { NextRequest, NextResponse } from 'next/server'
import { getReports } from '../../../lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// Helper function to calculate string similarity (Jaccard similarity)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2))
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2))
  
  const words1Array = Array.from(words1)
  const words2Array = Array.from(words2)
  
  const intersection = new Set(words1Array.filter(x => words2.has(x)))
  const union = new Set([...words1Array, ...words2Array])
  
  return intersection.size / union.size
}

// Helper function to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
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
    
    // For coordinator: get reports for the selected week only
    const reportsForSummary = analysisType === 'coordinator' 
      ? filtered // Get reports for the selected week only
      : filtered.filter(r => !r.excuse) // For chairman, use filtered reports
    
    console.log('All reports for student:', reports.length, 'Reports for summary:', reportsForSummary.length, 'Analysis type:', analysisType, 'Week numbers:', reportsForSummary.map(r => r.weekNumber))
    
    // Smart deduplication and compression for learnings
    const combinedEntries = reportsForSummary
      .map(r => `${r.learnings || ''}`.trim())
      .filter(Boolean)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .map(s => (/[.!?]$/.test(s) ? s : `${s}.`))
    
    // Step 1: Collect all daily learnings
    const rawText = combinedEntries.join(' ').trim()
    
    // Step 2: Merge & Clean - normalize and split into sentences
    const normalizedText = rawText.toLowerCase()
      .replace(/[^\w\s.,!?]/g, '') // Remove special chars except basic punctuation
      .replace(/\s+/g, ' ')
      .trim()
    
    // Step 3: Split into sentences and clean
    const sentences = normalizedText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10) // Filter out very short fragments
    
    // Step 4: Remove duplicates and similar sentences
    const uniqueSentences = new Set<string>()
    const compressedSentences: string[] = []
    
    for (const sentence of sentences) {
      let isDuplicate = false
      
      // Check for exact duplicates
      if (uniqueSentences.has(sentence)) {
        isDuplicate = true
      }
      
      // Check for similar sentences (basic similarity check)
      if (!isDuplicate) {
        const existingSentences = Array.from(uniqueSentences)
        for (const existing of existingSentences) {
          const similarity = calculateSimilarity(sentence, existing)
          if (similarity > 0.7) { // 70% similarity threshold
            isDuplicate = true
            break
          }
        }
      }
      
      if (!isDuplicate) {
        uniqueSentences.add(sentence)
        compressedSentences.push(sentence)
      }
    }
    
    // Step 5: Rebuild summary with proper formatting
    const text = compressedSentences
      .map(s => capitalizeFirst(s))
      .join('. ')
      .trim() + (compressedSentences.length > 0 ? '.' : '')
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
      // Coordinator weekly summary: rewrite into 2–3 natural sentences
      try {
        const sys = `You are a summarization assistant for BSIT internship journals.\n\nYou will receive cleaned and deduplicated learnings from the SELECTED WEEK of a student's internship. Your task is to create a concise summary (2–3 sentences) that captures their key learnings for this specific week.\n- The input has already been cleaned of duplicates and similar phrases from the selected week.\n- Create a coherent summary that captures the main learning insights from this week only.\n- Use proper grammar, punctuation, and professional tone.\n- Make it sound like a weekly learning summary for the selected week.\nReturn JSON: { "summary": string }.`

        const usr = `Cleaned learnings from selected week to summarize:\n${text}`

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ],
            temperature: 0.2
          })
        })
        if (resp.ok) {
          const data = await resp.json()
          const content = data?.choices?.[0]?.message?.content || ''
          try {
            const match = content.match(/```json[\s\S]*?```/i) || content.match(/\{[\s\S]*\}/)
            if (match) {
              const inner = match[0].replace(/```json|```/gi, '')
              const parsed = JSON.parse(inner)
              gptSummary = parsed.summary || content
            } else {
              gptSummary = content
            }
          } catch {
            gptSummary = content
          }
        }
      } catch (err) {
        console.error('GPT summarization failed:', err)
      }
    } else if (apiKey && text && useGPT && analysisType === 'chairman') {
      // Enhanced Chairman-specific GPT analysis with cleaned input
      const sys = `You are an expert evaluator analyzing BSIT internship journals for chairpersons.

Your goal is to provide ONLY an explanation of which Program Outcomes (POs) have been achieved and which have not been achieved.

The analysis should:
- Focus ONLY on explaining which POs have been hit/achieved and which have not.
- Do NOT provide any summary of activities or learnings.
- Do NOT provide any general text about the student's work.
- Simply list which POs were achieved and which were not achieved.
- Use clear, concise language.

CRITICAL: Provide ONLY PO achievement explanations. No summaries, no activities, no learnings. Just PO hit/miss status.`

      const usr = `Analyze the following cleaned student journal entry and provide ONLY an explanation of which Program Outcomes (POs) have been achieved:

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

Cleaned Entry:
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

     // Enhanced fallback summary for coordinator (weekly)
     let fallback = text || 'No journal entries found.'
     if (analysisType === 'coordinator' && text && !gptSummary) {
       // Create a more professional fallback summary for the selected week
       const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
       if (sentences.length > 0) {
         const keySentences = sentences.slice(0, 2) // Take first 2 meaningful sentences for weekly summary
         fallback = keySentences
           .map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1))
           .join('. ') + '.'
       }
     }
     
     const summary = gptSummary || fallback

    return NextResponse.json({ summary, keywordScores, usedGPT: Boolean(gptSummary) }, { headers: corsHeaders as Record<string, string> })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
