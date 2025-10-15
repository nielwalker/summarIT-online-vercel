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

function extractPosArrays(raw: string | null | undefined): { hit: Array<{ po: string; reason: string }>; notHit: Array<{ po: string; reason: string }> } {
  try {
    if (!raw) return { hit: [], notHit: [] }
    let content = String(raw)
    content = content.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, ''))
    const parsed = JSON.parse(content)
    
    console.log('Extracting PO arrays from:', parsed)
    
    const pos_hit = Array.isArray(parsed.pos_hit) ? parsed.pos_hit : []
    const pos_not_hit = Array.isArray(parsed.pos_not_hit) ? parsed.pos_not_hit : []
    
    console.log('Extracted pos_hit:', pos_hit)
    console.log('Extracted pos_not_hit:', pos_not_hit)
    
    return { hit: pos_hit, notHit: pos_not_hit }
  } catch (error) {
    console.error('Error extracting PO arrays:', error)
    return { hit: [], notHit: [] }
  }
}

function formatPosExplanation(title: string, items: Array<{ po: string; reason: string }>, conclusion?: string): string {
  if (!items || items.length === 0) return `${title}: None.`
  
  // Create bullet points for each PO
  const bulletPoints = items.map(it => {
    const po = typeof it.po === 'string' ? it.po : String(it.po)
    const reason = typeof it.reason === 'string' ? it.reason : ''
    return `• ${po} – ${reason}`
  }).filter(Boolean)
  
  const bulletList = bulletPoints.join('\n')
  
  // Only use GPT-generated conclusion, no fallback
  if (conclusion) {
    return `${title}:\n${bulletList}\n\n${conclusion}`
  } else {
    return `${title}:\n${bulletList}`
  }
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
    let rawContent: string | null = null
    const apiKey = process.env.OPENAI_API_KEY
    
    console.log('API Key available:', !!apiKey)
    console.log('Use GPT:', useGPT)
    console.log('Text length:', text.length)
    
    if (apiKey && useGPT && text) {
      const sys = `You are an evaluator for BSIT internship journals.\n\nYour job is to:\n1. Correct and refine the student's writing (Activities and Learnings) so it's grammatically correct, well-punctuated, and clearly structured, without changing meaning.\n2. Identify which BSIT Program Outcomes (PO1–PO15) are achieved based on the corrected text.\n\nThe analysis must be accurate, context-based, and explainable. Avoid matching by single words — check meaning and intent.\n\nSection-wide policy:\n- You are summarizing the weekly reports for an entire SECTION for the selected WEEK (multiple students combined), not a single student.\n- Write strictly in third-person, neutral academic tone. Do NOT use first-person words ("I", "we", "my", "our"). Refer to "students" or "the section".\n- Avoid repeating phrases or listing daily entries; synthesize into themes.\n\nRules for Evaluation:\n1) Consider Activities (primary) and Learnings (secondary).\n2) Use Bloom's taxonomy verbs to judge cognitive level.\n3) Use keyword/synonym hints only as guidance, not triggers.\n4) For each PO, explain why it applies and why others do not (if not hit).\n5) Ignore vague filler statements.\n6) Before summarizing, automatically correct grammar/punctuation/structure of both Activities and Learnings (keep meaning).\n\nReference hints (guidance only):\nPO1 apply/compute/solve; PO2 standards/quality; PO3 analyze/test/debug; PO4 user needs/feedback; PO5 design/develop/implement; PO6 integrate/environment/safety; PO7 tools/configure; PO8 collaborate/team; PO9 plan/schedule/docs; PO10 communicate/present/report; PO11 impact/society; PO12 ethics/privacy/security; PO13 self-study/research; PO14 research/innovation; PO15 culture/heritage.\n\nIMPORTANT: For pos_hit and pos_not_hit arrays, provide detailed, specific explanations for each PO:\n- For pos_hit: Explain exactly how students demonstrated each PO through their activities\n- For pos_not_hit: Explain specifically why each PO was not achieved, what was missing\n- Make explanations clear, educational, and actionable\n\nReturn JSON strictly in this shape:\n{\n  "corrected_activities": string,\n  "corrected_learnings": string,\n  "summary for this section on a week": string,\n  "pos_hit": Array<{ po: string, reason: string }>,\n  "pos_not_hit": Array<{ po: string, reason: string }>,\n  "pos_hit_conclusion": string,\n  "pos_not_hit_conclusion": string\n}`

      const usr = `Evaluate the combined journal entries for Section ${section || 'N/A'} during Week ${week || 'N/A'} (multiple students). Aggregate the content below into a section-wide view.\n\nActivities & Learnings (raw, multi-student):\n${text}\n\nTasks:\n1) Correct grammar, punctuation, and structure (keep meaning).\n2) Create a short weekly summary (2–3 sentences) for the SECTION (not a single student), written in third-person with no first-person words.\n3) For pos_hit: List each PO that was achieved and provide a detailed explanation of HOW students demonstrated it through their specific activities.\n4) For pos_not_hit: List each PO that was not achieved and provide a specific explanation of WHY it wasn't achieved and what was missing from the activities.\n5) For pos_hit_conclusion: Write a 1-2 sentence conclusion that summarizes the overall impact and value of the achieved POs for student development.\n6) For pos_not_hit_conclusion: Write a 1-2 sentence conclusion that explains the significance of the gaps and provides guidance for future improvement.\n7) Make all explanations clear, educational, and actionable for improvement.\n8) If no POs match, write "No PO matched."`
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ], temperature: 0.4, max_tokens: 1200 })
        })
        if (resp.ok) {
          const data = await resp.json()
          rawContent = data?.choices?.[0]?.message?.content || ''
          console.log('GPT Raw Response:', rawContent)
          
          // Try to extract JSON from the response
          try {
            const jsonMatch = rawContent?.match(/```json[\s\S]*?```/i) || rawContent?.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const jsonStr = jsonMatch[0].replace(/```json|```/gi, '')
              const parsed = JSON.parse(jsonStr)
              console.log('Parsed GPT Response:', parsed)
              
              // Extract summary
              result = parsed['summary for this section on a week'] || parsed.summary || ''
              
              // Store the parsed JSON for PO extraction
              rawContent = JSON.stringify(parsed)
            } else {
              result = normalizeSummary(rawContent)
            }
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError)
            result = normalizeSummary(rawContent)
          }
        }
      } catch {}
    }

    // Only use GPT-generated summary, no fallback
    const finalSummary = normalizeSummary(result) || 'No analysis available - GPT processing required.'
    let { hit, notHit } = extractPosArrays(rawContent)
    
    // Extract conclusions from GPT response if available
    let hitConclusion: string | undefined
    let notHitConclusion: string | undefined
    
    try {
      if (rawContent) {
        const parsed = JSON.parse(rawContent)
        hitConclusion = parsed.pos_hit_conclusion
        notHitConclusion = parsed.pos_not_hit_conclusion
      }
    } catch (error) {
      console.error('Error extracting conclusions:', error)
    }
    
    // Only use GPT-generated PO analysis, no fallback
    if (!hit || hit.length === 0) {
      hit = []
    }
    if (!notHit || notHit.length === 0) {
      notHit = []
    }
    
    const posHitExplanation = formatPosExplanation('Explanation on the POs hit', hit, hitConclusion)
    const posNotHitExplanation = formatPosExplanation('Explanation on the POs not hit', notHit, notHitConclusion)

    console.log('Final response:', { 
      summary: finalSummary, 
      posHitExplanation, 
      posNotHitExplanation,
      hitCount: hit.length,
      notHitCount: notHit.length
    })

    return NextResponse.json({ summary: finalSummary, posHitExplanation, posNotHitExplanation }, { headers: corsHeaders as Record<string, string> })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}


