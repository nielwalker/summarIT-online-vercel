import CoordinatorPOList from './CoordinatorPOList'
import CoordinatorSideNav from '../../components/CoordinatorSideNav'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../../utils/api'

export default function CoordinatorDashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState('')
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [studentId, setStudentId] = useState('')
  const [students, setStudents] = useState<Array<{ studentId: string; userName: string; companyName?: string }>>([])
  const [selectedStudent, setSelectedStudent] = useState<{ studentId: string; userName: string; companyName?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sections, setSections] = useState<string[]>([])
  const [totalHours, setTotalHours] = useState<number>(0)
  const [studentReports, setStudentReports] = useState<any[]>([])
  const [editingReport, setEditingReport] = useState<any>(null)
  const [excuseText, setExcuseText] = useState<string>('')
  const [customExcuseText, setCustomExcuseText] = useState<string>('')
  const [selectedWeekForReports, setSelectedWeekForReports] = useState<number>(1)
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null)
  const [studentDetails, setStudentDetails] = useState<any>(null)
  const [companyDetails, setCompanyDetails] = useState<any>(null)


  // Load sections assigned to the logged-in coordinator
  useEffect(() => {
    const loadSections = async () => {
      try {
        const coordIdStr = localStorage.getItem('coordinatorId')
        const coordId = coordIdStr ? Number(coordIdStr) : null
        const url = coordId ? getApiUrl(`/api/admin?action=getCoordinatorSections&coordinatorId=${coordId}`) : getApiUrl('/api/admin?action=getCoordinatorSections')
        const res = await fetch(url)
        if (res.ok) {
          const data: string[] = await res.json()
          setSections(data || [])
          if ((data || []).length > 0) {
            setSection(prev => prev || data[0])
          }
        }
      } catch (e) {
        console.error('Failed to load sections', e)
      }
    }
    loadSections()
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      if (!section) {
        console.log('No section selected, skipping student fetch')
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching students for section:', section)
        const response = await fetch(getApiUrl(`/api/admin?action=listStudents&section=${encodeURIComponent(section)}`))
        
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Check if response contains error
        if (data.error) {
          throw new Error(data.error)
        }
        
        // Ensure we always set an array
        if (Array.isArray(data)) {
          setStudents(data)
          console.log(`Loaded ${data.length} students for section ${section}:`, data)
        } else {
          console.error('Expected array but got:', data)
          setStudents([])
          setError('Invalid response format from server')
        }
      } catch (err: any) {
        console.error('Error fetching students:', err)
        setStudents([])
        setError(err.message || 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [section])

  const fetchStudentTotalHours = async (studentId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/reports?action=getStudentTotalHours&studentId=${encodeURIComponent(studentId)}`))
      if (response.ok) {
        const data = await response.json()
        setTotalHours(data.totalHours || 0)
      } else {
        setTotalHours(0)
      }
    } catch (error) {
      console.error('Error fetching student total hours:', error)
      setTotalHours(0)
    }
  }

  const fetchStudentReports = async (studentId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/reports?studentId=${encodeURIComponent(studentId)}`))
      if (response.ok) {
        const data = await response.json()
        const existingReports = data || []
        
        // Ensure we have reports for all weeks 1-13, even if they don't exist in the database
        const allWeeks = Array.from({ length: 13 }, (_, i) => i + 1)
        
        // Create placeholder reports for missing weeks
        const completeReports = allWeeks.map(week => {
          const existingReport = existingReports.find((r: any) => r.weekNumber === week)
          if (existingReport) {
            return existingReport
          } else {
            // Create a placeholder report for missing weeks
            return {
              id: `placeholder-${week}`,
              weekNumber: week,
              date: '',
              hours: 0,
              activities: '',
              learnings: '',
              excuse: '',
              studentId: studentId
            }
          }
        })
        
        setStudentReports(completeReports)
      } else {
        setStudentReports([])
      }
    } catch (error) {
      console.error('Error fetching student reports:', error)
      setStudentReports([])
    }
  }

  const fetchStudentAndCompanyDetails = async (studentId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin?action=getStudentDetails&studentId=${encodeURIComponent(studentId)}`))
      if (response.ok) {
        const data = await response.json()
        setStudentDetails(data.student || null)
        setCompanyDetails(data.company || null)
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
    }
  }

  const handleStudentChange = async (selectedStudentId: string) => {
    setStudentId(selectedStudentId)
    if (selectedStudentId) {
      const student = students.find(s => s.studentId === selectedStudentId)
      setSelectedStudent(student || null)
      fetchStudentTotalHours(selectedStudentId)
      fetchStudentReports(selectedStudentId)
      fetchStudentAndCompanyDetails(selectedStudentId)
    } else {
      setSelectedStudent(null)
      setTotalHours(0)
      setStudentReports([])
      setStudentDetails(null)
      setCompanyDetails(null)
    }
  }

  const handleSaveReport = async (report: any) => {
    if (!studentId || !report) return
    
    try {
      const reportData = {
        userName: selectedStudent?.userName || 'Coordinator Entry',
        role: 'coordinator',
        section: section,
        studentId: studentId,
        weekNumber: report.weekNumber,
        date: report.date,
        hours: report.hours || 0,
        activities: report.excuse ? 'Excused' : '',
        learnings: report.excuse ? 'Excused' : '',
        excuse: report.excuse || ''
      }
      
      const response = await fetch(getApiUrl('/api/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })
      
      if (response.ok) {
        // Refresh the reports from server
        await fetchStudentReports(studentId)
        await fetchStudentTotalHours(studentId)
        alert('Report saved successfully!')
      } else {
        console.error('Failed to save report')
        alert('Failed to save report. Please try again.')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Error saving report. Please try again.')
    }
  }

  const handleExcuseSubmit = async () => {
    if (!editingReport) return
    
    const finalExcuseText = excuseText === 'Other' ? customExcuseText.trim() : excuseText.trim()
    if (!finalExcuseText) return
    
    try {
      const response = await fetch(getApiUrl('/api/reports'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: editingReport.id,
          excuse: finalExcuseText,
          weekNumber: editingReport.weekNumber,
          date: editingReport.date,
          studentId: studentId
        })
      })
        
        if (response.ok) {
        // Update the local state immediately
        const updatedReports = studentReports.map(report => {
          if (report.weekNumber === editingReport.weekNumber && report.date === editingReport.date) {
            return { ...report, excuse: finalExcuseText }
          }
          return report
        })
        setStudentReports(updatedReports)
        
        // Refresh the reports from server
        if (studentId) {
          fetchStudentReports(studentId)
          fetchStudentTotalHours(studentId)
        }
        setEditingReport(null)
        setExcuseText('')
        setCustomExcuseText('')
      } else {
        console.error('Failed to submit excuse')
      }
    } catch (error) {
      console.error('Error submitting excuse:', error)
    }
  }

  const refreshStudents = () => {
    const fetchStudents = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(getApiUrl(`/api/admin?action=listStudents&section=${encodeURIComponent(section)}`))
        
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Check if response contains error
        if (data.error) {
          throw new Error(data.error)
        }
        
        // Ensure we always set an array
        if (Array.isArray(data)) {
          setStudents(data)
          console.log(`Refreshed ${data.length} students for section ${section}:`, data)
        } else {
          console.error('Expected array but got:', data)
          setStudents([])
          setError('Invalid response format from server')
        }
      } catch (err: any) {
        console.error('Error fetching students:', err)
        setStudents([])
        setError(err.message || 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'students'>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        padding: '0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '0',
        boxShadow: 'none',
        overflow: 'hidden',
        position: 'fixed',
        top: '0',
        left: '0'
      }}>
        <CoordinatorSideNav 
          onLogout={() => { 
            try { 
              localStorage.clear()
              setLogoutMessage('Successfully logged out')
              setTimeout(() => {
                navigate('/')
              }, 1500)
            } catch {} 
          }}
          activeTab={activeTab}
          setActiveTab={(t) => setActiveTab(t as any)}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />
        <div style={{ 
          position: 'relative',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: '100%',
          marginBottom: '20px',
          padding: '20px',
          marginLeft: sidebarCollapsed ? '64px' : '256px'
        }}>
          {logoutMessage && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '12px 20px',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {logoutMessage}
            </div>
          )}
          <h2 style={{ margin: 0, color: '#000000', textAlign: 'center' }}>Coordinator Dashboard - Student Analysis</h2>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          width: '100%',
          maxWidth: '900px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Section:</span>
            <select 
              value={section} 
              onChange={(e) => { setSection(e.target.value); setStudentId(''); setSelectedStudent(null); }}
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
                backgroundPosition: 'right 12px center',
                minWidth: '140px'
              }}
            >
              <option value="" disabled>{sections.length ? 'Select Section' : 'No sections available'}</option>
              {sections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Student:</span>
            <select 
              value={studentId} 
              onChange={(e) => handleStudentChange(e.target.value)}
              disabled={loading}
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: loading ? '#f3f4f6' : 'white',
                color: loading ? '#6b7280' : '#1e293b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23475569\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                minWidth: '200px'
              }}
            >
              <option value="">
                {loading ? 'Loading students...' : students.length === 0 ? 'No students found' : 'Select Student'}
              </option>
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>{s.studentId} — {s.userName}</option>
              ))}
            </select>
          </label>
          <button
            onClick={refreshStudents}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#3b82f6')}
          >
            🔄 {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {loading && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            color: '#0369a1',
            textAlign: 'center'
          }}>
            Loading students for section {section}...
          </div>
        )}
        
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'auto',
          position: 'relative',
          marginLeft: sidebarCollapsed ? '64px' : '256px'
        }}>
          {activeTab === 'dashboard' && (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Total Students</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#000000' }}>{students.length}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Weekly Summary</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#000000'
                    }}
                  >
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>
                        Week {week}
                      </option>
                    ))}
                  </select>
                </label>
                  </div>
                  {section && studentId && selectedStudent ? (
                    <CoordinatorPOList section={section} studentId={studentId} selectedWeek={selectedWeek} showMonitoring={false} />
                  ) : (
                    <div style={{ color: '#6b7280' }}>Select a student and week to see the summary.</div>
                  )}
                </div>
              </div>
              
              {/* Monitoring Results Section */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Monitoring Results</div>
                {section && studentId && selectedStudent ? (
                  <>
                    <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 4 }}>Total Accumulated Hours</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#0c4a6e' }}>{totalHours} / 486 hours</div>
                    </div>
                    <CoordinatorPOList section={section} studentId={studentId} selectedWeek={selectedWeek} showMonitoring={true} />
                  </>
                ) : (
                  <div style={{ color: '#6b7280' }}>Select a student to see the monitoring results and total accumulated hours.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827' }}>Student Reports</h3>
              {section && studentId && selectedStudent ? (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, color: '#111827' }}>Daily Reports - Excuse Management</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select 
                          value={selectedWeekForReports} 
                          onChange={(e) => setSelectedWeekForReports(Number(e.target.value))}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        >
                          {Array.from({ length: 13 }, (_, i) => i + 1).map(week => (
                            <option key={week} value={week}>
                              Week {week}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827', fontWeight: 600 }}>Day</th>
                            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827', fontWeight: 600 }}>Date</th>
                            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827', fontWeight: 600 }}>Hours</th>
                            <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827', fontWeight: 600 }}>Excuse</th>
                            <th style={{ textAlign: 'center', padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827', fontWeight: 600 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentReports
                            .filter(report => report.weekNumber === selectedWeekForReports)
                            .map((report, index) => {
                              const reportDate = report?.date || ''
                              const dayName = reportDate ? new Date(reportDate).toLocaleDateString('en-US', { weekday: 'long' }) : `Day ${index + 1}`
                              
                              return (
                                <tr key={report.id || index} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                  <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827', fontWeight: 600 }}>
                                    {dayName}
                                  </td>
                                  <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                                    <input
                                      type="date"
                                      value={reportDate}
                                      onChange={(e) => {
                                        // Update the report date
                                        const updatedReports = studentReports.map(r => 
                                          r.id === report.id ? { ...r, date: e.target.value } : r
                                        )
                                        setStudentReports(updatedReports)
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        width: '100%'
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      max="8"
                                      value={report?.hours || 0}
                                      onChange={(e) => {
                                        const updatedReports = studentReports.map(r => 
                                          r.id === report.id ? { ...r, hours: parseInt(e.target.value) || 0 } : r
                                        )
                                        setStudentReports(updatedReports)
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        width: '60px'
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                                    <textarea
                                      value={report?.excuse || ''}
                                      onChange={(e) => {
                                        const updatedReports = studentReports.map(r => 
                                          r.id === report.id ? { ...r, excuse: e.target.value } : r
                                        )
                                        setStudentReports(updatedReports)
                                      }}
                                      placeholder="Enter excuse if any..."
                                      style={{
                                        padding: '8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        width: '100%',
                                        minHeight: '60px',
                                        resize: 'vertical'
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: 12, borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleSaveReport(report)}
                                      style={{ 
                                        padding: '6px 12px', 
                                        borderRadius: 6, 
                                        backgroundColor: '#10b981', 
                                        color: 'white', 
                                        border: 'none', 
                                        fontSize: 12, 
                                        cursor: 'pointer',
                                        fontWeight: 500
                                      }}
                                    >
                                      Save
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          
                          {/* Show message if no reports for selected week */}
                          {studentReports.filter(report => report.weekNumber === selectedWeekForReports).length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                                No reports found for Week {selectedWeekForReports}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ color: '#6b7280' }}>Please select a student to view their reports.</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827' }}>Student Information</h3>
              {selectedStudent ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {/* Student Information Card */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        backgroundColor: '#3b82f6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: 16
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                          {selectedStudent.userName}
                        </h4>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                          Student ID: {selectedStudent.studentId}
                        </p>
                      </div>
                    </div>
                    
                    {studentDetails && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            Course
                          </label>
                          <p style={{ margin: 0, color: '#111827', fontSize: '14px' }}>
                            {studentDetails.course || 'BSIT'}
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            Section
                          </label>
                          <p style={{ margin: 0, color: '#111827', fontSize: '14px' }}>
                            {studentDetails.section || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            OJT Hours
                          </label>
                          <p style={{ margin: 0, color: '#111827', fontSize: '14px' }}>
                            {totalHours} / 486 hours
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            Status
                          </label>
                          <span style={{ 
                            padding: '4px 12px', 
                            borderRadius: '20px', 
                            background: totalHours >= 486 ? '#dcfce7' : '#fef3c7', 
                            color: totalHours >= 486 ? '#166534' : '#92400e', 
                            fontSize: '12px', 
                            fontWeight: '600' 
                          }}>
                            {totalHours >= 486 ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Company Information Card */}
                  {companyDetails && (
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{
                          width: 48, 
                          height: 48, 
                          borderRadius: '50%', 
                          backgroundColor: '#10b981', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginRight: 16
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9,22 9,12 15,12 15,22"></polyline>
                          </svg>
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
                            {companyDetails.name || 'Company Name'}
                          </h4>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                            OJT Company
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            Address
                          </label>
                          <p style={{ margin: 0, color: '#111827', fontSize: '14px', lineHeight: '1.5' }}>
                            {companyDetails.address || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            Supervisor
                          </label>
                          <p style={{ margin: 0, color: '#111827', fontSize: '14px' }}>
                            {companyDetails.supervisor || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>
                            Contact Number
                          </label>
                          <p style={{ margin: 0, color: '#111827', fontSize: '14px' }}>
                            {companyDetails.contactNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 20px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Select a student to view their information</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Choose a student from the dropdown above to see their details and company information.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Excuse Modal */}
      {editingReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 24, width: '90%', maxWidth: 500 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#111827' }}>
              {editingReport.excuse ? 'Edit Excuse' : 'Add Excuse'} for {editingReport.day || 'Day'} - Week {editingReport.weekNumber || 'N/A'}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#111827' }}>Excuse Type:</label>
              <select
                value={excuseText}
                onChange={(e) => setExcuseText(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: 'white',
                  marginBottom: 12
                }}
              >
                <option value="">Select excuse type...</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Family Emergency">Family Emergency</option>
                <option value="Transportation Issues">Transportation Issues</option>
                <option value="Weather Conditions">Weather Conditions</option>
                <option value="Personal Matters">Personal Matters</option>
                <option value="Company-related Issues">Company-related Issues</option>
                <option value="Academic Requirements">Academic Requirements</option>
                <option value="Other">Other</option>
              </select>
              
              {excuseText === 'Other' && (
                <textarea
                  value={customExcuseText}
                  onChange={(e) => setCustomExcuseText(e.target.value)}
                  placeholder="Please specify the excuse reason..."
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical'
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingReport(null)
                  setExcuseText('')
                  setCustomExcuseText('')
                }}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', color: '#6b7280', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExcuseSubmit}
                disabled={!excuseText.trim() || (excuseText === 'Other' && !customExcuseText.trim())}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  borderRadius: 6, 
                  backgroundColor: (excuseText.trim() && (excuseText !== 'Other' || customExcuseText.trim())) ? '#dc2626' : '#9ca3af', 
                  color: 'white', 
                  cursor: (excuseText.trim() && (excuseText !== 'Other' || customExcuseText.trim())) ? 'pointer' : 'not-allowed' 
                }}
              >
                {editingReport.excuse ? 'Update Excuse' : 'Submit Excuse'}
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
  )
}


