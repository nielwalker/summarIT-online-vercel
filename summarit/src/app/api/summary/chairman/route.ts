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

function formatPosExplanation(title: string, items: Array<{ po: string; reason: string }>): string {
  if (!items || items.length === 0) return `${title}: None.`
  
  if (title.includes('hit')) {
    // For achieved POs, create a flowing paragraph without individual PO numbers
    const activities = items.map(it => {
      const reason = typeof it.reason === 'string' ? it.reason : ''
      // Extract the activity description after "through activities involving"
      const activityMatch = reason.match(/through activities involving (.+)$/)
      return activityMatch ? activityMatch[1] : reason
    }).filter(Boolean)
    
    const uniqueActivities = Array.from(new Set(activities))
    const activityText = uniqueActivities.join(', ')
    
    return `${title}: Students successfully demonstrated various program outcomes through their engagement in ${activityText}. These activities show their practical application of computing knowledge, problem-solving skills, and professional development in real-world scenarios.`
  } else {
    // For not achieved POs, keep the specific explanations
    const lines = items.map(it => {
      const po = typeof it.po === 'string' ? it.po : String(it.po)
      const reason = typeof it.reason === 'string' ? it.reason : ''
      return `${po} – ${reason}`.trim()
    })
    return `${title}: ${lines.join('; ')}`
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
      const sys = `You are an evaluator for BSIT internship journals.\n\nYour job is to:\n1. Correct and refine the student’s writing (Activities and Learnings) so it’s grammatically correct, well-punctuated, and clearly structured, without changing meaning.\n2. Identify which BSIT Program Outcomes (PO1–PO15) are achieved based on the corrected text.\n\nThe analysis must be accurate, context-based, and explainable. Avoid matching by single words — check meaning and intent.\n\nSection-wide policy:\n- You are summarizing the weekly reports for an entire SECTION for the selected WEEK (multiple students combined), not a single student.\n- Write strictly in third-person, neutral academic tone. Do NOT use first-person words ("I", "we", "my", "our"). Refer to "students" or "the section".\n- Avoid repeating phrases or listing daily entries; synthesize into themes.\n\nRules for Evaluation:\n1) Consider Activities (primary) and Learnings (secondary).\n2) Use Bloom’s taxonomy verbs to judge cognitive level.\n3) Use keyword/synonym hints only as guidance, not triggers.\n4) For each PO, explain why it applies and why others do not (if not hit).\n5) Ignore vague filler statements.\n6) Before summarizing, automatically correct grammar/punctuation/structure of both Activities and Learnings (keep meaning).\n\nReference hints (guidance only):\nPO1 apply/compute/solve; PO2 standards/quality; PO3 analyze/test/debug; PO4 user needs/feedback; PO5 design/develop/implement; PO6 integrate/environment/safety; PO7 tools/configure; PO8 collaborate/team; PO9 plan/schedule/docs; PO10 communicate/present/report; PO11 impact/society; PO12 ethics/privacy/security; PO13 self-study/research; PO14 research/innovation; PO15 culture/heritage.\n\nReturn JSON strictly in this shape:\n{\n  "corrected_activities": string,\n  "corrected_learnings": string,\n  "summary for this section on a week": string,\n  "pos_hit": Array<{ po: string, reason: string }>,\n  "pos_not_hit": Array<{ po: string, reason: string }>
}`

      const usr = `Evaluate the combined journal entries for Section ${section || 'N/A'} during Week ${week || 'N/A'} (multiple students). Aggregate the content below into a section-wide view.\n\nActivities & Learnings (raw, multi-student):\n${text}\n\nTasks:\n1) Correct grammar, punctuation, and structure (keep meaning).\n2) Create a short weekly summary (2–3 sentences) for the SECTION (not a single student), written in third-person with no first-person words.\n3) Identify the POs that were hit with brief reasons.\n4) Identify the POs that were not hit and explain why they don’t apply.\n5) If no POs match, write "No PO matched."`
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: sys }, { role: 'user', content: usr } ], temperature: 0.4, max_tokens: 800 })
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

    // Build a simple paragraph fallback when GPT is unavailable
    let fallback = 'No journal entries found.'
    if (text) {
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
      const take = sentences.slice(0, Math.min(3, sentences.length))
      fallback = take.join('. ') + '.'
    }

    const finalSummary = normalizeSummary(result) || normalizeSummary(fallback)
    let { hit, notHit } = extractPosArrays(rawContent)
    
    // Always generate PO explanations from keyword analysis (fallback method)
    if (text) {
      console.log('Generating fallback PO explanations from keyword analysis')
      const keywordSets: string[][] = [
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
      const poNames = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PO13', 'PO14', 'PO15']
      
      hit = []
      notHit = []
      
      for (let i = 0; i < keywordSets.length; i++) {
        const keywords = keywordSets[i]
        const hasMatch = keywords.some(keyword => lower.includes(keyword))
        
        if (hasMatch) {
          const matchedKeywords = keywords.filter(keyword => lower.includes(keyword))
          hit.push({
            po: poNames[i],
            reason: `Students demonstrated ${poNames[i]} through activities involving ${matchedKeywords.slice(0, 3).join(', ')}`
          })
        } else {
          // Provide specific reasons why each PO wasn't achieved
          const specificReasons: { [key: string]: string } = {
            'PO1': 'Students did not demonstrate application of mathematical or scientific knowledge in problem-solving',
            'PO2': 'Students did not follow established best practices or industry standards in their work',
            'PO3': 'Students did not perform complex analysis or troubleshooting of computing problems',
            'PO4': 'Students did not identify or analyze user needs and requirements',
            'PO5': 'Students did not engage in system design, implementation, or evaluation activities',
            'PO6': 'Students did not consider environmental, safety, or sustainability factors in their solutions',
            'PO7': 'Students did not utilize appropriate modern tools or technologies effectively',
            'PO8': 'Students did not demonstrate teamwork, collaboration, or leadership skills',
            'PO9': 'Students did not participate in project planning, scheduling, or documentation activities',
            'PO10': 'Students did not engage in effective communication, presentation, or reporting',
            'PO11': 'Students did not assess the societal or organizational impact of their work',
            'PO12': 'Students did not demonstrate ethical considerations, privacy awareness, or security practices',
            'PO13': 'Students did not show evidence of independent learning or skill development',
            'PO14': 'Students did not engage in research, innovation, or development activities',
            'PO15': 'Students did not demonstrate awareness of Filipino culture, heritage, or values'
          }
          
          notHit.push({
            po: poNames[i],
            reason: specificReasons[poNames[i]] || `No evidence of ${poNames[i]} found in the reported activities and learnings`
          })
        }
      }
    }
    
    const posHitExplanation = formatPosExplanation('Explanation on the POs hit', hit)
    const posNotHitExplanation = formatPosExplanation('Explanation on the POs not hit', notHit)

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


