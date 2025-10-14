import { NextRequest, NextResponse } from 'next/server'

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
    const text = body?.text || 'Students practiced web development using HTML and CSS, handled bugs, set up development environment, resolved Git merge conflicts, managed team collaboration using Git branches, summarized technical tasks for reports, initiated frontend design using HTML, CSS, and Bootstrap, implemented responsive design, configured hosting environment, performed database setup and configuration, monitored and handled errors, gathered and incorporated user feedback for website improvement, learned about organization goals and workflow, and practiced proper communication.'
    
    console.log('Test text:', text)
    
    // Generate PO explanations using keyword analysis
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
    
    const hit: Array<{ po: string; reason: string }> = []
    const notHit: Array<{ po: string; reason: string }> = []
    
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
        notHit.push({
          po: poNames[i],
          reason: `No evidence of ${poNames[i]} found in the reported activities and learnings`
        })
      }
    }
    
    function formatPosExplanation(title: string, items: Array<{ po: string; reason: string }>): string {
      if (!items || items.length === 0) return `${title}: None.`
      const lines = items.map(it => {
        const po = typeof it.po === 'string' ? it.po : String(it.po)
        const reason = typeof it.reason === 'string' ? it.reason : ''
        return `${po} – ${reason}`.trim()
      })
      return `${title}: ${lines.join('; ')}`
    }
    
    const posHitExplanation = formatPosExplanation('Explanation on the POs hit', hit)
    const posNotHitExplanation = formatPosExplanation('Explanation on the POs not hit', notHit)
    
    console.log('Generated explanations:', { posHitExplanation, posNotHitExplanation })
    
    return NextResponse.json({ 
      summary: 'Test summary for section during week',
      posHitExplanation, 
      posNotHitExplanation,
      hitCount: hit.length,
      notHitCount: notHit.length
    }, { headers: corsHeaders as Record<string, string> })
    
  } catch (err: any) {
    console.error('Test PO error:', err)
    return NextResponse.json({ error: 'Failed to test PO explanations' }, { status: 500, headers: corsHeaders as Record<string, string> })
  }
}
