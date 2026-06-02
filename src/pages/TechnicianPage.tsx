import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TechnicianWorkbench from '../features/dashboard/technician/TechnicianWorkbench'
import type { DashboardNotification } from '../features/dashboard/shared/types/dashboard.types'

export default function TechnicianPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [darkMode, setDarkMode]           = useState(false)
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])

  function handleBack() {
    logout()
    navigate('/login', { replace: true })
  }

  function markNotifRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <TechnicianWorkbench
      onBack={handleBack}
      darkMode={darkMode}
      onToggleDark={() => setDarkMode((v) => !v)}
      notifications={notifications}
      onMarkNotifRead={markNotifRead}
    />
  )
}
