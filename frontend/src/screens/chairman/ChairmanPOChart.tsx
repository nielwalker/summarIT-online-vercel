import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'

type Props = {
  section: string
  selectedWeek?: number
  title?: string
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

export default function ChairmanPOChart({ section, selectedWeek, title }: Props) {
  const [scores, setScores] = useState<number[]>(Array.from({ length: 15 }, () => 0))
  const [error, setError] = useState<string | null>(null)

  function extractHighlights(text: string): number[] {
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
    const counts = keywordSets.map((set) => {
      let count = 0
      for (const kw of set) {
        if (lower.includes(kw)) { count++; continue }
        const words = kw.split(' ')
        if (words.length > 1 && words.some(w => lower.includes(w))) { count++; continue }
        const stem = kw.replace(/(ing|ed|es|s)$/,'')
        if (stem.length > 3 && lower.includes(stem)) { count++; continue }
        const variations = [kw + 's', kw + 'ing', kw + 'ed', kw.replace(/s$/,'')]
        if (variations.some(v => lower.includes(v))) { count++; continue }
      }
      return count
    })
    const total = counts.reduce((a, b) => a + b, 0)
    return counts.map(c => total > 0 ? Math.round((c / total) * 100) : 0)
  }

  async function analyze() {
    try {
      setError(null)
      const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000'
      const resp = await fetch(`${base}/api/reports?section=${encodeURIComponent(section)}`)
      if (!resp.ok) throw new Error(`Failed to fetch reports: ${resp.status}`)
      const reports: any[] = await resp.json()
      const filtered = selectedWeek ? reports.filter(r => Number(r.weekNumber || 1) === Number(selectedWeek)) : reports
      const text = (filtered || []).map(r => `${r.activities || ''} ${r.learnings || ''}`).join(' ')
      const localScores = extractHighlights(text)
      setScores(localScores)
    } catch (e: any) {
      setError(e.message || 'Analysis failed')
      setScores(Array.from({ length: 15 }, () => 0))
    }
  }

  useEffect(() => { analyze() }, [section, selectedWeek])

  const data = useMemo(() => PO_DEFS.map((def, i) => ({ po: `${def.label} (${def.code})`, value: scores[i] || 0 })), [scores])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && (
        <div style={{ textAlign: 'center', marginBottom: 12, fontWeight: 600, fontSize: '18px', color: '#000000' }}>{title}</div>
      )}
      {error && (
        <div style={{ color: '#000000', marginBottom: 12, padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 4 }}>
          {error}
        </div>
      )}
      <div style={{ width: '100%', height: 360, border: '1px solid #e5e7eb', borderRadius: 8, backgroundColor: '#ffffff' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <XAxis dataKey="po" interval={0} tick={{ fontSize: 10, fill: '#000000' }} angle={-90} height={100} tickMargin={12} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#000000' }} width={40} />
            <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={50}>
              <LabelList dataKey="value" position="insideTop" formatter={(v: any) => `${v}%`} fill="#ffffff" style={{ fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


