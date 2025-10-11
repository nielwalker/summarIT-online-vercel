import ChairmanDashboardPOList from './ChairmanDashboardPOList'
import DashboardShell from '../../components/DashboardShell'
import ChairmanSideNav from '../../components/ChairmanSideNav'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../../utils/api'

export default function ChairmanDashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState('IT4R8')
  const [selectedWeek, setSelectedWeek] = useState<number | 'overall'>(1)
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

  async function deleteCoordinator(coordinatorId: number) {
    try {
      const res = await fetch(getApiUrl('/api/admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteCoordinator', coordinatorId })
      })
      
      if (res.ok) {
        setMsg('Coordinator deleted successfully')
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
  }

  function startEditCoordinator(coordinator: any) {
    setEditingCoordinator(coordinator.id)
    setEditCoordName(coordinator.userName)
    setEditCoordSections(coordinator.sections.join(', '))
    setEditCoordIdValue(String(coordinator.coordinatorId || ''))
  }

  function startEditCompany(company: any) {
    setEditingCompany(company.id)
    setEditCompanyName(company.name)
    setEditCompanyAddress(company.address)
    setEditCompanySupervisor(company.supervisor)
    setEditCompanyContact(company.contactNumber)
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
          padding: '20px',
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
            marginBottom: '20px'
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
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
            border: '1px solid #e5e7eb', 
                width: '100%',
                maxWidth: '600px',
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
                      const value = e.target.value
                      setSelectedWeek(value === 'overall' ? 'overall' : Number(value))
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
                    <option value="overall">Overall</option>
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
                    const coordinator = allCoordinators.find(c => Array.isArray(c.sections) && c.sections.includes(section))
                    const companies = Array.from(new Set(sectionStudents.map(s => s.companyName).filter(Boolean))) as string[]
                    return (
                      <>
                        <div style={{ color: '#000000' }}>
                          <strong>Coordinator:</strong> {coordinator ? `${coordinator.userName}${coordinator.coordinatorId ? ` (ID: ${coordinator.coordinatorId})` : ''}` : '—'}
                        </div>
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
                alignItems: 'center',
                width: '100%',
                padding: '20px 0'
              }}>
                <div style={{ width: '100%', maxWidth: '900px', marginBottom: '16px' }}>
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
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#000000' }}>Student Registration</h3>
              <div style={{ display: 'grid', gap: 12, maxWidth: '500px' }}>
              <label>
              <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Student ID</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  value={studentId} 
                  onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} 
                  placeholder="e.g. 20251234"
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
                  onClick={() => setStudentId(`2025${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`)}
                  style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Generate
                </button>
              </div>
              </label>
              <label>
                <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Student Name</div>
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
              </label>
              <label>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Company</div>
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
              </label>
              <label>
                <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Section</div>
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
                    {coordinatorSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
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
                
                {/* Edit Student Form */}
                {editingStudent && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: '8px', 
                    border: '1px solid #3b82f6' 
                  }}>
                    <h5 style={{ margin: '0 0 16px 0', color: '#000000' }}>Edit Student</h5>
                    <div style={{ display: 'grid', gap: '12px', maxWidth: '500px' }}>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Student ID</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            value={editStudentId} 
                            onChange={(e) => setEditStudentId(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} 
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
                            onClick={() => setEditStudentId(`2025${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`)}
                            style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          >
                            Generate
                          </button>
                        </div>
                      </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Student Name</div>
                        <input 
                          value={editStudentName} 
                          onChange={(e) => setEditStudentName(e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: 8, 
                            border: '1px solid #d1d5db', 
                            borderRadius: 4,
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        />
                      </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Section</div>
                        <select 
                          value={editStudentSection} 
                          onChange={(e) => setEditStudentSection(e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: 8, 
                            border: '1px solid #d1d5db', 
                            borderRadius: 4,
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        >
                          {coordinatorSections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Company</div>
                        <select 
                          value={editSelectedCompanyId}
                          onChange={(e) => setEditSelectedCompanyId(e.target.value)}
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
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Coordinator Registration Content */}
          {activeMenu === 'coordinator' && (
            <div style={{ 
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#000000' }}>Coordinator Registration</h3>
              <div style={{ display: 'grid', gap: 12, maxWidth: '500px' }}>
              <label>
                <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Coordinator ID</div>
                  <input 
                    value={coordId} 
                    onChange={(e) => setCoordId(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} 
                    placeholder="e.g. 20251234"
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCoordId(`2025${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`)}
                    style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Generate
                  </button>
                </div>
              </label>
              <label>
                <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Coordinator Name</div>
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
              </label>
              <label>
                <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Assigned Section</div>
                  <input 
                  value={coordSection} 
                  onChange={(e) => setCoordSection(e.target.value)}
                    placeholder="e.g. IT4R8, IT4R9, IT4R10, IT4R11"
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    border: '1px solid #d1d5db', 
                    borderRadius: 4,
                    backgroundColor: 'white',
                    color: '#000000'
                  }}
                  />
              </label>
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
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCoordinators.map((coordinator, index) => (
                        <tr key={coordinator.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{coordinator.coordinatorId ?? '—'}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>{coordinator.userName}</td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>
                            {coordinator.sections.join(', ')}
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#000000' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              backgroundColor: coordinator.approved ? '#dcfce7' : '#fef3c7',
                              color: coordinator.approved ? '#166534' : '#92400e',
                              fontSize: '12px'
                            }}>
                              {coordinator.approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                            {editingCoordinator === coordinator.id ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  onClick={updateCoordinator}
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
                                  onClick={() => startEditCoordinator(coordinator)}
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
                                  onClick={() => deleteCoordinator(coordinator.id)}
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
                  {allCoordinators.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      No coordinators registered yet
                    </div>
                  )}
        </div>
        
                {/* Edit Coordinator Form */}
                {editingCoordinator && (
        <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
                    border: '1px solid #3b82f6' 
                  }}>
                    <h5 style={{ margin: '0 0 16px 0', color: '#000000' }}>Edit Coordinator</h5>
                <div style={{ display: 'grid', gap: '12px', maxWidth: '500px' }}>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Coordinator Name</div>
                        <input 
                          value={editCoordName} 
                          onChange={(e) => setEditCoordName(e.target.value)} 
              style={{
                            width: '100%', 
                            padding: 8, 
                border: '1px solid #d1d5db',
                            borderRadius: 4,
                backgroundColor: 'white',
                color: '#000000'
              }}
                        />
          </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Assigned Sections</div>
                        <input 
                          value={editCoordSections} 
                          onChange={(e) => setEditCoordSections(e.target.value)} 
                          placeholder="e.g. IT4R8, IT4R9, IT4R10, IT4R11"
              style={{
                            width: '100%', 
                            padding: 8, 
                border: '1px solid #d1d5db',
                            borderRadius: 4,
                backgroundColor: 'white',
                color: '#000000'
              }}
                        />
          </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Coordinator ID</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            value={editCoordIdValue} 
                            onChange={(e) => setEditCoordIdValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))} 
                            placeholder="e.g. 20251234"
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
                            onClick={() => setEditCoordIdValue(`2025${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`)}
                            style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          >
                            Generate
                          </button>
                        </div>
                      </label>
        </div>
                  </div>
                )}
              </div>
            </div>
          )}
        
          {/* Company Registration Content */}
          {activeMenu === 'company' && (
        <div style={{ 
              padding: '20px',
              backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#000000' }}>Company Registration</h3>
              <div style={{ display: 'grid', gap: 12, maxWidth: '500px' }}>
                <label>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Company Name</div>
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
          </label>
                <label>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Company Address</div>
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
                </label>
                <label>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Supervisor Name</div>
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
                </label>
                <label>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Contact Number</div>
                  <input 
                    value={companyContact} 
                    onChange={(e) => setCompanyContact(e.target.value)} 
                    placeholder="Contact Number"
                    style={{ 
                      width: '100%', 
                      padding: 8, 
                      border: '1px solid #d1d5db', 
                      borderRadius: 4,
                      backgroundColor: 'white',
                      color: '#000000'
                    }}
                  />
                </label>
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
        
                {/* Edit Company Form */}
                {editingCompany && (
        <div style={{ 
                    marginTop: '20px', 
                    padding: '20px', 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: '8px', 
                    border: '1px solid #3b82f6' 
                  }}>
                    <h5 style={{ margin: '0 0 16px 0', color: '#000000' }}>Edit Company</h5>
                    <div style={{ display: 'grid', gap: '12px', maxWidth: '500px' }}>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Company Name</div>
                        <input 
                          value={editCompanyName} 
                          onChange={(e) => setEditCompanyName(e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: 8, 
                            border: '1px solid #d1d5db', 
                            borderRadius: 4,
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        />
                      </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Company Address</div>
                        <input 
                          value={editCompanyAddress} 
                          onChange={(e) => setEditCompanyAddress(e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: 8, 
                            border: '1px solid #d1d5db', 
                            borderRadius: 4,
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        />
                      </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Supervisor Name</div>
                        <input 
                          value={editCompanySupervisor} 
                          onChange={(e) => setEditCompanySupervisor(e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: 8, 
                            border: '1px solid #d1d5db', 
                            borderRadius: 4,
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        />
                      </label>
                      <label>
                        <div style={{ fontWeight: 500, marginBottom: 4, color: '#000000' }}>Contact Number</div>
                        <input 
                          value={editCompanyContact} 
                          onChange={(e) => setEditCompanyContact(e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: 8, 
                            border: '1px solid #d1d5db', 
                            borderRadius: 4,
                            backgroundColor: 'white',
                            color: '#000000'
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}


