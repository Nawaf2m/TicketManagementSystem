import { createContext, useContext, useEffect, useState } from 'react'
import { api, login, logout, onSessionEnded, refreshAccessToken } from '../services/api'
import { getRole, objectOf } from '../utils/data'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    let active = true
    const unsubscribe = onSessionEnded(() => { if (active) setUser(null) })
    async function restore() {
      try {
        await refreshAccessToken()
        const response = await api.get('/api/v1/user/me')
        const currentUser = objectOf(response.data)
        if (!getRole(currentUser)) throw new Error('Unable to identify the user role.')
        if (active) setUser(currentUser)
      } catch (error) {
        if (active && error.response?.status !== 401) {
          setSessionError('Unable to restore your session. Check your connection and try again.')
        }
      } finally {
        if (active) setInitializing(false)
      }
    }
    restore()
    return () => { active = false; unsubscribe() }
  }, [])

  async function refreshUser() {
    const response = await api.get('/api/v1/user/me')
    setUser(objectOf(response.data))
  }

  async function signIn(email, password) {
    setBusy(true)
    setSessionError('')
    try {
      await login(email, password)
      const response = await api.get('/api/v1/user/me')
      const currentUser = objectOf(response.data)
      if (!getRole(currentUser)) throw new Error('Unable to identify the user role.')
      setUser(currentUser)
      return currentUser
    } catch (error) {
      await logout().catch(() => {})
      throw error
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setSessionError('')
    try {
      await logout()
    } catch {
      setSessionError('Server sign out failed. Your session cookie may still be active. Please retry sign out.')
    } finally {
      setBusy(false)
    }
  }

  return <AuthContext.Provider value={{ user, busy, initializing, sessionError, signIn, signOut, refreshUser, role: getRole(user) }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
