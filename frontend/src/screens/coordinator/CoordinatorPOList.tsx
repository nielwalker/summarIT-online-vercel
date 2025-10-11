import { useEffect, useState } from 'react'
import { getApiUrl } from '../../utils/api'

type Props = {
  section: string
  studentId?: string
  selectedWeek?: number
  showMonitoring?: boolean
}

// PO list removed from coordinator view (handled on chairman side only)

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
      console.log('All week numbers:', reports.map(r => r.weekNumber))
      // For coordinator summary, filter by selected week to show all days of that week
      const filtered = selectedWeek ? reports.filter(r => (r.weekNumber || 1) === selectedWeek) : reports
      console.log('Filtered reports:', filtered.length, 'Week numbers:', filtered.map(r => r.weekNumber))
      filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))
      // For summary text, use all reports for the selected week (including excuses for context)
      const text = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`).join(' ')
      console.log('Text length:', text.length, 'Text preview:', text.substring(0, 200) + '...')
      console.log('Individual report texts:', filtered.map(r => ({ week: r.weekNumber, activities: r.activities?.substring(0, 50), learnings: r.learnings?.substring(0, 50) })))
      const { scores, hitsPerPO } = extractHighlights(text)
      const items = scores
        .map((score, idx) => ({ idx, score, hits: hitsPerPO[idx] }))
        .filter(i => i.score > 0)
        .sort((a, b) => b.score - a.score)
      // Get coordinator-specific GPT summary
      let finalSummary = 'No submissions found.'
      if (text.trim()) {
        try {
          console.log('Sending summary request:', { section, studentId, selectedWeek })
          const summaryResp = await fetch(getApiUrl('/api/summary'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              section, 
              studentId,
              week: selectedWeek, // Use selected week for coordinator summary
              useGPT: true,
              analysisType: 'coordinator'
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
            const rawSummary = sentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim() // Limit to 2 sentences for brevity
            finalSummary = rawSummary ? `Week ${selectedWeek || ''} Summary: ${rawSummary}` : 'No submissions for this week.'
          }
        } catch (e) {
          console.error('Summary API error:', e)
          // Fallback to basic summary
          const sentences = filtered.map(r => `${r.activities || ''} ${r.learnings || ''}`.trim()).filter(Boolean)
          const rawSummary = sentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim() // Limit to 2 sentences for brevity
          finalSummary = rawSummary ? `Week ${selectedWeek || ''} Summary: ${rawSummary}` : 'No submissions for this week.'
        }
      }
      
      const summary = finalSummary
      
      // For monitoring, show all reports for the selected week (including excuses)
      const monitoringReports = filtered.map(r => ({
        date: r.date || '—',
        hours: Number(r.hours || 0),
        status: (r.activities || r.learnings) ? 'Submitted' as const : 'Missing' as const
      }))
      
      // Sort by date and limit to 6 entries (one per day)
      const sortedMonitoring = monitoringReports
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)
      
      // Pad with missing entries if less than 6
      const paddedRows: Array<{ date: string; hours: number; status: 'Submitted' | 'Missing' }> = [...sortedMonitoring]
      while (paddedRows.length < 6) {
        paddedRows.push({ date: '—', hours: 0, status: 'Missing' })
      }
      setAnalysis({ scores, bullets: items, summary, weekRows: paddedRows })
    } catch (e: any) {
      setError(e.message || 'Analysis failed')
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { analyze() }, [section, studentId, selectedWeek])

  // PO bullet display removed for coordinator view

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {error && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626' }}>{error}</div>
      )}
      {loading && (
        <div style={{ marginBottom: 12, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, color: '#0369a1' }}>
          {`Analyzing week ${selectedWeek}…`}
        </div>
      )}
      {analysis && (
        <div style={{ display: 'grid', gap: 12 }}>
          {!showMonitoring && (
            <div style={{ padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, color: '#000000', margin: '0 auto', width: '100%', maxWidth: 900 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#111827', fontSize: '16px' }}>Weekly Summary</div>
              <div style={{ textAlign: 'left' }}>
                {analysis.summary.split('.').filter(sentence => sentence.trim()).map((sentence, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ 
                      color: '#3b82f6', 
                      marginRight: '8px', 
                      marginTop: '2px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>•</span>
                    <span>{sentence.trim()}{sentence.trim() && !sentence.endsWith('.') ? '.' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        </div>
      )}
    </div>
  )
}


