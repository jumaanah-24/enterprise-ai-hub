import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Login.module.css'

export default function Login() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) { navigate('/dashboard', { replace: true }); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    if (tab === 'signin') {
      const ok = login(email, password)
      setLoading(false)
      if (ok) navigate('/dashboard', { replace: true })
      else setError('Invalid email or password.')
    } else {
      const res = register(email, password, name)
      setLoading(false)
      if (res.ok) {
        setTab('signin')
        setName('')
        setPassword('')
        setError('')
        setSuccess('Account created! Please sign in.')
      } else {
        setError(res.error)
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.back}>← Back to home</Link>
        <div className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 12l4 4 8-8" stroke="url(#lg2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lg2" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
          </svg>
          <span>Enterprise AI Hub</span>
        </div>

        <div className={styles.tabs}>
          <button className={tab === 'signin' ? styles.tabActive : styles.tab} onClick={() => { setTab('signin'); setError(''); setSuccess('') }}>Sign In</button>
          <button className={tab === 'register' ? styles.tabActive : styles.tab} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'register' && (
            <>
              <label>Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </>
          )}
          <label>Email</label>
          <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus={tab === 'signin'} />
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          {success && <div className={styles.successMsg}>{success}</div>}
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? '…' : tab === 'signin' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        {tab === 'signin' && (
          <div className={styles.demoHint}>
            <strong>Demo credentials</strong>
            <span>admin@enterprise.ai / admin123</span>
            <span>user@enterprise.ai / user123</span>
          </div>
        )}
      </div>
    </div>
  )
}
