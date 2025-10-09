import { useState, useEffect } from 'react'

interface ChairmanSideNavProps {
  onLogout: () => void
  activeMenu: 'overview' | 'student' | 'coordinator' | 'company'
  setActiveMenu: (menu: 'overview' | 'student' | 'coordinator' | 'company') => void
}

export default function ChairmanSideNav({ onLogout, activeMenu, setActiveMenu }: ChairmanSideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    { id: 'overview', label: 'Overview & Analysis', icon: '📊' },
    { id: 'student', label: 'Student Registration', icon: '👨‍🎓' },
    { id: 'coordinator', label: 'Coordinator Registration', icon: '👨‍🏫' },
    { id: 'company', label: 'Company Registration', icon: '🏢' },
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
          backgroundColor: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ color: '#1e3a8a', fontWeight: 'bold', fontSize: '14px' }}>C</span>
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
              filter: 'grayscale(100%) brightness(0) invert(1)' // Black and white icon
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
