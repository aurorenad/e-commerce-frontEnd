import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TECHNICIAN_PROFILE } from '../../../data/mockData'
import DashboardActions from '../../../components/DashboardActions'
import TechOverviewPage from './TechOverviewPage'
import AssignedDevicesPage from './AssignedDevicesPage'
import DeviceDetailsPage from './DeviceDetailsPage'
import TechProfilePage from './TechProfilePage'
import TechSellRequestsPage from './TechSellRequestsPage'
import { NavIcon } from './TechIcons'
import { cloneTickets, TW_NAV } from './techHelpers'
import type { RepairTicket } from './techHelpers'
import type { DashboardNotification } from '../shared/types/dashboard.types'
import './TechnicianWorkbench.css'

interface Props {
  onBack: () => void
  darkMode?: boolean
  onToggleDark?: () => void
  notifications?: DashboardNotification[]
  onMarkNotifRead?: (id: string) => void
}

export default function TechnicianWorkbench({ onBack: _onBack, darkMode = false, onToggleDark, notifications = [], onMarkNotifRead }: Props) {
  const navigate = useNavigate()
  const [page, setPage]               = useState('overview')
  const [tickets, setTickets]         = useState<RepairTicket[]>(cloneTickets)
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [faultDraft, setFaultDraft]   = useState('')
  const [savedStatus, setSavedStatus] = useState(false)
  const [profilePic, setProfilePic]   = useState<string | null>(null)

  const selected = useMemo(
    () => (selectedId ? tickets.find((t) => t.id === selectedId) : null),
    [tickets, selectedId],
  )

  const handleViewDevice = (id: string) => {
    setSelectedId(id); setFaultDraft(''); setSavedStatus(false); setPage('detail')
  }

  const handleUpdateStatus = (id: string, status: string) => {
    setTickets((prev) => prev.map((t) => {
      if (t.id !== id) return t
      if (status === 'Completed') return { ...t, status: 'Completed' as const, progress: 100 }
      const next = { ...t, status: status as RepairTicket['status'] }
      if (t.status === 'Completed') {
        const done = t.parts.filter((p) => p.done).length
        next.progress = t.parts.length ? Math.round((done / t.parts.length) * 100) : t.progress
      }
      return next
    }))
    setSavedStatus(true)
    setTimeout(() => setSavedStatus(false), 2500)
  }

  const handleTogglePart = (ticketId: string, partId: string) => {
    setTickets((prev) => prev.map((t) => {
      if (t.id !== ticketId) return t
      const parts = t.parts.map((p) => (p.id === partId ? { ...p, done: !p.done } : p))
      const done = parts.filter((p) => p.done).length
      return { ...t, parts, progress: parts.length ? Math.round((done / parts.length) * 100) : t.progress }
    }))
  }

  const handleSubmitNote = () => {
    const text = faultDraft.trim()
    if (!text || !selectedId) return
    setTickets((prev) => prev.map((t) =>
      t.id === selectedId
        ? { ...t, faultNotes: [...(t.faultNotes || []), { at: new Date().toISOString().slice(0, 16).replace('T', ' '), text }] }
        : t
    ))
    setFaultDraft('')
  }

  const handleUpdateFault = (ticketId: string, newText: string) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, faultDetail: newText } : t)))
  }

  return (
    <div className="tw-layout">
      <aside className="tw-sidebar" aria-label="Technician navigation">
        <p className="tw-sidebar-caption">Navigation</p>
        <nav className="tw-sidebar-nav">
          {TW_NAV.map((item) => (
            <button key={item.id} type="button"
              className={`tw-nav-btn ${(page === item.id || (item.id === 'devices' && page === 'detail')) ? 'active' : ''}`}
              onClick={() => setPage(item.id)}>
              <NavIcon id={item.id} />{item.label}
            </button>
          ))}
        </nav>
        {/* <div className="tw-sidebar-bottom">
          <button type="button" className="tw-nav-back" onClick={onBack}>
            <IconBack /> Admin Portal
          </button>
        </div> */}
      </aside>

      <main className="tw-content">
        <header className="tw-portal-header">
          <button type="button" className="tw-portal-brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            <span className="tw-portal-logo" aria-hidden>VT</span>
            <div><strong>reviveTech</strong><p>Technician</p></div>
          </button>
          <span className="tw-portal-tagline">TECHNICIAN DASHBOARD</span>
          <DashboardActions darkMode={darkMode} onToggleDark={onToggleDark}
            userName={TECHNICIAN_PROFILE.name} role={TECHNICIAN_PROFILE.role}
            notifications={notifications} onMarkRead={onMarkNotifRead}
            onProfile={() => setPage('profile')} />
        </header>

        {page === 'overview' && (
          <TechOverviewPage tickets={tickets} onGoToDevices={() => setPage('devices')} onViewDevice={handleViewDevice} />
        )}
        {page === 'devices' && (
          <AssignedDevicesPage tickets={tickets} onViewDevice={handleViewDevice} onUpdateStatus={handleUpdateStatus} />
        )}
        {page === 'detail' && (
          <DeviceDetailsPage ticket={selected} onBack={() => setPage('devices')}
            onTogglePart={handleTogglePart} onUpdateStatus={handleUpdateStatus}
            onSubmitNote={handleSubmitNote} onUpdateFault={handleUpdateFault}
            faultDraft={faultDraft} setFaultDraft={setFaultDraft} savedStatus={savedStatus} />
        )}
        {page === 'profile' && (
          <TechProfilePage profilePic={profilePic} onProfilePicChange={setProfilePic} />
        )}
        {page === 'sell-requests' && (
          <TechSellRequestsPage onOpenProfile={() => setPage('profile')} />
        )}
      </main>
    </div>
  )
}
