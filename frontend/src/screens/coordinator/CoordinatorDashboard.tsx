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
  const [companyDetails, setCompanyDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sections, setSections] = useState<string[]>([])

  const ALL_WEEKS = Array.from({ length: 13 }, (_, i) => i + 1) // Weeks 1-13

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

  const handleStudentChange = async (selectedStudentId: string) => {
    setStudentId(selectedStudentId)
    if (selectedStudentId) {
      const student = students.find(s => s.studentId === selectedStudentId)
      setSelectedStudent(student || null)
      
      // Fetch detailed student information including company details
      try {
        const response = await fetch(getApiUrl(`/api/admin?action=getStudentDetails&studentId=${encodeURIComponent(selectedStudentId)}`))
        
        if (response.ok) {
          const data = await response.json()
          setCompanyDetails(data.company)
        }
      } catch (error) {
        console.error('Error fetching student details:', error)
        setCompanyDetails(null)
      }
    } else {
      setSelectedStudent(null)
      setCompanyDetails(null)
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
          onLogout={() => { try { localStorage.clear() } catch {}; navigate('/') }}
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
          padding: '20px'
        , marginLeft: sidebarCollapsed ? '64px' : '256px' }}>
          <h2 style={{ margin: 0, color: '#000000', textAlign: 'center' }}>Coordinator Dashboard - Student Analysis</h2>
          <button 
            onClick={() => {
              try {
                localStorage.removeItem('token')
                localStorage.removeItem('role')
                localStorage.removeItem('userName')
                localStorage.removeItem('studentId')
                localStorage.removeItem('section')
              } catch {}
              navigate('/')
            }}
            className="btn btn-danger"
            style={{ position: 'absolute', right: '20px', top: '16px' }}
          >
            Logout
          </button>
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
              onChange={(e) => { setSection(e.target.value); setStudentId(''); setSelectedStudent(null); setCompanyDetails(null); }}
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
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Total Students</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{students.length}</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Weekly Summary</div>
                  {section && studentId && selectedStudent ? (
                    <CoordinatorPOList section={section} studentId={studentId} selectedWeek={selectedWeek} />
                  ) : (
                    <div style={{ color: '#6b7280' }}>Select a student and week to see the summary.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827' }}>Student Reports</h3>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#6b7280' }}>Coming soon: list of weekly submissions with date/status.</div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div style={{ width: '100%', maxWidth: 1200 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#111827' }}>Student Information</h3>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#6b7280' }}>Coming soon: student roster with course, section, OJT hours, status, and company info.</div>
              </div>
            </div>
          )}

          {section && studentId && selectedStudent && activeTab === 'dashboard' ? (
            <>
              <div style={{ 
                marginBottom: '20px', 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                minWidth: '300px',
                width: '100%',
                maxWidth: '800px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#000000' }}>Student Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, color: '#000000', marginBottom: '16px' }}>
                  <div>
                    <strong>Name:</strong> {selectedStudent.userName}
                  </div>
                  <div>
                    <strong>Student ID:</strong> {selectedStudent.studentId}
                  </div>
                </div>
                
                {/* Company Details Section */}
                {companyDetails && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '6px', 
                    border: '1px solid #f59e0b',
                    textAlign: 'left',
                    color: '#000000'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#000000', fontSize: '14px' }}>Company Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '13px', color: '#000000' }}>
                      <div>
                        <strong>Company Name:</strong> {companyDetails.name || selectedStudent.companyName || 'N/A'}
                      </div>
                      <div>
                        <strong>Address:</strong> {companyDetails.address || 'N/A'}
                      </div>
                      <div>
                        <strong>Supervisor:</strong> {companyDetails.supervisor || 'N/A'}
                      </div>
                      <div>
                        <strong>Contact:</strong> {companyDetails.contactNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Week Selection Controls */}
              <div style={{ 
                display: 'flex', 
                gap: 16, 
                alignItems: 'center', 
                margin: '0 auto 20px auto',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                width: '100%',
                maxWidth: '600px',
                justifyContent: 'center'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '500', color: '#000000' }}>Week:</span>
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
                    {ALL_WEEKS.map(week => (
                      <option key={week} value={week}>
                        Week {week}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              
              <div style={{ width: '100%', maxWidth: '1200px', marginTop: '20px' }}>
                <CoordinatorPOList 
                  section={section}
                  studentId={studentId}
                  selectedWeek={selectedWeek}
                />
              </div>
            </>
          ) : activeTab === 'dashboard' ? (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#111827',
              textAlign: 'center',
              maxWidth: '700px',
              width: '100%'
            }}>
              Please select a section, a student, and a week to display the analysis.
            </div>
          )}
        </div>
      </div>
  )
}


