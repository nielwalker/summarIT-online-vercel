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

  // Auto-collapse after 3 seconds of no hover
  useEffect(() => {
    let timeoutId: number
    const handleMouseLeave = () => {
      timeoutId = setTimeout(() => setIsCollapsed(true), 3000)
    }
    const handleMouseEnter = () => {
      clearTimeout(timeoutId)
    }

    const navElement = document.getElementById('student-side-nav')
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
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ]

  const handleNavClick = (itemId: string) => {
    setActiveTab(itemId)
  }

  return (
    <div
      id="student-side-nav"
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      onMouseEnter={() => setIsCollapsed(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-500">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">S</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Student Portal</h2>
              <p className="text-blue-200 text-sm">Welcome back!</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">S</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${
              activeTab === item.id
                ? 'bg-blue-500 border-r-4 border-white'
                : 'hover:bg-blue-500/50'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile Content */}
      {activeTab === 'profile' && !isCollapsed && (
        <div className="mt-4 px-4 pb-4">
          <div className="bg-blue-500/20 rounded-lg p-4 space-y-4">
            {/* Student Information */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Student Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-blue-300">ID:</span> {studentDetails?.student.studentId || 'N/A'}</div>
                <div><span className="text-blue-300">Name:</span> {studentDetails?.student.userName || 'N/A'}</div>
                <div><span className="text-blue-300">Section:</span> {studentDetails?.student.section || 'N/A'}</div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Company Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-blue-300">Company:</span> {studentDetails?.student.companyName || 'N/A'}</div>
                <div><span className="text-blue-300">Address:</span> {studentDetails?.student.companyAddress || 'N/A'}</div>
                <div><span className="text-blue-300">Supervisor:</span> {studentDetails?.student.companySupervisor || 'N/A'}</div>
                <div><span className="text-blue-300">Contact:</span> {studentDetails?.student.companyContact || 'N/A'}</div>
              </div>
            </div>

            {/* Coordinator Information */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Coordinator Information</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-blue-300">Name:</span> {studentDetails?.coordinator.userName || 'N/A'}</div>
                <div><span className="text-blue-300">ID:</span> {studentDetails?.coordinator.coordinatorId || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

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
