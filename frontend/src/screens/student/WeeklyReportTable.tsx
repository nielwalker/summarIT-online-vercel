import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { getApiUrl } from '../../utils/api'

type WeekEntry = {
  date: string
  hours: number | ''
  activities: string
  learnings: string
  submitted?: boolean
  id?: number
}

function createBlankEntry(): WeekEntry {
  return { date: '', hours: '', activities: '', learnings: '', submitted: false }
}

function createInitialWeeks(): WeekEntry[][] {
  // 13 weeks, 6 rows per week
  return Array.from({ length: 13 }, () => Array.from({ length: 6 }, () => createBlankEntry()))
}

export function WeeklyReportTable() {
  const [currentWeek, setCurrentWeek] = useState(1)
  const [weeks, setWeeks] = useState<WeekEntry[][]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const { role } = useAuthStore()
  const [section] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('section') || 'IT4R8') : 'IT4R8')
  const [studentId] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('studentId') || '') : '')

  // Word limit constants
  const MAX_WORDS_ACTIVITIES = 250
  const MAX_WORDS_LEARNINGS = 250

  // Helper function to count words
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Helper function to truncate text to word limit
  const truncateToWordLimit = (text: string, maxWords: number): string => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ')
  }

  // Note: Debouncing can be added here for auto-save functionality if needed

  function updateField<K extends keyof WeekEntry>(rowIdx: number, key: K, value: WeekEntry[K]) {
    setWeeks((prev) => {
      const next = prev.map((weekRows) => weekRows.slice())
      const weekIndex = currentWeek - 1
      // Any edit marks the row as not submitted yet (since it no longer matches database)
      // Keep the original ID if it exists for updates
      const currentEntry = next[weekIndex][rowIdx]
      
      // Apply word limits for activities and learnings
      let processedValue = value
      if (key === 'activities' && typeof value === 'string') {
        processedValue = truncateToWordLimit(value, MAX_WORDS_ACTIVITIES) as WeekEntry[K]
      } else if (key === 'learnings' && typeof value === 'string') {
        processedValue = truncateToWordLimit(value, MAX_WORDS_LEARNINGS) as WeekEntry[K]
      }
      
      // Check for duplicate dates when updating date field
      if (key === 'date' && typeof value === 'string' && value !== '') {
        const duplicateDate = next[weekIndex].find((e, idx) => 
          idx !== rowIdx && e.date === value && e.date !== '' && e.id
        )
        
        if (duplicateDate) {
          alert(`Date ${value} is already used in this week. Please choose a different date.`)
          return prev // Don't update if duplicate date
        }
      }
      
      // Preserve the ID when updating fields
      next[weekIndex][rowIdx] = { ...currentEntry, [key]: processedValue, submitted: false, id: currentEntry.id }
      return next
    })
  }

  function enableEdit(rowIdx: number) {
    setWeeks((prev) => {
      const next = prev.map((weekRows) => weekRows.slice())
      const weekIndex = currentWeek - 1
      const currentEntry = next[weekIndex][rowIdx]
      // Mark the row as not submitted but keep the ID for updates
      next[weekIndex][rowIdx] = { ...currentEntry, submitted: false, id: currentEntry.id }
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
      console.log('Deleting report with ID:', entry.id)
      
      const res = await fetch(getApiUrl(`/api/reports?id=${entry.id}`), {
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

  async function loadReports(forceRefresh = false) {
    try {
      // Cache for 30 seconds to avoid unnecessary API calls
      const now = Date.now()
      const cacheTime = 30000 // 30 seconds
      if (!forceRefresh && (now - lastFetchTime) < cacheTime) {
        console.log('Using cached data, skipping API call')
        return
      }

      setLoading(true)
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
      
      const res = await fetch(getApiUrl(`/api/reports?${queryParams.toString()}`))
      if (!res.ok) {
        console.error('Failed to load reports:', res.status)
        setWeeks(createInitialWeeks())
        setLoading(false)
        return
      }
      
      const items: Array<{ id: number; weekNumber: number; date: string; hours: number; activities: string; learnings: string }>
        = await res.json()
      
      console.log('Loaded reports from Supabase:', items)
      
      // Build new 13x6 table and fill per week in insertion order
      const grid = createInitialWeeks()
      const buckets = new Map<number, WeekEntry[]>()
      for (const it of items) {
        const list = buckets.get(it.weekNumber) ?? []
        list.push({ id: it.id, date: it.date, hours: it.hours, activities: it.activities, learnings: it.learnings, submitted: true })
        buckets.set(it.weekNumber, list)
      }
      for (const [wk, list] of buckets) {
        const wkIdx = Math.max(0, Math.min(12, wk - 1))
        for (let i = 0; i < Math.min(6, list.length); i++) {
          grid[wkIdx][i] = list[i]
        }
      }
      setWeeks(grid)
      setLastFetchTime(now)
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
    
    // Validation: Check if all required fields are filled
    const missingFields = []
    if (!entry.date) missingFields.push('Date')
    if (entry.hours === '' || entry.hours === 0) missingFields.push('Hours')
    if (!entry.activities.trim()) missingFields.push('Activities')
    if (!entry.learnings.trim()) missingFields.push('Learnings')
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`)
      return
    }

    // Validation: Check for duplicate dates in the same week
    const currentWeekEntries = weeks[currentWeek - 1]
    const duplicateDate = currentWeekEntries.find((e, idx) => 
      idx !== rowIdx && e.date === entry.date && e.date !== '' && e.id
    )
    
    if (duplicateDate) {
      alert(`Date ${entry.date} is already used in this week. Please choose a different date.`)
      return
    }

    // Validation: Check if week already has 6 entries (excluding current row if it's an update)
    const existingEntries = currentWeekEntries.filter((e, idx) => 
      idx !== rowIdx && (e.id || (e.date !== '' && (e.submitted || e.activities.trim() || e.learnings.trim())))
    )
    
    if (existingEntries.length >= 6 && !entry.id) {
      alert(`Week ${currentWeek} already has 6 entries. You cannot add more entries to this week.`)
      return
    }

    // Validation: Check word limits
    const activitiesWordCount = countWords(entry.activities)
    const learningsWordCount = countWords(entry.learnings)
    
    if (activitiesWordCount > MAX_WORDS_ACTIVITIES) {
      alert(`Activities field exceeds the ${MAX_WORDS_ACTIVITIES} word limit. Current: ${activitiesWordCount} words.`)
      return
    }
    
    if (learningsWordCount > MAX_WORDS_LEARNINGS) {
      alert(`Learnings field exceeds the ${MAX_WORDS_LEARNINGS} word limit. Current: ${learningsWordCount} words.`)
      return
    }
    
    // Check if already submitted to prevent duplication
    if (entry.submitted && entry.id) {
      alert('This entry has already been submitted. Click Edit to modify.')
      return
    }
    
    try {
      // Get the actual student name from localStorage or use studentId as fallback
      const actualStudentName = typeof window !== 'undefined' ? 
        (localStorage.getItem('userName') || localStorage.getItem('studentId') || 'Unknown Student') : 
        'Unknown Student'
      
      // Use PUT for updates (when entry has an ID) or POST for new entries
      const method = entry.id ? 'PUT' : 'POST'
      const body = entry.id ? {
        reportId: entry.id,
        date: entry.date,
        hours: entry.hours === '' ? 0 : entry.hours,
        activities: entry.activities,
        learnings: entry.learnings,
      } : {
        userName: actualStudentName,
        role: role ?? 'student',
        section,
        studentId: typeof window !== 'undefined' ? localStorage.getItem('studentId') : undefined,
        weekNumber: currentWeek,
        date: entry.date,
        hours: entry.hours === '' ? 0 : entry.hours,
        activities: entry.activities,
        learnings: entry.learnings,
      }
      
      const res = await fetch(getApiUrl('/api/reports'), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        next[currentWeek - 1][rowIdx] = { ...next[currentWeek - 1][rowIdx], submitted: true, id: result.id || entry.id }
        return next
      })
      // Reload from server to persist across refresh
      loadReports(true)
      alert(`Week ${currentWeek} - Row ${rowIdx + 1} ${entry.id ? 'updated' : 'saved'} successfully!`)
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
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 16, marginBottom: 16 }}>
        <select 
          value={currentWeek}
          onChange={(e) => setCurrentWeek(Number(e.target.value))}
          style={{ 
            padding: '8px 32px 8px 12px', 
            border: '1px solid #cbd5e1', 
            borderRadius: '8px', 
            backgroundColor: 'white', 
            color: '#1e293b',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23475569\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center'
          }}
        >
          {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>
      <div style={{ 
        border: '1px solid #e2e8f0', 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ 
                padding: '16px 12px', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#475569',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Date</th>
              <th style={{ 
                padding: '16px 12px', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#475569',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>No. of Hours</th>
              <th style={{ 
                padding: '16px 12px', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#475569',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Activities/Task</th>
              <th style={{ 
                padding: '16px 12px', 
                textAlign: 'left', 
                fontWeight: '600', 
                color: '#475569',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>New Learnings</th>
              <th style={{ 
                padding: '16px 12px', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#475569',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Status</th>
              <th style={{ 
                padding: '16px 12px', 
                textAlign: 'center', 
                fontWeight: '600', 
                color: '#475569',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {weeks[currentWeek - 1].map((row, rowIdx) => (
              <tr key={rowIdx} style={{ 
                borderBottom: '1px solid #e2e8f0',
                transition: 'background 0.2s',
                minHeight: '60px' // Increased height to accommodate word counters
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="date" 
                    value={row.date} 
                    onChange={(e) => updateField(rowIdx, 'date', e.target.value)}
                    disabled={row.submitted}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: row.submitted ? '#f1f5f9' : 'white',
                      color: row.submitted ? '#64748b' : '#1e293b'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="number" 
                    value={row.hours} 
                    onChange={(e) => updateField(rowIdx, 'hours', e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={row.submitted}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: row.submitted ? '#f1f5f9' : 'white',
                      color: row.submitted ? '#64748b' : '#1e293b'
                    }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      value={row.activities} 
                      onChange={(e) => updateField(rowIdx, 'activities', e.target.value)} 
                      disabled={row.submitted}
                      placeholder="Describe your tasks/activities (max 250 words)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: row.submitted ? '#f1f5f9' : 'white',
                        color: row.submitted ? '#64748b' : '#1e293b'
                      }}
                    />
                    {!row.submitted && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-18px',
                        right: '0',
                        fontSize: '11px',
                        color: countWords(row.activities) > MAX_WORDS_ACTIVITIES ? '#dc2626' : '#6b7280',
                        fontWeight: '500'
                      }}>
                        {countWords(row.activities)}/{MAX_WORDS_ACTIVITIES} words
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      value={row.learnings} 
                      onChange={(e) => updateField(rowIdx, 'learnings', e.target.value)} 
                      disabled={row.submitted}
                      placeholder="Describe what you learned (max 250 words)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: row.submitted ? '#f1f5f9' : 'white',
                        color: row.submitted ? '#64748b' : '#1e293b'
                      }}
                    />
                    {!row.submitted && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-18px',
                        right: '0',
                        fontSize: '11px',
                        color: countWords(row.learnings) > MAX_WORDS_LEARNINGS ? '#dc2626' : '#6b7280',
                        fontWeight: '500'
                      }}>
                        {countWords(row.learnings)}/{MAX_WORDS_LEARNINGS} words
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: row.submitted ? '#dcfce7' : '#fee2e2',
                    color: row.submitted ? '#166534' : '#991b1b'
                  }}>
                    {row.submitted ? 'Submitted' : 'Missing'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {row.submitted ? (
                      <>
                        <button 
                          onClick={() => enableEdit(rowIdx)}
                          style={{
                            padding: '6px 14px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteReport(rowIdx)}
                          style={{
                            padding: '6px 14px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => submitWeek(rowIdx)} 
                        style={{
                          padding: '6px 14px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
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


