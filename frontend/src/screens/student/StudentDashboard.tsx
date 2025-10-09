import { useState, useEffect } from 'react'
import { WeeklyReportTable } from './WeeklyReportTable'
import DashboardShell from '../../components/DashboardShell'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../../utils/api'

interface StudentDetails {
  student: {
    studentId: string
    userName: string
    section: string
    companyName: string | null
  }
  coordinator: {
    userName: string
    sections: string[]
  } | null
  company: {
    id: number
    name: string
    address: string
    supervisor: string
    contactNumber: string
  } | null
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const studentId = localStorage.getItem('studentId')
        if (!studentId) {
          setError('Student ID not found')
          setLoading(false)
          return
        }

        const base = getApiUrl('')
        const response = await fetch(`${base}/api/admin?action=getStudentDetails&studentId=${encodeURIComponent(studentId)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch student details: ${response.status}`)
        }

        const data = await response.json()
        setStudentDetails(data)
      } catch (err) {
        console.error('Error fetching student details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load student details')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentDetails()
  }, [])
  
  return (
    <DashboardShell>
      <div style={{ 
        width: '100vw', 
        height: '100vh',
        padding: '0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '0',
        boxShadow: 'none',
        overflow: 'hidden',
        position: 'fixed',
        top: '0',
        left: '0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '20px 20px 0 20px' }}>
          <h2 style={{ margin: 0, color: '#000000' }}>Student Dashboard</h2>
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
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ padding: '0 20px 20px 20px', height: '100%', overflowY: 'auto' }}>
          {loading && <div style={{ marginBottom: 16, color: '#666' }}>Loading student information...</div>}
          
          {error && <div style={{ marginBottom: 16, color: 'crimson' }}>Error: {error}</div>}
          
          {studentDetails && studentDetails.student && (
          <div style={{ 
            marginBottom: 24, 
            padding: 16, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8, 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#000000' }}>Student Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, color: '#000000', marginBottom: '16px' }}>
              <div>
                <strong>Name:</strong> {studentDetails.student.userName || 'Unknown'}
              </div>
              <div>
                <strong>Student ID:</strong> {studentDetails.student.studentId || 'Unknown'}
              </div>
              <div>
                <strong>Section:</strong> {studentDetails.student.section || 'Unknown'}
              </div>
              <div>
                <strong>Company:</strong> {studentDetails.student.companyName || 'Not assigned'}
              </div>
              <div>
                <strong>Coordinator:</strong> {studentDetails.coordinator?.userName || 'Not assigned'}
              </div>
            </div>
            
            {/* Company Details Section */}
            {studentDetails.company && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '6px', 
                border: '1px solid #f59e0b',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#000000', fontSize: '14px' }}>Company Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '13px', color: '#000000' }}>
                  <div>
                    <strong>Address:</strong> {studentDetails.company.address || 'N/A'}
                  </div>
                  <div>
                    <strong>Supervisor:</strong> {studentDetails.company.supervisor || 'N/A'}
                  </div>
                  <div>
                    <strong>Contact:</strong> {studentDetails.company.contactNumber || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          <WeeklyReportTable />
        </div>
      </div>
    </DashboardShell>
  )
}


