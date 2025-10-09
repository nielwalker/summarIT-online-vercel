import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ChairmanSideNavProps {
  onLogout: () => void
  activeMenu: 'overview' | 'student' | 'coordinator' | 'company'
  setActiveMenu: (menu: 'overview' | 'student' | 'coordinator' | 'company') => void
}

export default function ChairmanSideNav({ onLogout, activeMenu, setActiveMenu }: ChairmanSideNavProps) {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse after 3 seconds of no hover
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleMouseLeave = () => {
      timeoutId = setTimeout(() => setIsCollapsed(true), 3000)
    }
    const handleMouseEnter = () => {
      clearTimeout(timeoutId)
    }

    const navElement = document.getElementById('chairman-side-nav')
    if (navElement) {
      navElement.addEventListener('mouseleave', handleMouseLeave)
      navElement.addEventListener('mouseenter', handleMouseEnter)
    }

    return () => {
      if (navElement) {
        navElement.removeEventListener('mouseleave', handleMouseLeave)
        navElement.removeEventListener('mouseenter', handleMouseEnter)
      }
      clearTimeout(timeoutId)
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
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-purple-600 to-purple-800 text-white transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-500">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">C</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Chairman Portal</h2>
              <p className="text-purple-200 text-sm">Management Center</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">C</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id as 'overview' | 'student' | 'coordinator' | 'company')}
            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${
              activeMenu === item.id
                ? 'bg-purple-500 border-r-4 border-white'
                : 'hover:bg-purple-500/50'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
        >
          <span className="text-xl mr-3">🚪</span>
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  )
}
