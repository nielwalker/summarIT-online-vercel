import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth'

type WeekEntry = {
  date: string
  hours: number | ''
  activities: string
  score: number | ''
  learnings: string
  submitted?: boolean
  id?: number
}

function createBlankEntry(): WeekEntry {
  return { date: '', hours: '', activities: '', score: '', learnings: '', submitted: false }
}

function createInitialWeeks(): WeekEntry[][] {
  // 13 weeks, 6 rows per week
  return Array.from({ length: 13 }, () => Array.from({ length: 6 }, () => createBlankEntry()))
}

export function WeeklyReportTable() {
  const [currentWeek, setCurrentWeek] = useState(1)
  const [weeks, setWeeks] = useState<WeekEntry[][]>([])
  const [loading, setLoading] = useState(true)
  const { role } = useAuthStore()
  const [section] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('section') || 'IT4R8') : 'IT4R8')
  const [studentId] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('studentId') || '') : '')

  function updateField<K extends keyof WeekEntry>(rowIdx: number, key: K, value: WeekEntry[K]) {
    setWeeks((prev) => {
      const next = prev.map((weekRows) => weekRows.slice())
      const weekIndex = currentWeek - 1
      // Any edit marks the row as not submitted yet (since it no longer matches database)
      next[weekIndex][rowIdx] = { ...next[weekIndex][rowIdx], [key]: value, submitted: false, id: undefined }
      return next
    })
  }

  function enableEdit(rowIdx: number) {
    setWeeks((prev) => {
      const next = prev.map((weekRows) => weekRows.slice())
      const weekIndex = currentWeek - 1
      // Mark the row as not submitted so it can be edited
      next[weekIndex][rowIdx] = { ...next[weekIndex][rowIdx], submitted: false }
      return next
    })
  }

  async function deleteReport(rowIdx: number) {
    const entry = weeks[currentWeek - 1][rowIdx]
    console.log('Attempting to delete report:', entry)
    
    if (!entry.id) {
      alert('No report to delete - this row has not been submitted yet')
      return
    }

    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      console.log('Deleting report with ID:', entry.id)
      
      const res = await fetch(`${base}/api/reports?id=${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Delete failed:', res.status, errorText)
        throw new Error(`Delete failed (${res.status}): ${errorText}`)
      }

      const result = await res.json()
      console.log('Delete successful:', result)

      // Clear the row data and mark as not submitted
      setWeeks((prev) => {
        const next = prev.map((w) => w.slice())
        next[currentWeek - 1][rowIdx] = createBlankEntry()
        return next
      })

      alert('Report deleted successfully!')
    } catch (e: unknown) {
      console.error('Delete error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`Failed to delete: ${msg}`)
    }
  }

  async function loadReports() {
    try {
      setLoading(true)
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const studentId = localStorage.getItem('studentId')
      const section = localStorage.getItem('section')
      
      if (!studentId || !section) {
        console.log('No studentId or section found, skipping loadReports')
        setWeeks(createInitialWeeks())
        setLoading(false)
        return
      }

      const queryParams = new URLSearchParams()
      queryParams.append('studentId', studentId)
      queryParams.append('section', section)
      
      const res = await fetch(`${base}/api/reports?${queryParams.toString()}`)
      if (!res.ok) {
        console.error('Failed to load reports:', res.status)
        setWeeks(createInitialWeeks())
        setLoading(false)
        return
      }
      
      const items: Array<{ id: number; weekNumber: number; date: string; hours: number; activities: string; score: number; learnings: string }>
        = await res.json()
      
      console.log('Loaded reports from Supabase:', items)
      
      // Build new 13x6 table and fill per week in insertion order
      const grid = createInitialWeeks()
      const buckets = new Map<number, WeekEntry[]>()
      for (const it of items) {
        const list = buckets.get(it.weekNumber) ?? []
        list.push({ id: it.id, date: it.date, hours: it.hours, activities: it.activities, score: it.score, learnings: it.learnings, submitted: true })
        buckets.set(it.weekNumber, list)
      }
      for (const [wk, list] of buckets) {
        const wkIdx = Math.max(0, Math.min(12, wk - 1))
        for (let i = 0; i < Math.min(6, list.length); i++) {
          grid[wkIdx][i] = list[i]
        }
      }
      setWeeks(grid)
    } catch (error) {
      console.error('Error loading reports:', error)
      setWeeks(createInitialWeeks())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, section])

  async function submitWeek(rowIdx: number) {
    const entry = weeks[currentWeek - 1][rowIdx]
    console.log('Submit week', currentWeek, 'row', rowIdx + 1, entry)
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      
      // Get the actual student name from localStorage or use studentId as fallback
      const actualStudentName = typeof window !== 'undefined' ? 
        (localStorage.getItem('userName') || localStorage.getItem('studentId') || 'Unknown Student') : 
        'Unknown Student'
      
      const res = await fetch(`${base}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: actualStudentName, // Use actual student name instead of role
          role: role ?? 'student',
          section,
          studentId: typeof window !== 'undefined' ? localStorage.getItem('studentId') : undefined,
          weekNumber: currentWeek,
          ...entry,
          hours: entry.hours === '' ? 0 : entry.hours,
          score: entry.score === '' ? 0 : entry.score,
        }),
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API Error:', res.status, errorText)
        throw new Error(`Save failed (${res.status}): ${errorText}`)
      }
      
      const result = await res.json()
      console.log('Save successful:', result)
      // Mark this row as submitted after successful save
      setWeeks((prev) => {
        const next = prev.map((w) => w.slice())
        next[currentWeek - 1][rowIdx] = { ...next[currentWeek - 1][rowIdx], submitted: true, id: result.id }
        return next
      })
      // Reload from server to persist across refresh
      loadReports()
      alert(`Week ${currentWeek} - Row ${rowIdx + 1} saved successfully!`)
    } catch (e: unknown) {
      console.error('Submit error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`Failed to save: ${msg}`)
    }
  }

  if (loading) {
    return (
      <div style={{ marginTop: 16, textAlign: 'center', padding: '20px' }}>
        <div style={{ color: '#666' }}>Loading reports from database...</div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Section dropdown removed; section is fixed from login */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
          <button 
            key={w} 
            onClick={() => setCurrentWeek(w)} 
            style={{ 
              fontWeight: currentWeek === w ? 700 : 400,
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: currentWeek === w ? '#3b82f6' : 'white',
              color: currentWeek === w ? 'white' : '#000000',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minWidth: '60px'
            }}
          >
            Week {w}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minHeight: '400px' }}>
          <thead>
            <tr style={{ height: '50px' }}>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>Date</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>No. of Hours</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>Activities/Task</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>Score</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>New Learnings</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '12px 8px', backgroundColor: '#f8f9fa', color: '#000000' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {weeks[currentWeek - 1].map((row, rowIdx) => (
              <tr key={rowIdx} style={{ height: '60px' }}>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input 
                    type="date" 
                    value={row.date} 
                    onChange={(e) => updateField(rowIdx, 'date', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input 
                    type="number" 
                    value={row.hours} 
                    onChange={(e) => updateField(rowIdx, 'hours', e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input 
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} 
                    value={row.activities} 
                    onChange={(e) => updateField(rowIdx, 'activities', e.target.value)} 
                  />
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input 
                    type="number" 
                    value={row.score} 
                    onChange={(e) => updateField(rowIdx, 'score', e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input 
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }} 
                    value={row.learnings} 
                    onChange={(e) => updateField(rowIdx, 'learnings', e.target.value)} 
                  />
                </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <span style={{ 
                        color: row.submitted ? '#059669' : '#dc2626',
                        fontWeight: '600'
                      }}>
                        {row.submitted ? 'Submitted' : 'Missing'}
                      </span>
                    </td>
                <td style={{ padding: '12px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {row.submitted ? (
                      <>
                        <button 
                          onClick={() => enableEdit(rowIdx)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteReport(rowIdx)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => submitWeek(rowIdx)} 
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


