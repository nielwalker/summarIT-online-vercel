import ChairmanDashboardPOList from './ChairmanDashboardPOList'
import DashboardShell from '../../components/DashboardShell'
import ChairmanSideNav from '../../components/ChairmanSideNav'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../../utils/api'

export default function ChairmanDashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState('IT4R8')
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [coordName, setCoordName] = useState('')
  const [coordId, setCoordId] = useState('')
  const [coordSection, setCoordSection] = useState<string>('')
  const [msg, setMsg] = useState<string>('')
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null)
  // Auto-dismiss notifications after a few seconds
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(''), 4000)
    return () => clearTimeout(t)
  }, [msg])

  // Company registration states
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [companyContact, setCompanyContact] = useState('')
  
  // Dynamic data states
  const [companies, setCompanies] = useState<Array<{ id: number; name: string }>>([])
  const [coordinatorSections, setCoordinatorSections] = useState<string[]>([])
  
  // Data tables states
  const [allStudents, setAllStudents] = useState<Array<{ studentId: string; userName: string; section: string; companyName: string | null }>>([])
  const [allCoordinators, setAllCoordinators] = useState<Array<{ id: number; coordinatorId?: number | null; userName: string; sections: string[]; approved: boolean }>>([])
  const [allCompanies, setAllCompanies] = useState<Array<{ id: number; name: string; address: string; supervisor: string; contactNumber: string }>>([])
  
  // Edit states
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [editingCoordinator, setEditingCoordinator] = useState<number | null>(null)
  const [editingCompany, setEditingCompany] = useState<number | null>(null)
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [modalType, setModalType] = useState<'student' | 'coordinator' | 'company'>('student')
  
  // Edit form states
  const [editStudentId, setEditStudentId] = useState('')
  const [editStudentName, setEditStudentName] = useState('')
  const [editStudentSection, setEditStudentSection] = useState('')
  const [editStudentCompany, setEditStudentCompany] = useState('')
  const [editSelectedCompanyId, setEditSelectedCompanyId] = useState<string>('')
  
  const [editCoordName, setEditCoordName] = useState('')
  const [editCoordSections, setEditCoordSections] = useState('')
  const [editCoordIdValue, setEditCoordIdValue] = useState('')
  
  const [editCompanyName, setEditCompanyName] = useState('')
  const [editCompanyAddress, setEditCompanyAddress] = useState('')
  const [editCompanySupervisor, setEditCompanySupervisor] = useState('')
  const [editCompanyContact, setEditCompanyContact] = useState('')
  
  // Navigation state
  const [activeMenu, setActiveMenu] = useState<'overview' | 'student' | 'coordinator' | 'company'>('overview')

  const ALL_WEEKS = Array.from({ length: 13 }, (_, i) => i + 1) // 13 weeks is the standard internship duration

  // Load companies and coordinator sections on component mount
  useEffect(() => {
    loadCompanies()
    loadCoordinatorSections()
    loadAllData()
  }, [])

  // Load all data for tables
  async function loadAllData() {
    try {
      // Load all students
      const studentsRes = await fetch(getApiUrl('/api/admin?action=listAllStudents'))
      if (studentsRes.ok) {
        const students = await studentsRes.json()
        setAllStudents(students || [])
        console.log('Loaded students:', students)
      } else {
        console.error('Failed to load students:', studentsRes.status)
      }
      
      // Load all coordinators
      const coordinatorsRes = await fetch(getApiUrl('/api/admin?action=listAllCoordinators'))
      if (coordinatorsRes.ok) {
        const coordinators = await coordinatorsRes.json()
        setAllCoordinators(coordinators || [])
        console.log('Loaded coordinators:', coordinators)
      } else {
        console.error('Failed to load coordinators:', coordinatorsRes.status)
      }
      
      // Load all companies
      const companiesRes = await fetch(getApiUrl('/api/admin?action=getCompanies'))
      if (companiesRes.ok) {
        const companies = await companiesRes.json()
        setAllCompanies(companies || [])
        console.log('Loaded companies:', companies)
      } else {
        console.error('Failed to load companies:', companiesRes.status)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setMsg(`Error loading data: ${error}`)
    }
  }

  async function loadCompanies() {
    try {
      const res = await fetch(getApiUrl('/api/admin?action=getCompanies'))
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  async function loadCoordinatorSections() {
    try {
      const res = await fetch(getApiUrl('/api/admin?action=getCoordinatorSections'))
      if (res.ok) {
        const data = await res.json()
        setCoordinatorSections(data)
        if (data.length > 0) {
          setSection(data[0])
        }
      }
    } catch (error) {
      console.error('Error loading coordinator sections:', error)
    }
  }

  async function registerStudent() {
    setMsg('')
    if (!studentId || !section || !selectedCompanyId) { 
      setMsg('Student ID, section, and company are required'); 
      return 
    }
    
    // Check for duplicate student ID
    const existingStudent = allStudents.find(s => s.studentId === studentId)
    if (existingStudent) {
      setMsg(`Student ID ${studentId} is already taken. Please use a different ID.`)
      return
    }
    
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'registerStudent', 
          studentId, 
          section, 
          userName: studentName || undefined, 
          companyId: selectedCompanyId 
        })
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        setMsg(`Register student failed: ${t}`)
        return
      }
      setMsg('Student registered successfully')
      setStudentId('')
      setStudentName('')
      setSelectedCompanyId('')
      loadAllData() // Reload all data tables
    } catch (e: any) {
      setMsg(`Register student error: ${e?.message || String(e)}`)
    }
  }

  async function registerCompany() {
    setMsg('')
    if (!companyName || !companyAddress || !supervisor || !companyContact) { 
      setMsg('All company fields are required'); 
      return 
    }
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'registerCompany', 
          name: companyName,
          address: companyAddress,
          supervisor: supervisor,
          contactNumber: companyContact
        })
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        setMsg(`Register company failed: ${t}`)
        return
      }
      setMsg('Company registered successfully')
      setCompanyName('')
      setCompanyAddress('')
      setSupervisor('')
      setCompanyContact('')
      loadCompanies() // Reload companies list
      loadAllData() // Reload all data tables
    } catch (e: any) {
      setMsg(`Register company error: ${e?.message || String(e)}`)
    }
  }

  async function registerCoordinator() {
    setMsg('')
    if (!coordName || !coordSection || !coordId) { setMsg('Coordinator ID, name, and section are required'); return }
    
    // Check for duplicate coordinator ID
    const existingCoordinator = allCoordinators.find(c => c.coordinatorId === Number(coordId))
    if (existingCoordinator) {
      setMsg(`Coordinator ID ${coordId} is already taken. Please use a different ID.`)
      return
    }
    
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registerCoordinator', userName: coordName, coordinatorId: Number(coordId), sections: [coordSection.trim()] })
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        setMsg(`Register coordinator failed: ${t}`)
        return
      }
      setMsg('Coordinator registered successfully')
      setCoordName('')
      setCoordSection('')
      setCoordId('')
      loadCoordinatorSections() // Reload coordinator sections
      loadAllData() // Reload all data tables
    } catch (e: any) {
      setMsg(`Register coordinator error: ${e?.message || String(e)}`)
    }
  }

  // Delete functions
  async function deleteStudent(studentId: string) {
    if (!confirm(`Are you sure you want to delete student ${studentId}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteStudent', studentId })
      })
      
      if (res.ok) {
        setMsg('Student deleted successfully')
        loadAllData() // Reload data
      } else {
        const error = await res.json()
        setMsg(`Delete failed: ${error.error}`)
      }
    } catch (e: any) {
      setMsg(`Delete error: ${e?.message || String(e)}`)
    }
  }


  async function deleteCompany(companyId: number) {
    if (!confirm(`Are you sure you want to delete this company? This action cannot be undone.`)) {
      return
    }
    
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteCompany', companyId })
      })
      
      if (res.ok) {
        setMsg('Company deleted successfully')
        loadAllData() // Reload data
      } else {
        const error = await res.json()
        setMsg(`Delete failed: ${error.error}`)
      }
    } catch (e: any) {
      setMsg(`Delete error: ${e?.message || String(e)}`)
    }
  }

  // Edit functions
  function startEditStudent(student: any) {
    setEditingStudent(student.studentId)
    setEditStudentId(student.studentId)
    setEditStudentName(student.userName)
    setEditStudentSection(student.section)
    setEditStudentCompany(student.companyName || '')
    // Pre-select company id if company list has a matching name
    const matched = companies.find(c => c.name === (student.companyName || ''))
    setEditSelectedCompanyId(matched ? String(matched.id) : '')
    setModalType('student')
    setShowEditModal(true)
  }


  function startEditCompany(company: any) {
    setEditingCompany(company.id)
    setEditCompanyName(company.name)
    setEditCompanyAddress(company.address)
    setEditCompanySupervisor(company.supervisor)
    setEditCompanyContact(company.contactNumber)
    setModalType('company')
    setShowEditModal(true)
  }

  function cancelEdit() {
    setEditingStudent(null)
    setEditingCoordinator(null)
    setEditingCompany(null)
    setEditStudentId('')
    setEditStudentName('')
    setEditStudentSection('')
    setEditStudentCompany('')
    setEditCoordName('')
    setEditCoordSections('')
    setEditCompanyName('')
    setEditCompanyAddress('')
    setEditCompanySupervisor('')
    setEditCompanyContact('')
    setShowEditModal(false)
  }

  async function updateStudent() {
    try {
      // Map selected company id to company name for API (kept compatible with existing endpoint)
      let companyNameToSave: string | undefined = editStudentCompany
      if (editSelectedCompanyId) {
        const c = companies.find(co => String(co.id) === String(editSelectedCompanyId))
        if (c) companyNameToSave = c.name
      }
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStudent',
          studentId: editingStudent,
          newStudentId: editStudentId && editStudentId !== editingStudent ? editStudentId : undefined,
          userName: editStudentName,
          section: editStudentSection,
          companyName: companyNameToSave
        })
      })
      
      if (res.ok) {
        setMsg('Student updated successfully')
        loadAllData()
        cancelEdit()
      } else {
        const error = await res.json().catch(() => ({} as any))
        setMsg(`Update failed: ${error.error || 'Unexpected error'}`)
      }
    } catch (e: any) {
      setMsg(`Update error: ${e?.message || String(e)}`)
    }
  }

  async function updateCoordinator() {
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCoordinator',
          coordinatorId: editingCoordinator,
          userName: editCoordName,
          sections: editCoordSections.split(',').map(s => s.trim()).filter(Boolean),
          coordinatorIdValue: editCoordIdValue ? Number(editCoordIdValue) : undefined
        })
      })
      
      if (res.ok) {
        setMsg('Coordinator updated successfully')
        loadAllData()
        loadCoordinatorSections()
        cancelEdit()
      } else {
        const error = await res.json()
        setMsg(`Update failed: ${error.error}`)
      }
    } catch (e: any) {
      setMsg(`Update error: ${e?.message || String(e)}`)
    }
  }

  async function updateCompany() {
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCompany',
          companyId: editingCompany,
          name: editCompanyName,
          address: editCompanyAddress,
          supervisor: editCompanySupervisor,
          contactNumber: editCompanyContact
        })
      })
      
      if (res.ok) {
        setMsg('Company updated successfully')
        loadAllData()
        loadCompanies()
        cancelEdit()
      } else {
        const error = await res.json()
        setMsg(`Update failed: ${error.error}`)
      }
    } catch (e: any) {
      setMsg(`Update error: ${e?.message || String(e)}`)
    }
  }

  return (
    <DashboardShell>
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
        <ChairmanSideNav 
          onLogout={() => {
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
          }}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          isCollapsed={sidebarCollapsed}
          setIsCollapsed={setSidebarCollapsed}
        />

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '64px' : '256px', // Dynamic width based on sidebar state
          display: 'flex',
          flexDirection: 'column',
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
          {/* Header */}
          <div style={{ 
            marginBottom: '20px',
            padding: '20px 20px 0 20px'
          }}>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              color: '#1f2937', 
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              {activeMenu === 'overview' && 'Chairman Dashboard - Section Analysis'}
              {activeMenu === 'student' && 'Student Registration'}
              {activeMenu === 'coordinator' && 'Coordinator Registration'}
              {activeMenu === 'company' && 'Company Registration'}
            </h1>
            <p style={{ 
              margin: '0', 
              color: '#6b7280', 
              fontSize: '16px'
            }}>
              Manage students, coordinators, and companies
            </p>
          </div>
        
        {msg && (
          <div style={{ 
            marginBottom: '20px', 
            marginLeft: '20px',
            marginRight: '20px',
            padding: '12px',
            backgroundColor: msg.includes('successfully') || msg.includes('registered') ? '#f0f9ff' : '#fef2f2',
            border: `1px solid ${msg.includes('successfully') || msg.includes('registered') ? '#3b82f6' : '#dc2626'}`,
            borderRadius: '8px',
            color: msg.includes('successfully') || msg.includes('registered') ? '#1e40af' : '#dc2626'
          }}>
            {msg}
          </div>
        )}
        
          {/* Overview & Analysis Content */}
          {activeMenu === 'overview' && (
        <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Chart Controls */}
          <div style={{ 
                display: 'flex', 
                gap: 16, 
                alignItems: 'center', 
                margin: '0 auto 20px auto',
                padding: '12px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
            border: '1px solid #e5e7eb', 
                width: '100%',
                justifyContent: 'center'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>Section:</span>
                  <select 
                    value={section} 
                    onChange={(e) => setSection(e.target.value)}
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23475569\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center'
                    }}
                  >
                    {coordinatorSections.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => {
                      setSelectedWeek(Number(e.target.value))
                    }}
                    style={{
                      padding: '8px 32px 8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23475569\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center'
                    }}
                  >
                    {ALL_WEEKS.map(week => (
                      <option key={week} value={week}>
                        Week {week}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Section Summary Info */}
              {section && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}>
                  {(() => {
                    const sectionStudents = allStudents.filter(s => s.section === section)
                    const totalInterns = sectionStudents.length
                    const companies = Array.from(new Set(sectionStudents.map(s => s.companyName).filter(Boolean))) as string[]
                    return (
                      <>
                        <div style={{ color: '#000000' }}>
                          <strong>Total Interns:</strong> {totalInterns}
                        </div>
                        <div style={{ color: '#000000' }}>
                          <strong>Companies:</strong> {companies.length ? companies.join(', ') : '—'}
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
        
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%'
              }}>
                <div style={{ width: '100%', padding: '0 20px' }}>
                  <ChairmanDashboardPOList section={section} selectedWeek={selectedWeek} />
                </div>
                {/* Removed bottom chart per request */}
              </div>
            </div>
          )}
          
          {/* Student Registration Content */}
          {activeMenu === 'student' && (
            <div style={{ 
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              margin: '0 20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#000000' }}>Student Registration</h3>
              <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  value={studentId} 
                  onChange={(e) => {
                    const raw = e.target.value
                    const digitsOnly = raw.replace(/[^0-9]/g, '')
                    if (raw !== digitsOnly) {
                      setMsg('Only digits are allowed for Student ID. Letters are not allowed.')
                    }
                    setStudentId(digitsOnly.slice(0, 10))
                  }} 
                  placeholder="Student ID (10 digits)"
                  style={{ 
                    flex: 1,
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setStudentId(`2025${Math.floor(Math.random()*1000000).toString().padStart(6,'0')}`)}
                  style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Generate
                </button>
              </div>
              <input 
                value={studentName} 
                onChange={(e) => setStudentName(e.target.value)} 
                placeholder="Student Name"
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  border: '1px solid #d1d5db', 
                  borderRadius: 4,
                  backgroundColor: 'white',
                  color: '#000000'
                }}
              />
              <select 
                value={selectedCompanyId} 
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  border: '1px solid #d1d5db', 
                  borderRadius: 4,
                  backgroundColor: 'white',
                  color: '#000000'
                }}
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              <select 
                value={section} 
                onChange={(e) => setSection(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  border: '1px solid #d1d5db', 
                  borderRadius: 4,
                  backgroundColor: 'white',
                  color: '#000000'
                }}
              >
                <option value="">Select Section</option>
                {coordinatorSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button 
                onClick={registerStudent}
                style={{ 
                  padding: '10px 16px', 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Register Student
              </button>
          </div>

              {/* Students Table */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#000000' }}>Registered Students</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={loadAllData}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={() => {
                        const rows = allStudents.map(s => `${s.studentId},${s.userName},${s.section},${s.companyName || ''}`)
                        const csv = ['Student ID,Name,Section,Company', ...rows].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `students_${section}.csv`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ⬇️ Download CSV
                    </button>
                  </div>
                </div>
          <div style={{ 
            border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Student ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Section</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Company</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStudents.map((student, index) => (
                        <tr key={student.studentId} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{student.studentId}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{student.userName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{student.section}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{student.companyName || 'N/A'}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            {editingStudent === student.studentId ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  onClick={updateStudent}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => startEditStudent(student)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteStudent(student.studentId)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allStudents.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No students registered yet
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          )}
          
          {/* Coordinator Registration Content */}
          {activeMenu === 'coordinator' && (
            <div style={{ 
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              margin: '0 20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#000000' }}>Coordinator Registration</h3>
              <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  value={coordId} 
                  onChange={(e) => {
                    const raw = e.target.value
                    const digitsOnly = raw.replace(/[^0-9]/g, '')
                    if (raw !== digitsOnly) {
                      setMsg('Only digits are allowed for Coordinator ID. Letters are not allowed.')
                    }
                    setCoordId(digitsOnly.slice(0, 10))
                  }} 
                  placeholder="Coordinator ID (10 digits)"
                  style={{ 
                    flex: 1,
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setCoordId(`2025${Math.floor(Math.random()*1000000).toString().padStart(6,'0')}`)}
                  style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Generate
                </button>
              </div>
              <input 
                value={coordName} 
                onChange={(e) => setCoordName(e.target.value)} 
                placeholder="Coordinator Name"
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  border: '1px solid #d1d5db', 
                  borderRadius: 4,
                  backgroundColor: 'white',
                  color: '#000000'
                }}
              />
              <input 
                value={coordSection} 
                onChange={(e) => setCoordSection(e.target.value)}
                placeholder="Assigned Section (e.g. IT4R8, IT4R9, IT4R10, IT4R11)"
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  border: '1px solid #d1d5db', 
                  borderRadius: 4,
                  backgroundColor: 'white',
                  color: '#000000'
                }}
              />
              <button 
                onClick={registerCoordinator}
                style={{ 
                  padding: '10px 16px', 
                    backgroundColor: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4, 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Register Coordinator
              </button>
            </div>

              {/* Coordinators Table */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#000000' }}>Registered Coordinators</h4>
                  <button
                    onClick={loadAllData}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Coordinator ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Sections</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCoordinators.map((coordinator, index) => (
                        <tr key={coordinator.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{coordinator.coordinatorId || 'N/A'}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{coordinator.userName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{coordinator.sections.join(', ')}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: coordinator.approved ? '#dcfce7' : '#fee2e2',
                              color: coordinator.approved ? '#166534' : '#991b1b'
                            }}>
                              {coordinator.approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  setEditingCoordinator(coordinator.id)
                                  setEditCoordName(coordinator.userName)
                                  setEditCoordSections(coordinator.sections.join(', '))
                                  setEditCoordIdValue(coordinator.coordinatorId?.toString() || '')
                                  setModalType('coordinator')
                                  setShowEditModal(true)
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allCoordinators.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No coordinators registered yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        
          {/* Company Registration Content */}
          {activeMenu === 'company' && (
            <div style={{ 
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              margin: '0 20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#000000' }}>Company Registration</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="Company Name"
                  style={{
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <input 
                  value={companyAddress} 
                  onChange={(e) => setCompanyAddress(e.target.value)} 
                  placeholder="Company Address"
                  style={{
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <input 
                  value={supervisor} 
                  onChange={(e) => setSupervisor(e.target.value)} 
                  placeholder="Supervisor Name"
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <input 
                  value={companyContact} 
                  onChange={(e) => {
                    const raw = e.target.value
                    const digitsOnly = raw.replace(/[^0-9]/g, '')
                    if (raw !== digitsOnly) {
                      setMsg('Only digits are allowed for Contact Number.')
                    }
                    setCompanyContact(digitsOnly.slice(0, 11))
                  }} 
                  placeholder="Contact Number (11 digits)"
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <button 
                  onClick={registerCompany}
                  style={{ 
                    padding: '10px 16px', 
                    backgroundColor: '#3b82f6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4, 
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Register Company
                </button>
              </div>
              
              {/* Companies Table */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0', color: '#000000' }}>Registered Companies</h4>
                  <button
                    onClick={loadAllData}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Company Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Address</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Supervisor</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Contact</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCompanies.map((company, index) => (
                        <tr key={company.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{company.name}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{company.address}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{company.supervisor}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{company.contactNumber}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            {editingCompany === company.id ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  onClick={updateCompany}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => startEditCompany(company)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteCompany(company.id)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allCompanies.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No companies registered yet
                    </div>
                  )}
        </div>
        
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '600' }}>
                {modalType === 'student' && 'Edit Student'}
                {modalType === 'coordinator' && 'Edit Coordinator'}
                {modalType === 'company' && 'Edit Company'}
              </h3>
              <button
                onClick={cancelEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Student Edit Form */}
            {modalType === 'student' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Student ID
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={editStudentId}
                      onChange={(e) => {
                        const raw = e.target.value
                        const digitsOnly = raw.replace(/[^0-9]/g, '')
                        if (raw !== digitsOnly) setMsg('Only digits are allowed for Student ID.')
                        setEditStudentId(digitsOnly.slice(0, 10))
                      }}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        color: '#000000',
                        flex: 1
                      }}
                    />
                    <button
                      onClick={() => {
                        const newId = '2025' + Math.random().toString().slice(2, 8)
                        setEditStudentId(newId)
                      }}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Section
                  </label>
                  <select
                    value={editStudentSection}
                    onChange={(e) => setEditStudentSection(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  >
                    {coordinatorSections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Company
                  </label>
                  <select
                    value={editSelectedCompanyId}
                    onChange={(e) => setEditSelectedCompanyId(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={String(company.id)}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateStudent}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Update Student
                  </button>
                </div>
              </div>
            )}

            {/* Coordinator Edit Form */}
            {modalType === 'coordinator' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Coordinator ID
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={editCoordIdValue}
                      onChange={(e) => {
                        const raw = e.target.value
                        const digitsOnly = raw.replace(/[^0-9]/g, '')
                        if (raw !== digitsOnly) setMsg('Only digits are allowed for Coordinator ID.')
                        setEditCoordIdValue(digitsOnly.slice(0, 10))
                      }}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        color: '#000000',
                        flex: 1
                      }}
                    />
                    <button
                      onClick={() => {
                        const newId = '2025' + Math.random().toString().slice(2, 8)
                        setEditCoordIdValue(newId)
                      }}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={editCoordName}
                    onChange={(e) => setEditCoordName(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Sections (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editCoordSections}
                    onChange={(e) => setEditCoordSections(e.target.value)}
                    placeholder="e.g., IT4R8, IT4R9"
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateCoordinator}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Update Coordinator
                  </button>
                </div>
              </div>
            )}

            {/* Company Edit Form */}
            {modalType === 'company' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Address
                  </label>
                  <textarea
                    value={editCompanyAddress}
                    onChange={(e) => setEditCompanyAddress(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Supervisor
                  </label>
                  <input
                    type="text"
                    value={editCompanySupervisor}
                    onChange={(e) => setEditCompanySupervisor(e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#111827' }}>
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={editCompanyContact}
                    onChange={(e) => {
                      const raw = e.target.value
                      const digitsOnly = raw.replace(/[^0-9]/g, '')
                      if (raw !== digitsOnly) setMsg('Only digits are allowed for Contact Number.')
                      setEditCompanyContact(digitsOnly.slice(0, 11))
                    }}
                    style={{
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#000000',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateCompany}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Update Company
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}


