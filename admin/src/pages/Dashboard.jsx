import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import logo from '../icon.png'
import {
  LayoutDashboard, ClipboardList, Wrench, Users, Search, CreditCard,
  Trash2, ShieldAlert, LogOut, RefreshCw, AlertCircle, Menu, Clock,
} from 'lucide-react'
import OverviewSection from './OverviewSection'
import { ComplaintsSection } from './ComplaintsSection'
import MaintenanceSection from './MaintenanceSection'
import StaffUsersSection from './StaffUsersSection'
import LostFoundSection from './LostFoundSection'
import IdCardsSection from './IdCardsSection'
import DeletionsSection from './DeletionsSection'
import SecuritySection from './SecuritySection'
import HistorySection from './HistorySection'
import FlaggedSection from './FlaggedSection'

export default function Dashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [staff, setStaff] = useState([])
  const [complaints, setComplaints] = useState([])
  const [users, setUsers] = useState([])
const [lostFoundItems, setLostFoundItems] = useState([])
  const [lostReports, setLostReports] = useState([])
 
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, students: 0, teachers: 0, complaints: {}, pendingIdCardRequests: 0, pendingDeletionRequests: 0, openSecurityIssues: 0 })
  const [staffTab, setStaffTab] = useState('pending')
  const [complaintTab, setComplaintTab] = useState('all')
  const [userTab, setUserTab] = useState('student')
 const [lfTab, setLfTab] = useState('found_items')
  const [loading, setLoading] = useState(true)
  const [lfLoading, setLfLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeComplaint, setActiveComplaint] = useState(null)
  const [error, setError] = useState('')
  const [idCardRequests, setIdCardRequests] = useState([])
  const [deletionRequests, setDeletionRequests] = useState({ staffRequests: [], userDeletions: [] })
  const [securityIssues, setSecurityIssues] = useState([])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const handleNavClick = useCallback((key) => {
    setSection(key)
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

const fetchAll = useCallback(async () => {
  setLoading(true); setError('')
  try {
    const [staffRes, statsRes, complaintsRes, usersRes] = await Promise.all([
      adminAPI.getAllStaff(), adminAPI.getStats(),
      adminAPI.getAllComplaints(), adminAPI.getAllUsers(),
    ])
    setStaff(staffRes.data.staff ?? [])
    setStats(statsRes.data.stats ?? {})
    setComplaints(complaintsRes.data.complaints ?? [])
    setUsers(usersRes.data.users ?? [])
  } catch (err) {
    if (err.response?.status === 401) { localStorage.removeItem('unifix_admin_token'); navigate('/login') }
    else setError('Failed to load dashboard data.')
  } finally { setLoading(false) }
}, [navigate]);

const fetchLostFound = useCallback(async () => {
  setLfLoading(true)
  try {
    const [lfRes, lrRes] = await Promise.all([
      adminAPI.getAllLostFound(),
      adminAPI.getAllLostReports(),
    ])
    setLostFoundItems(lfRes.data.items ?? [])
    setLostReports(lrRes.data.reports ?? [])
  } catch {
    //Catch block
  } finally { setLfLoading(false) }
}, []);
const fetchIdCardRequests = useCallback(async () => { try { const r = await adminAPI.getIdCardRequests(); setIdCardRequests(r.data.requests ?? []) } catch {
    //Catch block
 } }, []);
const fetchDeletionRequests = useCallback(async () => { try { const r = await adminAPI.getDeletionRequests(); setDeletionRequests(r.data ?? { staffRequests: [], userDeletions: [] }) } catch {
    //Catch block
 } }, []);
 const fetchSecurityIssues = useCallback(async () => { try { const r = await adminAPI.getSecurityIssues(); setSecurityIssues(r.data.issues ?? []) } catch {
    //Catch block
  } }, []);
const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchAll()
    if (section === 'lostfound') await fetchLostFound()
    if (section === 'idcards') await fetchIdCardRequests()
    if (section === 'deletions') await fetchDeletionRequests()
    if (section === 'security') await fetchSecurityIssues()
    setRefreshing(false)
  }, [section, fetchAll, fetchLostFound, fetchIdCardRequests, fetchDeletionRequests, fetchSecurityIssues])

useEffect(() => {
  const loadData = async () => {
    await fetchAll();
  };
  loadData();
}, [fetchAll]);

useEffect(() => {
  const loadSectionData = async () => {
    if (section === 'lostfound') await fetchLostFound();
    if (section === 'idcards') await fetchIdCardRequests();
    if (section === 'deletions') await fetchDeletionRequests();
    if (section === 'security') await fetchSecurityIssues();
  };
  loadSectionData();
}, [section, fetchLostFound, fetchIdCardRequests, fetchDeletionRequests, fetchSecurityIssues]);

  const logout = useCallback(() => { localStorage.removeItem('unifix_admin_token'); navigate('/login') }, [navigate])

const cs = stats.complaints ?? {}
  const visibleStaff = useMemo(() => staff.filter(m => m.verificationStatus === staffTab), [staff, staffTab])
  const visibleComplaints = useMemo(() => complaintTab === 'all' ? complaints : complaints.filter(c => c.status === complaintTab), [complaints, complaintTab])
  const visibleUsers = useMemo(() => users.filter(u => u.role === userTab), [users, userTab])
const visibleLf = useMemo(() => {
    if (lfTab === 'found_items') return lostFoundItems
    if (lfTab === 'available') return lostFoundItems.filter(i => i.status === 'available')
    if (lfTab === 'handed_over') return lostFoundItems.filter(i => i.status === 'handed_over')
    if (lfTab === 'lost_reports') return lostReports
    if (lfTab === 'lost_active') return lostReports.filter(i => i.status === 'active')
    if (lfTab === 'lost_found') return lostReports.filter(i => i.status === 'found')
    return lostFoundItems
  }, [lostFoundItems, lostReports, lfTab])

  const lfAvailable = useMemo(() => lostFoundItems.filter(i => i.status === 'available').length, [lostFoundItems])
  const lfHandedOver = useMemo(() => lostFoundItems.filter(i => i.status === 'handed_over').length, [lostFoundItems])
  const lrActive = useMemo(() => lostReports.filter(i => i.status === 'active').length, [lostReports])
  const lrFound = useMemo(() => lostReports.filter(i => i.status === 'found').length, [lostReports])

 const flaggedCount = complaints.filter(c => c.flagged && !c.flagResolved && ['pending','assigned','in_progress'].includes(c.status)).length

  const NAV_SECTIONS = [
    {
      label: 'Main',
      items: [
        { key: 'overview', Icon: LayoutDashboard, label: 'Dashboard' },
        { key: 'flagged', Icon: AlertCircle, label: 'Flagged', badge: flaggedCount },
        { key: 'complaints', Icon: ClipboardList, label: 'Complaints', badge: cs.pending },
        { key: 'history', Icon: Clock, label: 'History' },
        { key: 'staff', Icon: Wrench, label: 'Maintenance', badge: stats.pending },
        { key: 'users', Icon: Users, label: 'Staff & Users' },
        { key: 'lostfound', Icon: Search, label: 'Lost & Found' },
      ],
    },
    {
      label: 'Admin Actions',
      items: [
        { key: 'idcards', Icon: CreditCard, label: 'ID Cards', badge: stats.pendingIdCardRequests },
        { key: 'deletions', Icon: Trash2, label: 'Deletions', badge: stats.pendingDeletionRequests },
        { key: 'security', Icon: ShieldAlert, label: 'Security', badge: stats.openSecurityIssues },
      ],
    },
  ]

  const sectionLabel = NAV_SECTIONS.flatMap(s => s.items).find(i => i.key === section)?.label ?? 'Dashboard'

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] font-['DM_Sans']">
      <div
        className={`fixed inset-0 bg-[#0f172a]/55 z-[19] backdrop-blur-[2px] transition-opacity duration-250 md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
      />

      <aside className={`w-[228px] shrink-0 bg-[#0f172a] flex flex-col fixed top-0 left-0 bottom-0 z-[20] transition-transform duration-280 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.25)]' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-[22px_18px_18px] border-b border-white/5 flex items-center gap-[11px]">
          <img src={logo} alt="UniFiX" className="w-[42px] h-[42px] object-contain shrink-0" />
          <div className="flex-1">
            <div className="text-[15px] font-extrabold text-white tracking-[-0.3px]">UniFiX</div>
            <div className="text-[9px] font-bold text-[#4ade80] tracking-[1.5px] uppercase mt-[2px]">Admin Panel</div>
          </div>
        </div>
        <nav className="p-[14px_10px] flex-1 flex flex-col gap-[2px] overflow-y-auto">
          {NAV_SECTIONS.map(sec => (
            <div key={sec.label}>
              <div className="text-[9px] font-bold text-white/25 tracking-[1.2px] uppercase p-[10px_8px_6px]">{sec.label}</div>
              {sec.items.map(({ key, Icon, label, badge }) => (
                <button key={key} className={`flex items-center gap-[10px] p-[9px_10px] rounded-[9px] border-none text-[13px] font-medium cursor-pointer w-full text-left transition-all duration-150 relative ${section === key ? 'bg-[#16a34a]/15 text-[#4ade80] font-bold' : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white/85'}`} onClick={() => handleNavClick(key)}>
                  <Icon className="w-[16px] h-[16px] shrink-0" size={15} />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && <span className={`ml-auto text-[10px] font-extrabold px-[7px] py-[1px] rounded-[20px] shrink-0 ${section === key ? 'bg-[#16a34a] text-white' : 'bg-[#f59e0b] text-[#0f172a]'}`}>{badge}</span>}
                  {section === key && <div className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-[3px] bg-[#16a34a]" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-[12px_10px_16px] border-t border-white/5">
          <button className="flex items-center gap-[9px] p-[9px_10px] rounded-[9px] border-none bg-[#dc2626]/10 text-[#f87171] text-[13px] font-semibold cursor-pointer w-full transition-all duration-150 hover:bg-[#dc2626]/20 hover:text-[#fca5a5]" onClick={logout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-[228px] flex flex-col min-h-screen">
        <header className="h-[58px] bg-white flex items-center justify-between px-[28px] shrink-0 sticky top-0 z-[10] border-b border-[#e9ecef] md:px-[28px]">
          <div className="flex items-center gap-[12px]">
            <button className="flex md:hidden items-center justify-center w-[36px] h-[36px] rounded-[9px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] text-[#475569] cursor-pointer hover:bg-[#f0fdf4] hover:border-[#16a34a] hover:text-[#16a34a]" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <div className="text-[14px] font-bold text-[#0f172a] tracking-[-0.2px]">{sectionLabel}</div>
              <div className="text-[12px] text-[#94a3b8] mt-[1px]">UniFiX Admin</div>
            </div>
          </div>
          <button className="flex items-center gap-[7px] bg-[#f8fafc] text-[#475569] border-[1.5px] border-[#e2e8f0] rounded-[9px] p-[7px_14px] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#f0fdf4] hover:border-[#16a34a] hover:text-[#16a34a]" onClick={handleRefresh}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </header>

        <main className="flex-1 p-[28px] overflow-auto md:p-[28px] sm:p-[16px]">
          {error && <div className="flex items-center gap-[10px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-[10px] p-[12px_16px] text-[13px] font-semibold mb-[20px]"><AlertCircle size={16} /> {error}</div>}
          {section === 'overview' && <OverviewSection stats={stats} cs={cs} complaints={complaints} onNavigate={setSection} loading={loading} />}
          {section === 'complaints' && <ComplaintsSection allComplaints={complaints} visible={visibleComplaints} activeTab={complaintTab} onTabChange={setComplaintTab} cs={cs} loading={loading} focused={activeComplaint} setFocused={setActiveComplaint} />}
          {section === 'staff' && <MaintenanceSection items={visibleStaff} activeTab={staffTab} onTabChange={setStaffTab} stats={stats} loading={loading} navigate={navigate} />}
          {section === 'users' && <StaffUsersSection items={visibleUsers} activeTab={userTab} onTabChange={setUserTab} stats={stats} loading={loading} />}
{section === 'lostfound' && <LostFoundSection items={visibleLf} allItems={lostFoundItems} lostReports={lostReports} activeTab={lfTab} onTabChange={setLfTab} available={lfAvailable} handedOver={lfHandedOver} lrActive={lrActive} lrFound={lrFound} loading={lfLoading} />}          {section === 'idcards' && <IdCardsSection requests={idCardRequests} loading={loading} onRefresh={fetchIdCardRequests} />}
          {section === 'deletions' && <DeletionsSection data={deletionRequests} loading={loading} onRefresh={fetchDeletionRequests} />}
          {section === 'security' && <SecuritySection issues={securityIssues} loading={loading} onRefresh={fetchSecurityIssues} />}
          {section === 'flagged' && <FlaggedSection allComplaints={complaints} loading={loading} onRefresh={handleRefresh} />}
          {section === 'history' && <HistorySection allComplaints={complaints} loading={loading} />}
        </main>
      </div>
    </div>
  )
}
