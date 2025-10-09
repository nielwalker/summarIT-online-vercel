import { useState, useEffect } from 'react'

interface StudentSideNavProps {
  onLogout: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function StudentSideNav({ onLogout, activeTab, setActiveTab }: StudentSideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
  ]


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
            onClick={() => setActiveTab(item.id)}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              {item.icon}
            </span>
            {!isCollapsed && <span style={{ fontWeight: '500' }}>{item.label}</span>}
          </button>
        ))}
      </nav>


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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          {!isCollapsed && <span style={{ fontWeight: '500' }}>Logout</span>}
        </button>
      </div>
    </div>
  )
}
