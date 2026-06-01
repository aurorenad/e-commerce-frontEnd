import { useMemo, useState, useEffect } from 'react'
import { fetchAdminUsers, updateAdminUser } from '../../../../../services/users.service'
import { mapApiUserToDashboardUser, dashboardRoleToBackend, dashboardStatusToBackend } from '../../../../../lib/mappers'
import { getErrorMessage } from '../../../../../lib/api'
import type { User } from '../../../shared/types/dashboard.types'
import Pagination from '../../../shared/components/Pagination'
import UserViewModal from './UserViewModal'
import UserEditModal from './UserEditModal'
import UserCreateModal from './UserCreateModal'
import '../../../shared/styles/dashboard-shared.css'
import './UsersSection.css'

const UM_ROLES = ['Customer', 'Admin', 'Technician', 'Finance Officer', 'Support Agent']
const PAGE_SIZE = 5
const TODAY = new Date('2026-05-22')

export default function UsersSection() {
  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage]                 = useState(1)
  const [users, setUsers]               = useState<User[]>([])
  const [loadError, setLoadError]       = useState<string | null>(null)
  const [viewUser, setViewUser]         = useState<User | null>(null)
  const [editUser, setEditUser]         = useState<User | null>(null)
  const [showCreate, setShowCreate]     = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)
  const [savingId, setSavingId]         = useState<string | null>(null)

  useEffect(() => {
    fetchAdminUsers()
      .then((rows) => { setUsers(rows.map(mapApiUserToDashboardUser)); setLoadError(null) })
      .catch((err) => { setUsers([]); setLoadError(err instanceof Error ? err.message : 'Failed to load users') })
  }, [])

  const handleSave = async (updated: User): Promise<boolean> => {
    const parts = updated.name.trim().split(/\s+/)
    const firstName = parts[0] || 'User'
    const lastName = parts.slice(1).join(' ') || ''

    setSavingId(updated.id)
    setSaveError(null)
    try {
      const saved = await updateAdminUser(updated.id, {
        firstName,
        lastName,
        phone: updated.phone === '—' ? '' : updated.phone,
        role: dashboardRoleToBackend(updated.role),
        status: dashboardStatusToBackend(updated.status),
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? mapApiUserToDashboardUser(saved) : u)))
      return true
    } catch (err) {
      setSaveError(getErrorMessage(err))
      return false
    } finally {
      setSavingId(null)
    }
  }

  const counts = useMemo(() => {
    const sevenDaysAgo = new Date(TODAY)
    sevenDaysAgo.setDate(TODAY.getDate() - 7)
    return {
      total:       users.length,
      active:      users.filter((u) => u.status === 'Active').length,
      deactivated: users.filter((u) => u.status === 'Deactivated').length,
      newUsers:    users.filter((u) => new Date(u.joinDate) >= sevenDaysAgo).length,
    }
  }, [users])

  const filtered = useMemo(() => {
    let list = users
    if (roleFilter !== 'All')   list = list.filter((u) => u.role === roleFilter)
    if (statusFilter !== 'All') list = list.filter((u) => u.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
    )
    return list
  }, [search, roleFilter, statusFilter, users])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

  const toggleStatus = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Deactivated' : 'Active'
    setSavingId(user.id)
    setSaveError(null)
    try {
      const parts = user.name.trim().split(/\s+/)
      const saved = await updateAdminUser(user.id, {
        firstName: parts[0] || 'User',
        lastName: parts.slice(1).join(' ') || '',
        status: dashboardStatusToBackend(nextStatus),
      })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? mapApiUserToDashboardUser(saved) : u)))
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const kpis = [
    {
      label: 'Total Users', value: counts.total, change: '+42 this month',
      icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
      bg: 'rgba(2,92,80,0.09)', fg: '#025c50',
    },
    {
      label: 'Active Users', value: counts.active, change: `${((counts.active / counts.total) * 100).toFixed(0)}% rate`,
      icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
      bg: 'rgba(34,197,94,0.1)', fg: '#15803d',
    },
    {
      label: 'Deactivated', value: counts.deactivated, change: 'Requires review',
      icon: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
      bg: 'rgba(239,68,68,0.1)', fg: '#b91c1c',
    },
    {
      label: 'New Users (7d)', value: counts.newUsers, change: 'Last 7 days',
      icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>,
      bg: 'rgba(59,130,246,0.1)', fg: '#1d4ed8',
    },
  ]

  return (
    <div className="section-stack">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loadError}</p>}
      {saveError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{saveError}</p>}
      <section className="um-kpi-grid" aria-label="User metrics">
        {kpis.map((k) => (
          <article className="um-kpi-card" key={k.label}>
            <div className="um-kpi-top">
              <span className="um-kpi-icon" style={{ background: k.bg, color: k.fg }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>{k.icon}</svg>
              </span>
            </div>
            <p className="um-kpi-value">{k.value}</p>
            <p className="um-kpi-label">{k.label}</p>
            <p className="um-kpi-hint">{k.change}</p>
          </article>
        ))}
      </section>

      <article className="panel-card">
        <div className="um-toolbar">
          <button type="button" className="um-btn-primary" onClick={() => setShowCreate(true)}>
            + Register user
          </button>
          <div className="search-field search-field--compact">
            <svg className="icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
            </svg>
            <input type="search" placeholder="Search by name, email, or ID…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div className="um-filters">
            <label className="um-filter-group">
              <span className="um-filter-label">Role</span>
              <select className="um-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
                <option value="All">All roles</option>
                {UM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="um-filter-group">
              <span className="um-filter-label">Status</span>
              <select className="um-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </label>
          </div>
        </div>

        <div className="table-scroll">
          <table className="admin-table um-table">
            <thead>
              <tr>
                <th>User ID</th><th>Name</th><th>Email</th>
                <th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr key={user.id}>
                  <td className="cell-mono">{user.id}</td>
                  <td className="um-cell-name">{user.name}</td>
                  <td><a href={`mailto:${user.email}`} className="um-email-link">{user.email}</a></td>
                  <td><span className="role-pill">{user.role}</span></td>
                  <td><span className={`um-status um-status--${user.status.toLowerCase()}`}>{user.status}</span></td>
                  <td>
                    <span className="um-last-active-rel">{user.lastActive}</span>
                    <span className="um-last-active-date">{user.lastActiveDate}</span>
                  </td>
                  <td>
                    <div className="um-actions">
                      <button type="button" className="um-action-btn um-action-view" onClick={() => setViewUser(user)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span>View</span>
                      </button>
                      <button type="button" className="um-action-btn um-action-edit" onClick={() => setEditUser(user)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className={`um-action-btn ${user.status === 'Active' ? 'um-action-deactivate' : 'um-action-activate'}`}
                        onClick={() => void toggleStatus(user)}
                        disabled={savingId === user.id}
                      >
                        {user.status === 'Active'
                          ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>Deactivate</span></>
                          : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Activate</span></>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="um-empty">No users match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          itemLabel="users"
          onPageChange={goTo}
        />
      </article>

      {viewUser && <UserViewModal user={viewUser} onClose={() => setViewUser(null)} />}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (updated) => {
            if (await handleSave(updated)) setEditUser(null)
          }}
          isSaving={savingId === editUser.id}
        />
      )}
      {showCreate && (
        <UserCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(u) => setUsers((prev) => [u, ...prev])}
        />
      )}
    </div>
  )
}
