import { useEffect, useMemo, useState } from 'react'
import { getApiUrl } from '../../utils/api'

type Props = {
  section: string
  studentId?: string
  selectedWeek?: number | 'overall'
  showMonitoring?: boolean
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

export default function CoordinatorPOList({ section, studentId, selectedWeek, showMonitoring = true }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<{ scores: number[]; bullets: Array<{ idx: number; score: number; hits: string[] }>; summary: string; weekRows: Array<{ date: string; hours: number; status: 'Submitted' | 'Missing' }> } | null>(null)

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
      const url = getApiUrl(`/api/reports?section=${encodeURIComponent(section)}${studentId ? `&studentId=${encodeURIComponent(studentId)}` : ''}`)
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`Failed to fetch reports: ${resp.status}`)
      const reports: any[] = await resp.json()
      console.log('All reports:', reports.length, 'Selected week:', selectedWeek)
      const filtered = selectedWeek && selectedWeek !== 'overall' ? reports.filter(r => (r.weekNumber || 1) === selectedWeek) : reports
      console.log('Filtered reports:', filtered.length, 'Week numbers:', filtered.map(r => r.weekNumber))
      filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))
      const text = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`).join(' ')
      console.log('Text length:', text.length, 'Text preview:', text.substring(0, 100) + '...')
      const { scores, hitsPerPO } = extractHighlights(text)
      const items = scores
        .map((score, idx) => ({ idx, score, hits: hitsPerPO[idx] }))
        .filter(i => i.score > 0)
        .sort((a, b) => b.score - a.score)
      // Get coordinator-specific GPT summary
      let finalSummary = 'No submissions found.'
      if (text.trim()) {
        try {
          console.log('Sending summary request:', { section, studentId, selectedWeek, isOverall: selectedWeek === 'overall' })
          const summaryResp = await fetch(getApiUrl('/api/summary'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              section, 
              studentId,
              week: selectedWeek === 'overall' ? undefined : selectedWeek,
              useGPT: true,
              analysisType: 'coordinator',
              isOverall: selectedWeek === 'overall'
            })
          })
          
          if (summaryResp.ok) {
            const summaryData = await summaryResp.json()
            console.log('GPT summary received:', summaryData.summary)
            finalSummary = summaryData.summary || finalSummary
          } else {
            console.error('GPT summary failed, using fallback')
            // Fallback to basic summary
            const sentences = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`.trim()).filter(Boolean)
            const rawSummary = sentences.join(' ').replace(/\s+/g, ' ').trim() // Removed sentence limit
            finalSummary = rawSummary ? 
              (selectedWeek === 'overall' ? 
                `Overall Summary: ${rawSummary}` : 
                `Week ${selectedWeek || ''} Summary: ${rawSummary}`) : 
              (selectedWeek === 'overall' ? 'No submissions found.' : 'No submissions for this week.')
          }
        } catch (e) {
          console.error('Summary API error:', e)
          // Fallback to basic summary
          const sentences = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`.trim()).filter(Boolean)
          const rawSummary = sentences.join(' ').replace(/\s+/g, ' ').trim() // Removed sentence limit
          finalSummary = rawSummary ? 
            (selectedWeek === 'overall' ? 
              `Overall Summary: ${rawSummary}` : 
              `Week ${selectedWeek || ''} Summary: ${rawSummary}`) : 
            (selectedWeek === 'overall' ? 'No submissions found.' : 'No submissions for this week.')
        }
      }
      
      const summary = finalSummary
      const uniqByDate = new Map<string, { date: string; hours: number }>()
      filtered.forEach(r => {
        const key = String(r.date || '')
        if (!uniqByDate.has(key)) uniqByDate.set(key, { date: key || '—', hours: Number(r.hours || 0) })
      })
      const submittedRows = Array.from(uniqByDate.values()).slice(0, 5).map(r => ({ date: r.date || '—', hours: r.hours || 0, status: 'Submitted' as const }))
      const paddedRows: Array<{ date: string; hours: number; status: 'Submitted' | 'Missing' }> = [...submittedRows]
      while (paddedRows.length < 5) paddedRows.push({ date: '—', hours: 0, status: 'Missing' })
      setAnalysis({ scores, bullets: items, summary, weekRows: paddedRows })
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
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {error && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626' }}>{error}</div>
      )}
      {loading && (
        <div style={{ marginBottom: 12, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, color: '#0369a1' }}>
          {selectedWeek === 'overall' ? 'Analyzing overall progress…' : `Analyzing week ${selectedWeek}…`}
        </div>
      )}
      {analysis && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, color: '#000000', textAlign: 'center', margin: '0 auto', width: '100%', maxWidth: 900 }}>
           {analysis.summary}
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {bulletContent}
          </ul>
          {showMonitoring && (
            <div style={{ padding: 12, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, margin: '0 auto', width: '100%', maxWidth: 900 }}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#000000' }}>Week {selectedWeek} Monitoring</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Hours</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.weekRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{r.date}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{r.hours}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, background: r.status === 'Submitted' ? '#dcfce7' : '#fee2e2', color: r.status === 'Submitted' ? '#166534' : '#991b1b', fontSize: 12, fontWeight: 600 }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, color: '#7c2d12' }}>
            <strong>Note on PO hits:</strong> We count explicit action words linked to each PO. Generic or vague words are ignored to avoid false positives.
          </div>
        </div>
      )}
    </div>
  )
}


