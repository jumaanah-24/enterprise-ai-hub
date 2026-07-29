import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Landing.module.css'

const features = [
  { icon: '📦', title: 'Supply Chain Intelligence', desc: 'Real-time inventory, shortage detection, supplier & logistics analysis.' },
  { icon: '💰', title: 'Budget & Finance', desc: 'Spend monitoring, budget gap analysis, and financial forecasting.' },
  { icon: '📋', title: 'Vendor & Contract', desc: 'Contract compliance, expiry tracking, and vendor risk scoring.' },
  { icon: '⚠️', title: 'Risk Forecasting', desc: 'Autonomous risk scoring across supply, finance, and procurement.' },
  { icon: '🛒', title: 'Procurement Workflow', desc: 'Automated PO generation, ERP updates, and approval routing.' },
  { icon: '📊', title: 'Executive Briefing', desc: 'AI-generated reports, dashboards, and stakeholder notifications.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 12l4 4 8-8" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
          </svg>
          <span>Enterprise AI Hub</span>
        </div>
        <div className={styles.navActions}>
          {user
            ? <button className={styles.btnPrimary} onClick={() => navigate('/dashboard')}>Go to Dashboard →</button>
            : <>
                <button className={styles.btnGhost} onClick={() => navigate('/login')}>Sign In</button>
                <button className={styles.btnPrimary} onClick={() => navigate('/login')}>Get Started</button>
              </>
          }
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>🤖 Multi-Agent AI Platform</div>
          <h1>Your enterprise runs on <span className={styles.grad}>intelligent agents</span></h1>
          <p>Six autonomous AI agents working together — monitoring supply chains, budgets, vendors, risks, procurement, and delivering executive briefings in real time.</p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
              Launch Control Center →
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}><strong>6</strong><span>AI Agents</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>100+</strong><span>SKUs Monitored</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Real-time</strong><span>Pipeline</span></div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.robotCard}>
            <span className={styles.robotTag}>AI Guide</span>
            <img src="/robot.png" alt="Enterprise AI" className={styles.robotImg} />
            <div className={styles.robotGlow} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.sectionLabel}>What the platform does</div>
        <h2 className={styles.sectionTitle}>Six agents. One unified platform.</h2>
        <div className={styles.featureGrid}>
          {features.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Ready to see your agents in action?</h2>
        <p>Sign in to the control center and run your first pipeline in seconds.</p>
        <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
          Sign In to Dashboard →
        </button>
      </section>

      <footer className={styles.footer}>
        <span>© 2025 Enterprise AI Hub · Powered by Groq</span>
      </footer>
    </div>
  )
}
