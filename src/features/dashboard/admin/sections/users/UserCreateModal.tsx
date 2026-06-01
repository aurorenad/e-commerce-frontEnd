import { useState } from 'react'
import ModalBase from '../../../shared/components/ModalBase'
import { createAdminUser } from '../../../../../services/users.service'
import { mapApiUserToDashboardUser } from '../../../../../lib/mappers'
import type { User } from '../../../shared/types/dashboard.types'
import { getErrorMessage } from '../../../../../lib/api'

const UM_ROLES = ['Customer', 'Admin', 'Technician', 'Finance Officer', 'Support Agent']

interface Props {
  onClose: () => void
  onCreated: (user: User) => void
}

export default function UserCreateModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Customer',
    sendVerificationEmail: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = k === 'sendVerificationEmail' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm((f) => ({ ...f, [k]: value }))
  }

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      setError('First name, last name, email, and password are required.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const created = await createAdminUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: form.role,
        sendVerificationEmail: form.sendVerificationEmail,
      })
      onCreated(mapApiUserToDashboardUser(created))
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ModalBase
      title="Register user"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="um-btn-secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" className="um-btn-primary" onClick={() => void handleSubmit()} disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create user'}
          </button>
        </>
      }
    >
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="um-form-grid">
        <label className="um-form-field">
          <span className="um-form-label">First name</span>
          <input className="um-form-input" value={form.firstName} onChange={set('firstName')} />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Last name</span>
          <input className="um-form-input" value={form.lastName} onChange={set('lastName')} />
        </label>
        <label className="um-form-field" style={{ gridColumn: '1 / -1' }}>
          <span className="um-form-label">Email</span>
          <input className="um-form-input" type="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Phone</span>
          <input className="um-form-input" value={form.phone} onChange={set('phone')} />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Role</span>
          <select className="um-form-input" value={form.role} onChange={set('role')}>
            {UM_ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="um-form-field" style={{ gridColumn: '1 / -1' }}>
          <span className="um-form-label">Password</span>
          <input className="um-form-input" type="password" value={form.password} onChange={set('password')} />
        </label>
        <label className="um-form-field" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={form.sendVerificationEmail} onChange={set('sendVerificationEmail')} />
          <span className="um-form-label" style={{ margin: 0 }}>Send email verification OTP (otherwise user can sign in immediately)</span>
        </label>
      </div>
    </ModalBase>
  )
}
