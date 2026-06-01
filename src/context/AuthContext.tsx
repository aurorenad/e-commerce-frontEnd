import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import * as authService from '../services/auth.service'
import { fetchProfile } from '../services/users.service'
import { getErrorMessage } from '../lib/api'
import { getRedirectForRole, toFrontendRole } from '../lib/roles'

export type UserRole = 'customer' | 'admin' | 'finance' | 'technician' | 'agent'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  redirectTo: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser)
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('auth_token'))

  async function login(email: string, password: string): Promise<AuthUser> {
    let data: Awaited<ReturnType<typeof authService.login>>
    try {
      data = await authService.login(email.trim(), password)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
    const role = toFrontendRole(data.user.role)
    const authUser: AuthUser = {
      id: data.user.id,
      name: `${data.user.firstName} ${data.user.lastName}`.trim(),
      email: data.user.email,
      role,
      redirectTo: getRedirectForRole(role),
    }

    sessionStorage.setItem('auth_token', data.token)
    sessionStorage.setItem('auth_user', JSON.stringify(authUser))
    setToken(data.token)
    setUser(authUser)
    return authUser
  }

  function logout() {
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (!token) return

    fetchProfile()
      .then((profile) => {
        const role = toFrontendRole(profile.role)
        const authUser: AuthUser = {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          email: profile.email,
          role,
          redirectTo: getRedirectForRole(role),
        }
        setUser(authUser)
        sessionStorage.setItem('auth_user', JSON.stringify(authUser))
      })
      .catch(() => {
        // Token invalid
        logout()
      })
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}