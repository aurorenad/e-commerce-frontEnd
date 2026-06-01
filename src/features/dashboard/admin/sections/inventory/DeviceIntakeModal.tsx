import { useState } from 'react'
import ModalBase from '../../../shared/components/ModalBase'
import { intakeDevice } from '../../../../../services/devices.service'
import { mapApiDeviceToInventory } from '../../../../../lib/mappers'
import type { Device } from '../../../shared/types/dashboard.types'
import { getErrorMessage } from '../../../../../lib/api'

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'] as const

interface Props {
  onClose: () => void
  onCreated: (device: Device) => void
}

export default function DeviceIntakeModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    brand: '',
    model: '',
    serial: '',
    condition: 'Good' as (typeof CONDITIONS)[number],
    batteryHealth: '100',
    basePrice: '',
    price: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const conditionToApi = (c: string) => c.toUpperCase().replace(' ', '_')

  const handleSubmit = async () => {
    if (!form.brand.trim() || !form.model.trim() || !form.basePrice || !form.price) {
      setError('Brand, model, base price, and list price are required.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const device = await intakeDevice({
        brand: form.brand.trim(),
        model: form.model.trim(),
        originalSerialNumber: form.serial.trim() || undefined,
        condition: conditionToApi(form.condition),
        batteryHealth: Number(form.batteryHealth) || 100,
        basePrice: Number(form.basePrice),
        price: Number(form.price),
      })
      onCreated(mapApiDeviceToInventory(device))
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ModalBase
      title="Register device"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="um-btn-secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" className="um-btn-primary" onClick={() => void handleSubmit()} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Register device'}
          </button>
        </>
      }
    >
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="um-form-grid">
        <label className="um-form-field">
          <span className="um-form-label">Brand</span>
          <input className="um-form-input" value={form.brand} onChange={set('brand')} placeholder="Apple" />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Model</span>
          <input className="um-form-input" value={form.model} onChange={set('model')} placeholder="iPhone 13" />
        </label>
        <label className="um-form-field" style={{ gridColumn: '1 / -1' }}>
          <span className="um-form-label">Serial number (optional)</span>
          <input className="um-form-input" value={form.serial} onChange={set('serial')} />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Condition</span>
          <select className="um-form-input" value={form.condition} onChange={set('condition')}>
            {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Battery health %</span>
          <input className="um-form-input" type="number" min={0} max={100} value={form.batteryHealth} onChange={set('batteryHealth')} />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">Base price ($)</span>
          <input className="um-form-input" type="number" min={0} value={form.basePrice} onChange={set('basePrice')} />
        </label>
        <label className="um-form-field">
          <span className="um-form-label">List price ($)</span>
          <input className="um-form-input" type="number" min={0} value={form.price} onChange={set('price')} />
        </label>
      </div>
    </ModalBase>
  )
}
