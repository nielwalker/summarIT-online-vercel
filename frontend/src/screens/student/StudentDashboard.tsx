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
    } catch {}
    navigate('/')
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
        ) : (
          <StudentProfile studentDetails={studentDetails} />
        )}
      </div>
    </div>
  )
}


