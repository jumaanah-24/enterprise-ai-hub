import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ai_hub_user')) } catch { return null }
  })

  function getUsers() {
    try { return JSON.parse(localStorage.getItem('ai_hub_users')) || {} } catch { return {} }
  }

  function register(email, password, name) {
    const users = getUsers()
    if (users[email]) return { ok: false, error: 'Email already registered.' }
    users[email] = { password, name }
    localStorage.setItem('ai_hub_users', JSON.stringify(users))
    // Do NOT auto-login — user must sign in manually
    return { ok: true }
  }

  function login(email, password) {
    const DEMO = { 'admin@enterprise.ai': 'admin123', 'user@enterprise.ai': 'user123' }
    const users = getUsers()
    const match = (DEMO[email] === password) || (users[email]?.password === password)
    if (match) {
      const name = users[email]?.name || email.split('@')[0]
      const u = { email, name }
      sessionStorage.setItem('ai_hub_user', JSON.stringify(u))
      setUser(u)
      return true
    }
    return false
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
