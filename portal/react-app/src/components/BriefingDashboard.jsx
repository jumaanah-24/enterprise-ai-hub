import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FiX, FiTrendingUp, FiShield, FiDollarSign, FiAlertTriangle, FiBell, FiDownload, FiShare2, FiMail, FiMessageSquare } from 'react-icons/fi'
import styles from './BriefingDashboard.module.css'

const INCIDENTS = [
  { id: 'INC-2025-001', summary: 'Supply chain disruption — Supplier 4 critical risk breach',       outcome: 'Alternate vendor activated. PO rerouted to Supplier 1.',         status: 'Resolved',   resolved: '09:45 AM', impact: 'High'     },
  { id: 'INC-2025-002', summary: 'Cloud & Infra budget exceeded by $62,000',                        outcome: 'Emergency budget approved. Cost optimisation plan initiated.',    status: 'Resolved',   resolved: '10:20 AM', impact: 'High'     },
  { id: 'INC-2025-003', summary: 'Vendor contract expiry — Hexaware Tech non-compliant',            outcome: 'Contract terminated. Replacement vendor shortlisted.',            status: 'Resolved',   resolved: '11:00 AM', impact: 'Medium'   },
  { id: 'INC-2025-004', summary: 'PO-2025-012 pending CFO approval — $148K threshold',             outcome: 'Escalated to Board. Awaiting final sign-off.',                    status: 'Escalated',  resolved: '—',        impact: 'Critical' },
  { id: 'INC-2025-005', summary: 'Demand surge — Haircare SKUs 34% above forecast',                outcome: 'Buffer stock increase approved. Emergency PO raised.',            status: 'Pending',    resolved: '—',        impact: 'Medium'   },
  { id: 'INC-2025-006', summary: 'ERP sync failure for PO-2025-003',                               outcome: 'IT team notified. Retry scheduled for next maintenance window.',  status: 'Pending',    resolved: '—',        impact: 'Low'      },
]

const RESOLUTION = {
  resolved:  INCIDENTS.filter(i => i.status === 'Resolved').length,
  pending:   INCIDENTS.filter(i => i.status === 'Pending').length,
  escalated: INCIDENTS.filter(i => i.status === 'Escalated').length,
}

const BUSINESS_IMPACT = [
  { label: 'Production Impact',  value: 'Moderate',  detail: '2 SKUs halted for 4 hrs — resumed after vendor switch',   color: styles.impYellow },
  { label: 'Revenue Impact',     value: '$284,000',  detail: 'Potential revenue loss averted by emergency procurement',  color: styles.impRed    },
  { label: 'Customer Impact',    value: 'Minimal',   detail: '3 delayed orders — customers notified proactively',        color: styles.impGreen  },
  { label: 'Financial Impact',   value: '$62,000',   detail: 'Cloud overspend contained. Recovery plan in progress.',    color: styles.impOrange },
]

const PIE_DATA = [
  { name: 'Finance',      value: 28, color: '#3b82f6' },
  { name: 'Operations',   value: 24, color: '#f59e0b' },
  { name: 'Supply Chain', value: 32, color: '#22c55e' },
  { name: 'Cloud',        value: 16, color: '#8b5cf6' },
]

const NOTIFICATIONS = [
  { icon: <FiMessageSquare size={15}/>, channel: 'Slack',          recipient: '#exec-alerts channel',        status: 'Sent',    time: '09:46 AM' },
  { icon: <FiMail size={15}/>,          channel: 'Executive Email', recipient: 'ceo@enterprise.ai',           status: 'Sent',    time: '09:47 AM' },
  { icon: <FiMessageSquare size={15}/>, channel: 'Teams',           recipient: 'Executive Leadership Team',   status: 'Sent',    time: '09:48 AM' },
  { icon: <FiMail size={15}/>,          channel: 'Executive Email', recipient: 'cfo@enterprise.ai',           status: 'Pending', time: '—'        },
]

const TIMELINE = [
  { time: '11:05 AM', event: 'Board briefing report generated and distributed',              type: 'ok'   },
  { time: '10:50 AM', event: 'PO-2025-012 escalated — CFO notified via email and Teams',    type: 'warn' },
  { time: '10:20 AM', event: 'Cloud budget incident resolved — emergency fund approved',     type: 'ok'   },
  { time: '09:55 AM', event: 'Demand surge alert escalated to Supply Chain VP',             type: 'warn' },
  { time: '09:45 AM', event: 'INC-2025-001 resolved — Supplier 1 activated as alternate',  type: 'ok'   },
  { time: '09:10 AM', event: 'Daily executive briefing pipeline triggered',                 type: 'ok'   },
]

const RECOMMENDATIONS = [
  { icon: '✅', title: 'Approve PO-2025-012',       desc: 'Board approval pending for $148K. Recommend immediate sign-off to avoid production delay.' },
  { icon: '📉', title: 'Reduce Cloud Budget',        desc: 'Rightsizing EC2 instances can reduce monthly cloud spend by ~$14K.' },
  { icon: '⬆️', title: 'Escalate Supplier 4 Risk',  desc: 'Supplier 4 risk score at 72/100. Recommend formal risk escalation to procurement board.' },
  { icon: '🔒', title: 'Close INC-2025-003',         desc: 'Hexaware contract terminated. Replacement vendor onboarded. Safe to close incident.' },
]

const IMPACT_COLORS = { High: styles.badgeOrange, Medium: styles.badgeYellow, Low: styles.badgeBlue, Critical: styles.badgeRed }
const STATUS_COLORS  = { Resolved: styles.badgeGreen, Pending: styles.badgeYellow, Escalated: styles.badgeRed }
const SEV_COLORS     = { Critical: styles.badgeRed, High: styles.badgeOrange, Medium: styles.badgeYellow, Low: styles.badgeBlue }

export default function BriefingDashboard({ onClose }) {
  const [downloaded, setDownloaded] = useState({})

  function handleDownload(type) {
    setDownloaded(prev => ({ ...prev, [type]: true }))
    setTimeout(() => setDownloaded(prev => ({ ...prev, [type]: false })), 2000)
  }

  const totalImpact  = '$346,000'
  const delayPrev    = '3 incidents'
  const overallRisk  = 'MEDIUM'

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Navbar */}
        <div className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12l4 4 8-8" stroke="url(#elg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="elg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
              <span>Enterprise AI Hub</span>
            </div>
            <span className={styles.navSep}>›</span>
            <span className={styles.navTitle}>Agent 6 — Executive Briefing & Reporting</span>
            <span className={styles.activeBadge}>● Active</span>
          </div>
          <div className={styles.navRight}>
            <button className={styles.iconBtn}><FiBell size={16}/></button>
            <div className={styles.avatar}>A</div>
            <button className={styles.closeBtn} onClick={onClose}><FiX size={18}/></button>
          </div>
        </div>

        <div className={styles.body}>

          {/* Stat Cards */}
          <div className={styles.statsGrid}>
            {[
              { label: 'Business Impact',  value: totalImpact,   icon: <FiTrendingUp/>,    trend: '↑ Averted',  color: styles.cardGreen  },
              { label: 'Delays Prevented', value: delayPrev,     icon: <FiShield/>,         trend: 'Today',      color: styles.cardBlue   },
              { label: 'Total Cost Impact',value: '$62,000',     icon: <FiDollarSign/>,     trend: 'Contained',  color: styles.cardYellow },
              { label: 'Overall Risk',     value: overallRisk,   icon: <FiAlertTriangle/>,  trend: '↓ Improving',color: styles.cardOrange },
            ].map(c => (
              <div key={c.label} className={`${styles.statCard} ${c.color}`}>
                <div className={styles.statIcon}>{c.icon}</div>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statTrend}>{c.trend}</div>
              </div>
            ))}
          </div>

          {/* Executive Summary + Resolution Status */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Executive Summary</div>
              <div className={styles.incidentList}>
                {INCIDENTS.map(inc => (
                  <div key={inc.id} className={styles.incCard}>
                    <div className={styles.incTop}>
                      <span className={styles.incId}>{inc.id}</span>
                      <div className={styles.incBadges}>
                        <span className={`${styles.badge} ${STATUS_COLORS[inc.status]}`}>{inc.status}</span>
                        <span className={`${styles.badge} ${IMPACT_COLORS[inc.impact]}`}>{inc.impact}</span>
                      </div>
                    </div>
                    <div className={styles.incSummary}>{inc.summary}</div>
                    <div className={styles.incOutcome}>→ {inc.outcome}</div>
                    {inc.resolved !== '—' && <div className={styles.incTime}>Resolved: {inc.resolved}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.colStack}>
              {/* Resolution Status */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Resolution Status</div>
                <div className={styles.resGrid}>
                  {[
                    { label: 'Resolved',  value: RESOLUTION.resolved,  cls: styles.resGreen  },
                    { label: 'Pending',   value: RESOLUTION.pending,   cls: styles.resYellow },
                    { label: 'Escalated', value: RESOLUTION.escalated, cls: styles.resRed    },
                  ].map(r => (
                    <div key={r.label} className={`${styles.resCard} ${r.cls}`}>
                      <div className={styles.resValue}>{r.value}</div>
                      <div className={styles.resLabel}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Reports */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Executive Reports</div>
                <div className={styles.reportBtns}>
                  {[
                    { key: 'pdf',   label: 'PDF Report',      icon: <FiDownload size={14}/> },
                    { key: 'excel', label: 'Excel Report',    icon: <FiDownload size={14}/> },
                    { key: 'share', label: 'Share Dashboard', icon: <FiShare2 size={14}/>   },
                  ].map(b => (
                    <button key={b.key} className={`${styles.reportBtn} ${downloaded[b.key] ? styles.reportBtnDone : ''}`}
                      onClick={() => handleDownload(b.key)}>
                      {b.icon}
                      {downloaded[b.key] ? '✓ Done' : b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications Sent */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Notifications Sent</div>
                <div className={styles.notifList}>
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className={styles.notifCard}>
                      <div className={styles.notifIcon}>{n.icon}</div>
                      <div className={styles.notifInfo}>
                        <div className={styles.notifChannel}>{n.channel}</div>
                        <div className={styles.notifRecipient}>{n.recipient}</div>
                      </div>
                      <div className={styles.notifRight}>
                        <span className={`${styles.badge} ${n.status === 'Sent' ? styles.badgeGreen : styles.badgeYellow}`}>{n.status}</span>
                        <span className={styles.notifTime}>{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Business Impact + Pie Chart */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Business Impact Section</div>
              <div className={styles.impactList}>
                {BUSINESS_IMPACT.map(b => (
                  <div key={b.label} className={`${styles.impactCard} ${b.color}`}>
                    <div className={styles.impactTop}>
                      <span className={styles.impactLabel}>{b.label}</span>
                      <span className={styles.impactValue}>{b.value}</span>
                    </div>
                    <div className={styles.impactDetail}>{b.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Impact Breakdown</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                    {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v) => v + '%'} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations + Timeline */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>AI Executive Recommendations</div>
              <div className={styles.recList}>
                {RECOMMENDATIONS.map((r, i) => (
                  <div key={i} className={styles.recCard}>
                    <span className={styles.recIcon}>{r.icon}</span>
                    <div>
                      <div className={styles.recTitle}>{r.title}</div>
                      <div className={styles.recDesc}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Executive Timeline</div>
              <div className={styles.timeline}>
                {TIMELINE.map((t, i) => (
                  <div key={i} className={styles.tlItem}>
                    <div className={`${styles.tlDot} ${styles[`tl_${t.type}`]}`}/>
                    <div className={styles.tlContent}>
                      <div className={styles.tlEvent}>{t.event}</div>
                      <div className={styles.tlTime}>{t.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <span>Last Updated: {new Date().toLocaleString()}</span>
            <span>System Status: <span className={styles.footerOk}>● Operational</span></span>
            <span>Version 1.0.0</span>
          </div>

        </div>
      </div>
    </div>
  )
}
