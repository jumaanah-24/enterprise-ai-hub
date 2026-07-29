import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const API = 'http://localhost:8080'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ai_hub_user')) } catch { return null }
  })

  async function register(email, password, name) {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.detail || 'Registration failed.' }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not connect to server.' }
    }
  }

  async function login(email, password) {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return false
      sessionStorage.setItem('ai_hub_user', JSON.stringify(data.user))
      setUser(data.user)
      return true
    } catch {
      return false
    }
  }

  function logout() {
    sessionStorage.removeItem('ai_hub_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, register }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
