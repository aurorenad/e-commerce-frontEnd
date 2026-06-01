import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  role: UserRole
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.redirectTo} replace />

  return <>{children}</>
}
