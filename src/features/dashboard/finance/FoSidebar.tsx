import { useState } from 'react'
import type { ReactNode } from 'react'
import { FINANCING_SUB } from './foHelpers'

interface Props { page: string; setPage: (p: string) => void }

const ICON_OVERVIEW  = <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
const ICON_FINANCING = <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
const ICON_SELL = <><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>
const ICON_CHEVRON   = <path d="M6 9l6 6 6-6" />
const ICON_CUSTOMERS = <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>
const ICON_SETTINGS  = <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>
const ICON_PROFILE   = <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>

function NavBtn({ id, label, icon, active, onClick }: { id: string; label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button key={id} type="button" className={`fo-nav-btn ${active ? 'fo-nav-active' : ''}`} onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>{icon}</svg>
      {label}
    </button>
  )
}

export default function FoSidebar({ page, setPage }: Props) {
  const isFinancingSub = ['requests', 'loans', 'risk'].includes(page)
  const [open, setOpen] = useState(isFinancingSub)

  return (
    <>
      <NavBtn id="overview" label="Overview" active={page === 'overview'} onClick={() => setPage('overview')} icon={ICON_OVERVIEW} />
      <NavBtn id="sell-requests" label="Sell Requests" active={page === 'sell-requests'} onClick={() => setPage('sell-requests')} icon={ICON_SELL} />

      <div className="fo-nav-group">
        <button type="button" className={`fo-nav-btn fo-nav-parent ${isFinancingSub ? 'fo-nav-parent-active' : ''}`}
          onClick={() => setOpen((v) => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>{ICON_FINANCING}</svg>
          Financing
          <svg className={`fo-chevron ${open ? 'fo-chevron-open' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {ICON_CHEVRON}
          </svg>
        </button>
        {open && (
          <div className="fo-nav-sub">
            {FINANCING_SUB.map((sub) => (
              <button key={sub.id} type="button"
                className={`fo-nav-sub-btn ${page === sub.id ? 'fo-nav-sub-active' : ''}`}
                onClick={() => setPage(sub.id)}>
                <span className="fo-sub-dot" />{sub.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <NavBtn id="customers" label="Customers" active={page === 'customers'} onClick={() => setPage('customers')} icon={ICON_CUSTOMERS} />
      <NavBtn id="settings"  label="Settings"  active={page === 'settings'}  onClick={() => setPage('settings')}  icon={ICON_SETTINGS} />
      <NavBtn id="profile"   label="Profile"   active={page === 'profile'}   onClick={() => setPage('profile')}   icon={ICON_PROFILE} />
    </>
  )
}
