import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { FiX, FiUsers, FiCheckCircle, FiXCircle, FiClock, FiBell, FiSearch } from 'react-icons/fi'
import styles from './VendorDashboard.module.css'

const VENDORS = [
  { name: 'Infosys Ltd',         sla: '99.5%', payment: 'Net-30',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-03-15' },
  { name: 'TCS Global',          sla: '98.2%', payment: 'Net-45',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-01-20' },
  { name: 'Wipro Solutions',     sla: '97.8%', payment: 'Net-30',  compliance: 'Pending',       contract: 'Pending',  expiry: '2025-09-10' },
  { name: 'HCL Technologies',    sla: '99.1%', payment: 'Net-60',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-05-30' },
  { name: 'Cognizant Corp',      sla: '96.4%', payment: 'Net-30',  compliance: 'Non-Compliant', contract: 'Rejected', expiry: '2025-07-01' },
  { name: 'Tech Mahindra',       sla: '98.9%', payment: 'Net-45',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-02-14' },
  { name: 'Mphasis Ltd',         sla: '95.3%', payment: 'Net-30',  compliance: 'Pending',       contract: 'Expiring', expiry: '2025-08-20' },
  { name: 'Hexaware Tech',       sla: '97.0%', payment: 'Net-60',  compliance: 'Non-Compliant', contract: 'Rejected', expiry: '2025-06-15' },
  { name: 'L&T Infotech',        sla: '99.3%', payment: 'Net-30',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-04-22' },
  { name: 'Persistent Systems',  sla: '98.5%', payment: 'Net-45',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2025-12-31' },
  { name: 'Zensar Technologies', sla: '96.8%', payment: 'Net-30',  compliance: 'Pending',       contract: 'Pending',  expiry: '2025-10-05' },
  { name: 'Mastech Digital',     sla: '94.7%', payment: 'Net-60',  compliance: 'Non-Compliant', contract: 'Expired',  expiry: '2025-05-01' },
  { name: 'NIIT Technologies',   sla: '97.5%', payment: 'Net-30',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-06-18' },
  { name: 'Cyient Ltd',          sla: '98.0%', payment: 'Net-45',  compliance: 'Compliant',     contract: 'Valid',    expiry: '2026-03-09' },
  { name: 'Sonata Software',     sla: '95.9%', payment: 'Net-30',  compliance: 'Non-Compliant', contract: 'Rejected', expiry: '2025-07-22' },
]

const REJECTIONS = [
  { vendor: 'Cognizant Corp',      reason: 'SLA breach > 3 times in 90 days',    severity: 'Critical', date: '2025-07-25' },
  { vendor: 'Hexaware Tech',       reason: 'Non-compliant data handling policy',  severity: 'High',     date: '2025-07-20' },
  { vendor: 'Sonata Software',     reason: 'Payment default — 2 consecutive months', severity: 'High', date: '2025-07-18' },
  { vendor: 'Mastech Digital',     reason: 'Contract expired — no renewal filed', severity: 'Medium',   date: '2025-07-10' },
]

const DONUT_DATA = [
  { name: 'Valid',     value: 7, color: '#22c55e' },
  { name: 'Expiring',  value: 2, color: '#f59e0b' },
  { name: 'Expired',   value: 1, color: '#6b7280' },
  { name: 'Rejected',  value: 3, color: '#ef4444' },
  { name: 'Pending',   value: 2, color: '#3b82f6' },
]

const EXPIRY_BAR = [
  { range: '0–30 Days',  count: 2 },
  { range: '30–60 Days', count: 3 },
  { range: '60–90 Days', count: 4 },
  { range: '90+ Days',   count: 6 },
]

const RECOMMENDATIONS = [
  { icon: '✅', title: 'Approve TCS Global',        desc: 'All compliance checks passed. Ready for contract renewal.' },
  { icon: '🔄', title: 'Renew HCL Technologies',    desc: 'Contract expires in 90 days. Initiate renewal process.' },
  { icon: '🔍', title: 'Review Wipro Compliance',   desc: 'Pending compliance docs since 45 days. Follow up required.' },
  { icon: '❌', title: 'Reject Sonata Software',    desc: 'Repeated payment defaults. Recommend blacklisting.' },
]

const TIMELINE = [
  { time: '10:55 AM', event: 'L&T Infotech contract renewed for 12 months',         type: 'ok'   },
  { time: '10:30 AM', event: 'Cognizant Corp flagged — SLA breach threshold hit',   type: 'err'  },
  { time: '09:48 AM', event: 'Wipro Solutions compliance docs requested',            type: 'warn' },
  { time: '09:15 AM', event: 'Persistent Systems contract validated successfully',   type: 'ok'   },
  { time: '08:40 AM', event: 'Mastech Digital contract marked Expired',              type: 'warn' },
]

const RAG_RESPONSES = {
  default: 'Ask me anything about vendor policies, contract terms, SLA requirements, compliance rules, or renewal procedures.',
  sla:     '📋 SLA Policy: Vendors must maintain ≥97% uptime. Breaches trigger a 3-strike review. Three strikes within 90 days result in automatic contract suspension.',
  payment: '💳 Payment Terms: Standard terms are Net-30. Net-45/60 requires CFO approval. Defaults on 2 consecutive months trigger contract review.',
  compliance: '✅ Compliance: All vendors must submit ISO 27001 certification, GDPR compliance docs, and quarterly audit reports. Non-submission within 45 days triggers Pending status.',
  expiry:  '📅 Contract Expiry: Renewals must be initiated 90 days before expiry. Contracts not renewed within 30 days of expiry are auto-marked Expired.',
  reject:  '❌ Rejection Policy: Vendors are rejected for SLA breach (3x), payment default (2x), non-compliance, or data policy violations. Rejected vendors enter a 12-month blacklist.',
}

const PAGE_SIZE = 6
const CONTRACT_COLORS = { Valid: styles.badgeGreen, Pending: styles.badgeBlue, Expiring: styles.badgeYellow, Expired: styles.badgeGray, Rejected: styles.badgeRed }
const SEVERITY_COLORS  = { Critical: styles.badgeRed, High: styles.badgeOrange, Medium: styles.badgeYellow }

export default function VendorDashboard({ onClose }) {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('All')
  const [page, setPage]         = useState(1)
  const [ragQuery, setRagQuery] = useState('')
  const [ragAnswer, setRagAnswer] = useState(RAG_RESPONSES.default)

  const filtered = useMemo(() => VENDORS.filter(v => {
    const q = search.toLowerCase()
    const matchQ = v.name.toLowerCase().includes(q) || v.compliance.toLowerCase().includes(q)
    return matchQ && (filter === 'All' || v.contract === filter)
  }), [search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleRagSearch() {
    const q = ragQuery.toLowerCase()
    if (q.includes('sla'))        setRagAnswer(RAG_RESPONSES.sla)
    else if (q.includes('payment')) setRagAnswer(RAG_RESPONSES.payment)
    else if (q.includes('compliance')) setRagAnswer(RAG_RESPONSES.compliance)
    else if (q.includes('expir'))  setRagAnswer(RAG_RESPONSES.expiry)
    else if (q.includes('reject')) setRagAnswer(RAG_RESPONSES.reject)
    else setRagAnswer('🤖 I found relevant policy information. Please refine your query with keywords like SLA, payment, compliance, expiry, or rejection for detailed answers.')
  }

  const total    = VENDORS.length
  const eligible = VENDORS.filter(v => v.contract === 'Valid').length
  const rejected = VENDORS.filter(v => v.contract === 'Rejected').length
  const expiring = VENDORS.filter(v => v.contract === 'Expiring' || v.contract === 'Pending').length

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Navbar */}
        <div className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12l4 4 8-8" stroke="url(#vlg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="vlg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
              <span>Enterprise AI Hub</span>
            </div>
            <span className={styles.navSep}>›</span>
            <span className={styles.navTitle}>Agent 3 — Vendor & Contract Policy</span>
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
              { label: 'Total Vendors',       value: total,    icon: <FiUsers/>,       trend: '+2',   color: styles.cardBlue   },
              { label: 'Eligible Vendors',    value: eligible, icon: <FiCheckCircle/>, trend: '+1',   color: styles.cardGreen  },
              { label: 'Rejected Vendors',    value: rejected, icon: <FiXCircle/>,     trend: '+1',   color: styles.cardRed    },
              { label: 'Contracts Expiring',  value: expiring, icon: <FiClock/>,       trend: '-1',   color: styles.cardYellow },
            ].map(c => (
              <div key={c.label} className={`${styles.statCard} ${c.color}`}>
                <div className={styles.statIcon}>{c.icon}</div>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statTrend}>{c.trend} this month</div>
              </div>
            ))}
          </div>

          {/* Vendors Table */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Eligible Vendors</span>
              <div className={styles.tableControls}>
                <div className={styles.searchBox}>
                  <FiSearch size={13}/>
                  <input placeholder="Search vendor or compliance…" value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className={styles.filterSelect}>
                  <option>All</option><option>Valid</option><option>Pending</option><option>Expiring</option><option>Expired</option><option>Rejected</option>
                </select>
              </div>
            </div>
            <table className={styles.table}>
              <thead>
                <tr><th>Vendor Name</th><th>SLA</th><th>Payment Terms</th><th>Compliance</th><th>Contract Status</th><th>Expiry</th></tr>
              </thead>
              <tbody>
                {paginated.map(v => (
                  <tr key={v.name}>
                    <td className={styles.vendorName}>{v.name}</td>
                    <td>{v.sla}</td>
                    <td>{v.payment}</td>
                    <td>
                      <span className={`${styles.badge} ${v.compliance === 'Compliant' ? styles.badgeGreen : v.compliance === 'Pending' ? styles.badgeBlue : styles.badgeRed}`}>
                        {v.compliance}
                      </span>
                    </td>
                    <td><span className={`${styles.badge} ${CONTRACT_COLORS[v.contract]}`}>{v.contract}</span></td>
                    <td className={styles.mono}>{v.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.pagination}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              <span>Page {page} of {Math.max(totalPages, 1)}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
            </div>
          </div>

          {/* Donut + Bar Chart */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Contract Validation</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {DONUT_DATA.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Contract Expiry Timeline</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={EXPIRY_BAR} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }}/>
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false}/>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}/>
                  <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Rejections + RAG Search */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Top Rejections</div>
              <div className={styles.rejList}>
                {REJECTIONS.map((r, i) => (
                  <div key={i} className={styles.rejCard}>
                    <div className={styles.rejTop}>
                      <span className={styles.rejVendor}>{r.vendor}</span>
                      <span className={`${styles.badge} ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
                    </div>
                    <div className={styles.rejReason}>{r.reason}</div>
                    <div className={styles.rejDate}>{r.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Vendor Policy Search</div>
              <div className={styles.ragBox}>
                <div className={styles.ragInput}>
                  <FiSearch size={14} className={styles.ragIcon}/>
                  <input
                    placeholder="Ask anything about vendor policies or contracts…"
                    value={ragQuery}
                    onChange={e => setRagQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRagSearch()}
                  />
                </div>
                <button className={styles.ragBtn} onClick={handleRagSearch}>Search</button>
              </div>
              <div className={styles.ragHints}>
                {['SLA policy','Payment terms','Compliance rules','Contract expiry','Rejection policy'].map(h => (
                  <button key={h} className={styles.ragChip} onClick={() => { setRagQuery(h); setTimeout(handleRagSearch, 0) }}>{h}</button>
                ))}
              </div>
              <div className={styles.ragAnswer}>{ragAnswer}</div>
            </div>
          </div>

          {/* Recommendations + Timeline */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>AI Vendor Recommendations</div>
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
              <div className={styles.sectionTitle}>Recent Vendor Activities</div>
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
