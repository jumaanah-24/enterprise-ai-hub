import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Sidebar.module.css'

export default function Sidebar({ onRunPipeline, onAddAgent }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 12l4 4 8-8" stroke="url(#slg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="slg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
          </svg>
          <span>AI Hub</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <div className={styles.label}>Overview</div>
          <NavLink to="/dashboard" end className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
            <IconGrid /> Dashboard
          </NavLink>
          <NavLink to="/dashboard/agents" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
            <IconAgents /> Agents
          </NavLink>
          <NavLink to="/dashboard/incidents" className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
            <IconAlert /> Incidents
          </NavLink>
        </div>
        <div className={styles.section}>
          <div className={styles.label}>Actions</div>
          <button className={styles.item} onClick={onRunPipeline}>
            <IconPlay /> Run Pipeline
          </button>
          <button className={styles.item} onClick={onAddAgent}>
            <IconPlus /> Add Agent
          </button>
        </div>
        
      </nav>

      <div className={styles.footer}>
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">⏻</button>
        </div>
        <div className={styles.status}><span className={styles.dot} /> All systems operational</div>
      </div>
    </aside>
  )
}

const IconGrid = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
const IconAgents = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IconPlay = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

