import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DashboardNotification } from '../shared/types/dashboard.types'
import DashboardActions from '../../../components/DashboardActions'
import { useAuth } from '../../../context/AuthContext'
import FoSidebar from './FoSidebar'
import FoOverviewPage from './FoOverviewPage'
import FoRequestsPage from './FoRequestsPage'
import FoSellRequestsPage from './FoSellRequestsPage'
import FoLoansPage from './FoLoansPage'
import FoRiskPage from './FoRiskPage'
import FoCustomersPage from './FoCustomersPage'
import FoSettingsPage from './FoSettingsPage'
import FoProfilePage from './FoProfilePage'
import { PAGE_META } from './foHelpers'
import './FinanceOfficerDashboard.css'

interface Props {
  onBack: () => void
  darkMode?: boolean
  onToggleDark?: () => void
  notifications?: DashboardNotification[]
  onMarkNotifRead?: (id: string) => void
}

export default function FinanceOfficerDashboard({ onBack: _onBack, darkMode = false, onToggleDark, notifications = [], onMarkNotifRead }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage]           = useState('overview')
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const foNotifications: DashboardNotification[] = notifications

  const copy = PAGE_META[page] ?? PAGE_META.overview

  const renderPage = () => {
    switch (page) {
      case 'overview':  return <FoOverviewPage />
      case 'sell-requests': return <FoSellRequestsPage />
      case 'requests':  return <FoRequestsPage />
      case 'loans':     return <FoLoansPage />
      case 'risk':      return <FoRiskPage />
      case 'customers': return <FoCustomersPage />
      case 'settings':  return <FoSettingsPage />
      case 'profile':   return <FoProfilePage profilePic={profilePic} onProfilePicChange={setProfilePic} />
      default:          return <FoOverviewPage />
    }
  }

  return (
    <div className="fo-layout">
      <aside className="fo-sidebar">
        <button type="button" className="fo-brand" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <span className="fo-brand-mark">FO</span>
          <div><strong>reviveTech</strong><p>Finance Portal</p></div>
        </button>
        <p className="fo-sidebar-caption">Loan management &amp; risk monitoring</p>
        <nav className="fo-nav">
          <FoSidebar page={page} setPage={setPage} />
        </nav>
        {/* <div className="fo-sidebar-bottom">
          <button type="button" className="fo-back-sidebar-btn" onClick={onBack}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Admin
          </button>
        </div> */}
      </aside>

      <main className="fo-main">
        <header className="fo-portal-header">
          <span className="fo-portal-tagline">FINANCE PORTAL</span>
          <DashboardActions darkMode={darkMode} onToggleDark={onToggleDark}
            userName={user?.name || 'Finance Officer'} role="Finance Officer"
            notifications={foNotifications} onMarkRead={onMarkNotifRead}
            onProfile={() => setPage('profile')} />
        </header>
        <header className="fo-topbar">
          <div><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
        </header>
        <div className="fo-section-content">{renderPage()}</div>
      </main>
    </div>
  )
}
