import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchProfile, updateProfile, updateProfileAvatar } from '../../../services/users.service'
import { fetchFinancingApplications } from '../../../services/payments.service'
import { useAuth } from '../../../context/AuthContext'
import { getErrorMessage } from '../../../lib/api'
import '../admin/sections/profile/ProfileSection.css'

interface Props {
  profilePic: string | null
  onProfilePicChange: (url: string) => void
}

const COLOR_MAP: Record<string, string> = {
  approve: '#22c55e', reject: '#ef4444', reminder: '#f0ab3c',
  escalate: '#ef4444', settings: '#3b82f6', complete: '#22c55e',
}

export default function FoProfilePage({ profilePic, onProfilePicChange }: Props) {
  const { refreshUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editName,  setEditName]  = useState(false)
  const [name,      setName]      = useState('Finance Officer')
  const [editEmail, setEditEmail] = useState(false)
  const [email,     setEmail]     = useState('finance@example.com')
  const [phone, setPhone] = useState('—')
  const [profileId, setProfileId] = useState('FO-—')
  const [role, setRole] = useState('Finance Officer')
  const [appsProcessed, setAppsProcessed] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [saved,     setSaved]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
      .then((u) => {
        const fullName = `${u.firstName} ${u.lastName}`.trim()
        setName(fullName || 'Finance Officer')
        setEmail(u.email)
        setPhone(u.phone || '—')
        setProfileId(`FO-${u.id.slice(0, 6).toUpperCase()}`)
        setRole('Finance Officer')
        if (u.avatarUrl) onProfilePicChange(u.avatarUrl)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load profile'))

    fetchFinancingApplications()
      .then((apps) => {
        setAppsProcessed(apps.length)
        setApprovedCount(apps.filter((a) => a.status === 'APPROVED').length)
      })
      .catch(() => {})
  }, [onProfilePicChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    void updateProfileAvatar(fd)
      .then(async (u) => {
        if (u.avatarUrl) onProfilePicChange(u.avatarUrl)
        await refreshUser()
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
    e.target.value = ''
  }

  const initials = useMemo(
    () => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  )
  const approvalRate = appsProcessed > 0 ? Math.round((approvedCount / appsProcessed) * 100) : 0

  return (
    <div className="fo-page-wrap">
      {loadError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{loadError}</p>}
      <div className="prf-page">
        <div className="prf-left">
          <div className="prf-card fo-panel-card">
            <div className="prf-cover"><div className="prf-cover-accent" /><div className="prf-cover-accent2" /></div>
            <div className="prf-card-body">
              <div className="prf-avatar-ring" onClick={() => fileRef.current?.click()}>
                {profilePic
                  ? <img src={profilePic} alt="Profile" className="prf-avatar-img" />
                  : <div className="prf-avatar-initials">{initials}</div>}
                <div className="prf-avatar-overlay">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Upload</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
              <button type="button" className="prf-upload-label" onClick={() => fileRef.current?.click()}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload photo
              </button>
              <div className="prf-name-row">
                {editName
                  ? <input className="prf-name-input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setEditName(false)} autoFocus />
                  : <><h2 className="prf-name">{name}</h2><button type="button" className="prf-edit-btn" onClick={() => setEditName(true)}>Edit</button></>}
              </div>
              <span className="prf-role-tag">{role}</span>
              <p className="prf-id">{profileId}</p>
              <div className="prf-info-list">
                <div className="prf-info-item">
                  <span className="prf-info-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                  <div className="prf-info-text"><p className="prf-info-label">Email</p>
                    {editEmail
                      ? <input className="prf-inline-input" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEditEmail(false)} autoFocus />
                      : <span className="prf-info-val">{email} <button type="button" className="prf-edit-btn" onClick={() => setEditEmail(true)}>Edit</button></span>}
                  </div>
                </div>
                <div className="prf-info-item">
                  <span className="prf-info-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
                  <div className="prf-info-text"><p className="prf-info-label">Phone</p><span className="prf-info-val">{phone}</span></div>
                </div>
              </div>
              <button type="button" className={`prf-save-btn${saved ? ' prf-save-btn--saved' : ''}`}
                disabled={saving}
                onClick={() => {
                  const [firstName, ...rest] = name.trim().split(/\s+/)
                  const lastName = rest.join(' ')
                  const phoneValue = phone.trim() && phone !== '—' ? phone.trim() : undefined
                  setSaving(true)
                  void updateProfile({
                    firstName: firstName || undefined,
                    lastName,
                    ...(phoneValue ? { phone: phoneValue } : {}),
                  })
                    .then(async (updated) => {
                      const fullName = `${updated.firstName} ${updated.lastName}`.trim()
                      setName(fullName)
                      setPhone(updated.phone || '—')
                      await refreshUser()
                      setLoadError(null)
                      setSaved(true)
                      setTimeout(() => setSaved(false), 2000)
                    })
                    .catch((err) => setLoadError(getErrorMessage(err)))
                    .finally(() => setSaving(false))
                }}>
                {saved ? '✓ Changes Saved' : saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="prf-right">
          <div className="prf-stats-row">
            {[
              { label: 'Loans Processed', val: appsProcessed.toLocaleString(), hint: 'All time' },
              { label: 'Approval Rate', val: `${approvalRate}%`, hint: 'All records' },
              { label: 'Approved Cases', val: approvedCount.toLocaleString(), hint: 'Applications' },
              { label: 'Pending Reviews', val: Math.max(0, appsProcessed - approvedCount).toLocaleString(), hint: 'Current queue' },
            ].map((s) => (
              <div key={s.label} className="prf-stat-card">
                <p className="prf-stat-num">{s.val}</p>
                <p className="prf-stat-label">{s.label}</p>
                <p className="prf-stat-hint">{s.hint}</p>
              </div>
            ))}
          </div>
          <article className="prf-section-card">
            <h3 className="prf-section-title">Recent Activity</h3>
            <ul className="prf-timeline">
              {[
                { id: '1', action: `${appsProcessed} financing applications loaded`, at: 'just now', type: 'settings' },
                { id: '2', action: `${approvedCount} applications approved`, at: 'latest snapshot', type: 'approve' },
              ].map((a) => (
                <li key={a.id} className="prf-timeline-item">
                  <span className="prf-timeline-dot" style={{ background: COLOR_MAP[a.type] ?? '#64748b' }} />
                  <div><p className="prf-timeline-action">{a.action}</p><p className="prf-timeline-time">{a.at}</p></div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </div>
  )
}
