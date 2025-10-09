import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import { getApiUrl } from '../../utils/api'

type Props = {
  section: string
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

export default function ChairmanDashboardPOList({ section, selectedWeek }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string>('')
  const [scores, setScores] = useState<number[]>(Array.from({ length: 15 }, () => 0))
  const [bullets, setBullets] = useState<Array<{ idx: number; score: number; hits: string[] }>>([])

  function extractHighlights(text: string): { scores: number[]; hitsPerPO: string[][] } {
    const lower = text.toLowerCase()
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
      ['filipino', 'heritage', 'culture', 'tradition'],
    ]

    // Flexible matcher adapted from coordinator logic
    function findMatches(t: string, keywords: string[]): { count: number; found: string[] } {
      let count = 0
      const found: string[] = []
      for (const keyword of keywords) {
        if (t.includes(keyword)) {
          count++; found.push(keyword); continue
        }
        const words = keyword.split(' ')
        if (words.length > 1 && words.some(w => t.includes(w))) {
          count++; found.push(keyword); continue
        }
        const stem = keyword.replace(/(ing|ed|es|s)$/,'')
        if (stem.length > 3 && t.includes(stem)) {
          count++; found.push(keyword); continue
        }
        const variations = [keyword + 's', keyword + 'ing', keyword + 'ed', keyword.replace(/s$/,'')]
        for (const v of variations) {
          if (t.includes(v)) { count++; found.push(keyword); break }
        }
      }
      return { count, found }
    }

    const hitsPerPO: string[][] = keywordSets.map(() => [])
    const counts = keywordSets.map((set, idx) => {
      const res = findMatches(lower, set)
      hitsPerPO[idx] = Array.from(new Set(res.found))
      return res.count
    })
    const total = counts.reduce((a, b) => a + b, 0)
    const perc = counts.map(c => total > 0 ? Math.round((c / total) * 100) : 0)
    return { scores: perc, hitsPerPO }
  }

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const base = getApiUrl('')
      // Fetch reports for the section (no student filter)
      const repUrl = getApiUrl(`/api/reports?section=${encodeURIComponent(section)}`)
      const repResp = await fetch(repUrl)
      if (!repResp.ok) throw new Error(`Failed to fetch reports: ${repResp.status}`)
      const reports = await repResp.json()
      const weekFiltered = Array.isArray(reports) && selectedWeek ? reports.filter((r: any) => Number(r.weekNumber || 1) === Number(selectedWeek)) : reports
      const text = (Array.isArray(weekFiltered) ? weekFiltered : []).map((r: any) => `${r.activities || ''} ${r.learnings || ''}`).join(' ')
      
      // Calculate local scores first
      const { scores: localScores, hitsPerPO } = extractHighlights(text)
      
      // Fetch contextual summary (hybrid, database-backed, week-scoped)
      const sumResp = await fetch(getApiUrl('/api/summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, week: selectedWeek })
      })
      
      let finalScores = localScores
      let finalSummary = text ? text.slice(0, 240) : 'No data available'
      
      if (sumResp.ok) {
        const s = await sumResp.json()
        if (s?.summary) finalSummary = s.summary
        if (Array.isArray(s?.keywordScores) && s.keywordScores.length === 15) {
          finalScores = s.keywordScores
        }
      }
      
      // Set scores and summary
      setScores(finalScores)
      setSummary(finalSummary)
      
      // Calculate bullets from FINAL scores
      const items = finalScores.map((s, idx) => ({ idx, score: s, hits: hitsPerPO[idx] || [] }))
        .filter(i => i.score > 0)
        .sort((a, b) => b.score - a.score)
      setBullets(items)
    } catch (e: any) {
      setError(e.message || 'Failed to analyze')
      setBullets([])
      setScores(Array.from({ length: 15 }, () => 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [section, selectedWeek])

  const chartData = useMemo(() => PO_DEFS.map((def, i) => ({ po: `${def.label} (${def.code})`, value: scores[i] || 0 })), [scores])

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {error && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626' }}>{error}</div>
      )}
      {loading && (
        <div style={{ marginBottom: 12, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, color: '#0369a1' }}>Analyzing…</div>
      )}
      {!!summary && (
        <div style={{ padding: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, color: '#000000', textAlign: 'left', marginBottom: 12 }}>
         {summary}
        </div>
      )}
      <ul style={{ margin: 0, paddingLeft: 20, color: '#000000' }}>
        {bullets.map(b => (
          <li key={b.idx}><strong>{PO_DEFS[b.idx].label}</strong> ({b.score}%) — {PO_DEFS[b.idx].desc}{b.hits.length ? ` — hits: ${b.hits.join(', ')}` : ''}</li>
        ))}
        {bullets.length === 0 && <li>No PO matched.</li>}
      </ul>
      {!loading && chartData.some(d => d.value > 0) && (
        <div style={{ width: '100%', height: 450, marginTop: 24, border: '1px solid #e5e7eb', borderRadius: 8, background: '#ffffff', padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#000000', fontSize: '16px' }}>Program Outcome Analysis</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 100 }}>
              <XAxis 
                dataKey="po" 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={120} 
                tick={{ fontSize: 10, fill: '#000000' }} 
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12, fill: '#000000' }} 
                width={50}
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#000000' } }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  formatter={(v: any) => v > 0 ? `${v}%` : ''} 
                  fill="#000000" 
                  style={{ fontSize: 11, fontWeight: 700 }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}


