
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

interface StudentProfileProps {
  studentDetails: StudentDetails | null
}

export default function StudentProfile({ studentDetails }: StudentProfileProps) {
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          padding: '24px',
          color: 'white'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Student Profile
          </h1>
          <p style={{
            margin: '0',
            fontSize: '16px',
            opacity: 0.9
          }}>
            View your personal information and internship details
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Student Information */}
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Student Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Student ID</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.studentId || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Full Name</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.userName || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Section</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.section || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
              Company Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Company Name</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.companyName || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Address</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.companyAddress || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Supervisor</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.companySupervisor || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Contact</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.student.companyContact || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Coordinator Information */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e3a8a',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Coordinator Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Coordinator Name</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.coordinator.userName || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '4px', display: 'block' }}>Coordinator ID</label>
                <div style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: '500' }}>
                  {studentDetails?.coordinator.coordinatorId || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
