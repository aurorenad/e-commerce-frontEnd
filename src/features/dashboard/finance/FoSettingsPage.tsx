import { useState } from 'react'
import type { FoSettings } from './foHelpers'

const DEFAULT_SETTINGS: FoSettings = {
  interestRates: { standard: 12.5, premium: 9.5, business: 14.0 },
  loanTerms: [6, 12, 18],
  lateFeePercent: 3.0,
  gracePeriodDays: 5,
  autoReminder: true,
  reminderDaysBefore: 3,
  escalationThresholdDays: 14,
  language: 'en',
  currency: 'USD',
}

export default function FoSettingsPage() {
  const [settings, setSettings] = useState<FoSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved]       = useState(false)

  const update = (path: string, value: unknown) => {
    setSettings((prev) => {
      const next = { ...prev } as unknown as Record<string, unknown>
      if (path.includes('.')) {
        const [k, sub] = path.split('.')
        next[k] = { ...(prev as unknown as Record<string, unknown>)[k] as object, [sub]: value }
      } else {
        next[path] = value
      }
      return next as unknown as FoSettings
    })
  }

  return (
    <div className="fo-page-wrap">
      <div className="fo-settings-grid">
        <div className="fo-settings-card">
          <h3 className="fo-settings-section-title">Interest Rates (%)</h3>
          {[['Standard Tier', 'interestRates.standard'], ['Premium Tier', 'interestRates.premium'], ['Business Tier', 'interestRates.business']].map(([label, path]) => (
            <label key={path} className="fo-settings-field">
              <span>{label}</span>
              <input type="number" step="0.1" className="fo-form-input"
                value={settings.interestRates[path.split('.')[1] as keyof typeof settings.interestRates]}
                onChange={(e) => update(path, parseFloat(e.target.value))} />
            </label>
          ))}
        </div>

        <div className="fo-settings-card">
          <h3 className="fo-settings-section-title">Loan Duration &amp; Fees</h3>
          <label className="fo-settings-field">
            <span>Late Payment Penalty (%)</span>
            <input type="number" step="0.1" className="fo-form-input" value={settings.lateFeePercent}
              onChange={(e) => update('lateFeePercent', parseFloat(e.target.value))} />
          </label>
          <label className="fo-settings-field">
            <span>Grace Period (days)</span>
            <input type="number" className="fo-form-input" value={settings.gracePeriodDays}
              onChange={(e) => update('gracePeriodDays', parseInt(e.target.value))} />
          </label>
          <label className="fo-settings-field">
            <span>Escalation Threshold (days)</span>
            <input type="number" className="fo-form-input" value={settings.escalationThresholdDays}
              onChange={(e) => update('escalationThresholdDays', parseInt(e.target.value))} />
          </label>
        </div>

        <div className="fo-settings-card">
          <h3 className="fo-settings-section-title">Notifications</h3>
          <label className="fo-settings-toggle-field">
            <span>Auto Payment Reminders</span>
            <button className={`fo-toggle ${settings.autoReminder ? 'fo-toggle-on' : ''}`}
              onClick={() => update('autoReminder', !settings.autoReminder)}>
              <span className="fo-toggle-knob" />
            </button>
          </label>
          <label className="fo-settings-field">
            <span>Reminder Days Before Due</span>
            <input type="number" className="fo-form-input" value={settings.reminderDaysBefore}
              onChange={(e) => update('reminderDaysBefore', parseInt(e.target.value))} />
          </label>
        </div>

        <div className="fo-settings-card">
          <h3 className="fo-settings-section-title">Localization</h3>
          <label className="fo-settings-field">
            <span>Language</span>
            <select className="fo-form-input fo-form-select" value={'en'} disabled>
              <option value="en">English</option>
            </select>
          </label>
          <label className="fo-settings-field" style={{ marginTop: '12px' }}>
            <span>Currency</span>
            <select className="fo-form-input fo-form-select" value={settings.currency} onChange={(e) => update('currency', e.target.value)}>
              <option value="USD">USD — US Dollar</option>
              <option value="RWF">RWF — Rwandan Franc</option>
            </select>
          </label>
        </div>
      </div>

      <button className={`fo-btn-save-settings ${saved ? 'fo-btn-saved' : ''}`}
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}>
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  )
}
