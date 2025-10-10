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
    if (apiKey && text && useGPT && analysisType === 'coordinator') {
      // Enhanced Coordinator-specific GPT analysis
      const sys = `You are an evaluator summarizing BSIT internship journals for coordinators.

Your goal is to create clear, concise, and context-based summaries that combine both Activities (what the student did) and Learnings (what the student understood or realized).

The summary should:
- Highlight the main tasks or technical work performed.
- Include the key learnings or reflections gained from those tasks.
- Avoid vague or repetitive phrases like "I learned a lot" or "It was a great experience."
- Focus on measurable actions and meaningful insights.
- If over all weeks is selected in drop down menu, also produce an overall summary of the entire OJT period.

Do not list Program Outcomes or graph data. Your output is only for coordinators to review student progress and learning context.`

      const usr = `Evaluate and summarize the following student journal entry:

**If data is for one week:**
- Write a weekly summary (2–3 sentences) combining the student's activities and learnings.

**If over all selected in drop down menu weeks:**
- Write an overall summary (1 short paragraph) describing the student's general tasks, skills, and learnings throughout the OJT.

Make it natural, factual, and clear.

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
    } else if (apiKey && text && useGPT && analysisType === 'chairman') {
      // Enhanced Chairman-specific GPT analysis
      const sys = `You are an expert evaluator for BSIT internship journals.

Your task is to analyze student entries (Activities and Learnings) and determine which BSIT Program Outcomes (PO1–PO15) are demonstrated, based on context and intent — not just keywords.

You will provide kinds of insights:
1. For each section selected in drop down menu— summarize week (for chairperson summary).
2. if all section selected in drop down menu — summarize all weeks together (for chairperson's overall section summary).
3. For overall analysis — provide comprehensive summary across all weeks for the selected section.

When identifying Program Outcome (PO) hits:
- Use both Activities (what they did) and Learnings (what they understood).
- Match a PO only when context clearly supports it.
- Mention which POs were hit, along with the reason why.
- Also mention why other POs were not hit, e.g., "No activity related to design or implementation was mentioned, so PO5 is not applicable."
- Avoid vague, filler statements like "I learned a lot" or "I helped the team."
- Use synonyms and related verbs (e.g., troubleshoot → analyze, build → design, collaborate → teamwork).

Your explanation must be logical, concise, and context-based.`

      const usr = `Evaluate the student's ${isOverall ? 'overall internship' : 'weekly journal'} entry below and produce the following:

**A. Summary for Chairperson's ${isOverall ? 'Overall Section' : 'Weekly'} View:**
- Write a concise paragraph (2–3 sentences) describing what the student${isOverall ? 's' : ''} actually did ${isOverall ? 'across all weeks' : 'that week'}, based on their Activities and Learnings.

**B. Program Outcome (PO) Mapping:**
1. List the POs that were hit, with a short reason why they apply.
2. List the POs that were not hit, with a short reason why they were excluded or irrelevant to the entry.
3. Avoid guessing — only match when clear evidence exists.

**BSIT Program Outcomes:**
a. PO1 – Apply knowledge of computing, science, and mathematics in solving computing/IT-related problems through critical and creative thinking.
b. PO2 – Use current best practices and standards in solving complex computing/IT-related problems and requirements.
c. PO3 – Analyze complex computing/IT-related problems by applying analytical and quantitative reasoning; and define the computing requirements appropriate to its solution.
d. PO4 – Identify and analyze user needs and take them into account in the selection, creation, evaluation and administration of computer-based systems.
e. PO5 – Design creatively, implement and evaluate different computer-based systems, processes, components, or programs to meet desired needs and requirements under various constraints.
f. PO6 – Integrate effectively the IT-based solutions into the user environment with appropriate consideration for public health and safety, cultural, societal, and environmental concerns.
g. PO7 – Select, adapt and apply appropriate techniques, resources, skills, and modern computing tools to complex computing activities, with an understanding of the limitations.
h. PO8 – Function effectively as individual, or work collaboratively and respectfully as a member or leader in diverse development teams and in multidisciplinary and/or multicultural settings.
i. PO9 – Assist in the creation of an effective IT project plan.
j. PO10 – Communicate effectively in both oral and in written form by being able to deliver and comprehend instructions clearly, and present persuasively to diverse audiences the complex computing/IT-related ideas and perspectives.
k. PO11 – Assess local and global impact of computing information technology on individuals, organizations, and society.
l. PO12 – Act in recognition of professional, ethical, legal, security and social responsibilities in the utilization of information technology.
m. PO13 – Recognize the need to engage in independent learning and keep pace with the latest developments in specialized IT fields (Database Management, Networking, Computer Vision, etc.).
n. PO14 – Participate in generation of new knowledge or research and development projects aligned with local/national goals, contributing to economic development.
o. PO15 – Preserve and promote Filipino historical and cultural heritage.

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

    const fallback = text ? text.slice(0, 240) : 'No journal entries found.'
    const summary = gptSummary || fallback

    return NextResponse.json({ summary, keywordScores, usedGPT: Boolean(gptSummary) }, { headers: corsHeaders as Record<string, string> })
  } catch (error: any) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
