import { useState, useEffect } from 'react'

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

interface StudentSideNavProps {
  studentDetails: StudentDetails | null
  onLogout: () => void
}

export default function StudentSideNav({ studentDetails, onLogout }: StudentSideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Immediate hover response
  useEffect(() => {
    const navElement = document.getElementById('student-side-nav')
    if (navElement) {
      const handleMouseEnter = () => {
        setIsCollapsed(false)
      }
      const handleMouseLeave = () => {
        setIsCollapsed(true)
      }

      navElement.addEventListener('mouseenter', handleMouseEnter)
      navElement.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        navElement.removeEventListener('mouseenter', handleMouseEnter)
        navElement.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ]

  const handleNavClick = (itemId: string) => {
    setActiveTab(itemId)
  }

  return (
    <div
      id="student-side-nav"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isCollapsed ? '64px' : '256px',
        backgroundColor: '#1e3a8a', // Dark blue
        color: 'white',
        transition: 'width 0.2s ease-in-out',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #3b82f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ color: '#1e3a8a', fontWeight: 'bold', fontSize: '14px' }}>S</span>
        </div>
        {!isCollapsed && (
          <div style={{ marginLeft: '12px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>Student Portal</h2>
            <p style={{ margin: '0', fontSize: '14px', color: '#93c5fd' }}>Welcome back!</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0'
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              margin: '4px 0',
              backgroundColor: activeTab === item.id ? '#3b82f6' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'left',
              transition: 'background-color 0.2s ease',
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <span style={{ 
              fontSize: '20px', 
              marginRight: isCollapsed ? '0' : '12px',
              filter: 'grayscale(100%) brightness(0) invert(1)' // Black and white icon
            }}>
              {item.icon}
            </span>
            {!isCollapsed && <span style={{ fontWeight: '500' }}>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile Content */}
      {activeTab === 'profile' && !isCollapsed && (
        <div style={{ 
          margin: '16px',
          padding: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '8px'
        }}>
          {/* Student Information */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#93c5fd', 
              margin: '0 0 8px 0' 
            }}>
              Student Information
            </h3>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              <div><span style={{ color: '#93c5fd' }}>ID:</span> {studentDetails?.student.studentId || 'N/A'}</div>
              <div><span style={{ color: '#93c5fd' }}>Name:</span> {studentDetails?.student.userName || 'N/A'}</div>
              <div><span style={{ color: '#93c5fd' }}>Section:</span> {studentDetails?.student.section || 'N/A'}</div>
            </div>
          </div>

          {/* Company Information */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#93c5fd', 
              margin: '0 0 8px 0' 
            }}>
              Company Information
            </h3>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              <div><span style={{ color: '#93c5fd' }}>Company:</span> {studentDetails?.student.companyName || 'N/A'}</div>
              <div><span style={{ color: '#93c5fd' }}>Address:</span> {studentDetails?.student.companyAddress || 'N/A'}</div>
              <div><span style={{ color: '#93c5fd' }}>Supervisor:</span> {studentDetails?.student.companySupervisor || 'N/A'}</div>
              <div><span style={{ color: '#93c5fd' }}>Contact:</span> {studentDetails?.student.companyContact || 'N/A'}</div>
            </div>
          </div>

          {/* Coordinator Information */}
          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#93c5fd', 
              margin: '0 0 8px 0' 
            }}>
              Coordinator Information
            </h3>
            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
              <div><span style={{ color: '#93c5fd' }}>Name:</span> {studentDetails?.coordinator.userName || 'N/A'}</div>
              <div><span style={{ color: '#93c5fd' }}>ID:</span> {studentDetails?.coordinator.coordinatorId || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div style={{ 
        padding: '16px',
        marginTop: 'auto'
      }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#3b82f6', // Blue color
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          <span style={{ 
            fontSize: '20px', 
            marginRight: isCollapsed ? '0' : '12px',
            filter: 'grayscale(100%) brightness(0) invert(1)' // Black and white icon
          }}>
            🚪
          </span>
          {!isCollapsed && <span style={{ fontWeight: '500' }}>Logout</span>}
        </button>
      </div>
    </div>
  )
}
