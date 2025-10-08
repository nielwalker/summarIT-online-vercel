import { useEffect, useMemo, useState } from 'react'

type Props = {
  section: string
  studentId: string
  selectedWeek?: number
}

const PO_DEFS: Array<{ code: string; label: string; desc: string }> = [
  { code: 'A', label: 'PO1', desc: 'Apply knowledge of computing, science, and mathematics.' },
  { code: 'B', label: 'PO2', desc: 'Use current best practices and standards.' },
  { code: 'C', label: 'PO3', desc: 'Analyze complex computing/IT-related problems.' },
  { code: 'D', label: 'PO4', desc: 'Identify and analyze user needs.' },
  { code: 'E', label: 'PO5', desc: 'Design, implement, and evaluate systems.' },
  { code: 'F', label: 'PO6', desc: 'Integrate solutions considering public health/safety, etc.' },
  { code: 'G', label: 'PO7', desc: 'Apply appropriate techniques and tools.' },
  { code: 'H', label: 'PO8', desc: 'Work effectively in teams and lead when needed.' },
  { code: 'I', label: 'PO9', desc: 'Assist in creation of effective project plans.' },
  { code: 'J', label: 'PO10', desc: 'Communicate effectively.' },
  { code: 'K', label: 'PO11', desc: 'Assess local/global impact of IT.' },
  { code: 'L', label: 'PO12', desc: 'Act ethically and responsibly.' },
  { code: 'M', label: 'PO13', desc: 'Pursue independent learning.' },
  { code: 'N', label: 'PO14', desc: 'Participate in research and development.' },
  { code: 'O', label: 'PO15', desc: 'Preserve and promote Filipino historical and cultural heritage.' },
]

export default function CoordinatorPOList({ section, studentId, selectedWeek }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<{ scores: number[]; bullets: Array<{ idx: number; score: number; hits: string[] }>; summary: string } | null>(null)

  function extractHighlights(text: string): { scores: number[]; hitsPerPO: string[][] } {
    const lower = text.toLowerCase()
    const keywordSets: string[][] = [
      ['math', 'mathematics', 'science', 'algorithm', 'compute', 'analysis'],
      ['best practice', 'standard', 'policy', 'method', 'procedure', 'protocol'],
      ['analyze', 'analysis', 'problem', 'root cause', 'diagnose', 'troubleshoot'],
      ['user need', 'requirement', 'stakeholder', 'ux', 'usability'],
      ['design', 'implement', 'evaluate', 'build', 'develop', 'test'],
      ['safety', 'health', 'environment', 'security', 'ethical'],
      ['tool', 'framework', 'library', 'technology', 'platform'],
      ['team', 'collaborat', 'leader', 'group'],
      ['plan', 'schedule', 'timeline', 'project plan'],
      ['communicat', 'present', 'documentation', 'write', 'report'],
      ['impact', 'society', 'organization', 'community'],
      ['ethical', 'privacy', 'legal', 'compliance'],
      ['learn', 'self-study', 'latest', 'new skill'],
      ['research', 'experiment', 'study', 'investigation'],
      ['filipino', 'heritage', 'culture', 'tradition'],
    ]

    const hitsPerPO: string[][] = keywordSets.map(() => [])
    const counts = keywordSets.map((set, i) => {
      let count = 0
      const found = new Set<string>()
      set.forEach((kw) => {
        if (lower.includes(kw)) { count++; found.add(kw) }
      })
      hitsPerPO[i] = Array.from(found)
      return count
    })
    const total = counts.reduce((a, b) => a + b, 0)
    const scores = counts.map(c => total > 0 ? Math.round((c / total) * 100) : 0)
    return { scores, hitsPerPO }
  }

  async function analyze() {
    try {
      setLoading(true)
      setError(null)
      const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000'
      const resp = await fetch(`${base}/api/reports?section=${encodeURIComponent(section)}&studentId=${encodeURIComponent(studentId)}`)
      if (!resp.ok) throw new Error(`Failed to fetch reports: ${resp.status}`)
      const reports: any[] = await resp.json()
      const filtered = selectedWeek ? reports.filter(r => (r.weekNumber || 1) === selectedWeek) : reports
      const text = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`).join(' ')
      const { scores, hitsPerPO } = extractHighlights(text)
      const items = scores
        .map((score, idx) => ({ idx, score, hits: hitsPerPO[idx] }))
        .filter(i => i.score > 0)
        .sort((a, b) => b.score - a.score)
      const summary = filtered.length
        ? `Based on ${filtered.length} report${filtered.length > 1 ? 's' : ''}, keywords indicate the strongest evidence for the POs listed below. Only terms directly linked to the PO definitions are counted; generic words are ignored.`
        : 'No reports found for analysis.'
      setAnalysis({ scores, bullets: items, summary })
    } catch (e: any) {
      setError(e.message || 'Analysis failed')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { analyze() }, [section, studentId, selectedWeek])

  const bulletContent = useMemo(() => {
    if (!analysis) return null
    return analysis.bullets.map((b) => {
      const def = PO_DEFS[b.idx]
      const hitWords = b.hits.length ? ` — hits: ${b.hits.join(', ')}` : ''
      return (
        <li key={def.label} style={{ color: '#000000' }}>
          <strong>{def.label}</strong> ({b.score}%) — {def.desc}{hitWords}
        </li>
      )
    })
  }, [analysis])

  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      {error && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626' }}>{error}</div>
      )}
      {loading && (
        <div style={{ marginBottom: 12, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, color: '#0369a1' }}>Analyzing week {selectedWeek}…</div>
      )}
      {analysis && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, color: '#000000' }}>
            <strong>Summary:</strong> {analysis.summary}
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {bulletContent}
          </ul>
          <div style={{ padding: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, color: '#7c2d12' }}>
            <strong>Note on PO hits:</strong> We count explicit action words linked to each PO. Generic or vague words are ignored to avoid false positives. For more accurate interpretation, combine this with a context-based review (e.g., GPT) that reads the whole entry, not just keywords.
          </div>
        </div>
      )}
    </div>
  )
}


