import { useState } from 'react'
import type { User } from '../../../shared/types/dashboard.types'
import ModalBase from '../../../shared/components/ModalBase'

const UM_ROLES = ['Customer', 'Admin', 'Technician', 'Finance Officer', 'Support Agent']

interface UserEditModalProps {
  user: User
  onClose: () => void
  onSave: (updated: User) => void | Promise<void>
  isSaving?: boolean
}

export default function UserEditModal({ user, onClose, onSave, isSaving = false }: UserEditModalProps) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    await onSave({ ...user, ...form })
  }

  return (
    <ModalBase
      title="Edit User"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="um-btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="button" className="um-btn-primary" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      <p className="um-form-note">Editing: <strong>{user.id}</strong></p>
      <div className="um-form-grid">
        <label className="um-form-field">
          <span className="um-form-label">Full Name</span>
          <input className="um-form-input" type="text" value={form.name} onChange={set('name')} placeholder="Full name" />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Email Address</span>
          <input className="um-form-input" type="email" value={form.email} onChange={set('email')} placeholder="Email" />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Phone Number</span>
          <input className="um-form-input" type="text" value={form.phone} onChange={set('phone')} placeholder="Phone" />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Role</span>
          <select className="um-form-input" value={form.role} onChange={set('role')}>
            {UM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Status</span>
          <select className="um-form-input" value={form.status} onChange={set('status')}>
            <option value="Active">Active</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </label>
      </div>
    </ModalBase>
  )
}
