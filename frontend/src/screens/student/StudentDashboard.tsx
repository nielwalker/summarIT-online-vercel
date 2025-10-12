import { useState, useEffect } from 'react'
import { WeeklyReportTable } from './WeeklyReportTable'
import StudentSideNav from '../../components/StudentSideNav'
import StudentProfile from './StudentProfile'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../../utils/api'

interface StudentDetails {
  student: {
    studentId: string
    userName: string
    section: string
    companyName: string
    companyAddress: string
    companySupervisor: string
    companyContact: string
  }
  coordinator: {
    userName: string
    coordinatorId: number
  }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const studentId = localStorage.getItem('studentId')
        if (!studentId) {
          setError('Student ID not found')
          setLoading(false)
          return
        }

        const response = await fetch(getApiUrl(`/api/admin?action=getStudentDetails&studentId=${encodeURIComponent(studentId)}`))
        
        if (!response.ok) {
          throw new Error(`Failed to fetch student details: ${response.status}`)
        }

        const data = await response.json()
        
        // Transform the data to match the StudentSideNav interface
        const transformedData: StudentDetails = {
          student: {
            studentId: data.student?.studentId || '',
            userName: data.student?.userName || '',
            section: data.student?.section || '',
            companyName: data.student?.companyName || data.company?.name || '',
            companyAddress: data.company?.address || '',
            companySupervisor: data.company?.supervisor || '',
            companyContact: data.company?.contactNumber || ''
          },
          coordinator: {
            userName: data.coordinator?.userName || '',
            coordinatorId: data.coordinator?.coordinatorId || 0
          }
        }
        
        setStudentDetails(transformedData)
      } catch (err) {
        console.error('Error fetching student details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load student details')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentDetails()
  }, [])
  
  const handleLogout = () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('userName')
      localStorage.removeItem('studentId')
      localStorage.removeItem('section')
      setLogoutMessage('Successfully logged out')
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch {}
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      padding: '0',
      boxSizing: 'border-box',
      display: 'flex',
      backgroundColor: 'white',
      borderRadius: '0',
      boxShadow: 'none',
      overflow: 'hidden',
      position: 'fixed',
      top: '0',
      left: '0'
    }}>
      {/* Side Navigation */}
      <StudentSideNav 
        onLogout={handleLogout} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarCollapsed ? '64px' : '256px', // Dynamic width based on sidebar state
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: '#f8fafc',
        transition: 'margin-left 0.2s ease-in-out'
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
        {activeTab === 'dashboard' ? (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ 
                margin: '0 0 8px 0', 
                color: '#1f2937', 
                fontSize: '28px',
                fontWeight: 'bold'
              }}>
                Student Dashboard
              </h1>
              <p style={{ 
                margin: '0', 
                color: '#6b7280', 
                fontSize: '16px'
              }}>
                Welcome back, {studentDetails?.student.userName || 'Student'}!
              </p>
            </div>

            {loading && (
              <div style={{ 
                marginBottom: '16px', 
                color: '#6b7280',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                Loading student information...
              </div>
            )}
            
            {error && (
              <div style={{ 
                marginBottom: '16px', 
                color: '#dc2626',
                padding: '12px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                Error: {error}
              </div>
            )}

            <WeeklyReportTable />
          </div>
        ) : activeTab === 'company' ? (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '24px', fontWeight: '600' }}>Company Information</h2>
            
            {/* Company Information Card */}
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              {/* Company Profile Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9,22 9,12 15,12 15,22"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                    {studentDetails?.student.companyName || 'N/A'}
                  </h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>OJT Company</p>
                </div>
              </div>

              {/* Company Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Address
                  </label>
                  <div style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
                    {studentDetails?.student.companyAddress || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Supervisor
                  </label>
                  <div style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
                    {studentDetails?.student.companySupervisor || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Contact Number
                  </label>
                  <div style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
                    {studentDetails?.student.companyContact || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'coordinator' ? (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '24px', fontWeight: '600' }}>Coordinator Information</h2>
            
            {/* Coordinator Information Card */}
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              {/* Coordinator Profile Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                    {studentDetails?.coordinator.userName || 'N/A'}
                  </h3>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>OJT Coordinator</p>
                </div>
              </div>

              {/* Coordinator Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Coordinator ID
                  </label>
                  <div style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
                    {studentDetails?.coordinator.coordinatorId || 'N/A'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Section
                  </label>
                  <div style={{ fontSize: '16px', color: '#111827', fontWeight: '500' }}>
                    {studentDetails?.student.section || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <StudentProfile studentDetails={studentDetails} />
        )}
      </div>
    </div>
  )
}


