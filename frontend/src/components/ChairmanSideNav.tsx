import { useEffect } from 'react'

interface ChairmanSideNavProps {
  onLogout: () => void
  activeMenu: 'overview' | 'student' | 'coordinator' | 'company'
  setActiveMenu: (menu: 'overview' | 'student' | 'coordinator' | 'company') => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export default function ChairmanSideNav({ onLogout, activeMenu, setActiveMenu, isCollapsed, setIsCollapsed }: ChairmanSideNavProps) {

  // Immediate hover response
  useEffect(() => {
    const navElement = document.getElementById('chairman-side-nav')
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
      id: 'overview', 
      label: 'Overview & Analysis', 
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
      id: 'student', 
      label: 'Student Registration', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    { 
      id: 'coordinator', 
      label: 'Coordinator Registration', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    { 
      id: 'company', 
      label: 'Company Registration', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9,22 9,12 15,12 15,22"></polyline>
        </svg>
      )
    },
  ]

  const handleNavClick = (itemId: 'overview' | 'student' | 'coordinator' | 'company') => {
    setActiveMenu(itemId)
  }

  return (
    <div
      id="chairman-side-nav"
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="/summarit logo.png" alt="SummarIT" style={{ width: '32px', height: '32px' }} />
        </div>
        {!isCollapsed && (
          <div style={{ marginLeft: '12px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>Chairman Portal</h2>
            <p style={{ margin: '0', fontSize: '14px', color: '#93c5fd' }}>Management Center</p>
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
            onClick={() => handleNavClick(item.id as 'overview' | 'student' | 'coordinator' | 'company')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              margin: '4px 0',
              backgroundColor: activeMenu === item.id ? '#3b82f6' : 'transparent',
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
              if (activeMenu !== item.id) {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
            onMouseLeave={(e) => {
              if (activeMenu !== item.id) {
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
