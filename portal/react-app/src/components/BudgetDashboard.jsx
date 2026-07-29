import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { FiX, FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart, FiBell, FiSearch } from 'react-icons/fi'
import styles from './BudgetDashboard.module.css'

const TOTAL_BUDGET = 5000000
const SPENT = 3_412_800
const REMAINING = TOTAL_BUDGET - SPENT
const UTILIZATION = Math.round((SPENT / TOTAL_BUDGET) * 100)

const DEPARTMENTS = [
  { dept: 'Engineering',  allocated: 1200000, spent: 980000 },
  { dept: 'Operations',   allocated: 900000,  spent: 870000 },
  { dept: 'Procurement',  allocated: 800000,  spent: 620000 },
  { dept: 'Cloud & Infra',allocated: 750000,  spent: 812000 },
  { dept: 'Logistics',    allocated: 600000,  spent: 430000 },
  { dept: 'HR & Admin',   allocated: 400000,  spent: 310000 },
  { dept: 'Marketing',    allocated: 350000,  spent: 390800 },
]

const TRANSACTIONS = [
  { id:'TXN-001', dept:'Cloud & Infra',  category:'Cloud Services',  amount:42500,  date:'2025-07-28', status:'Approved' },
  { id:'TXN-002', dept:'Procurement',    category:'Vendor Payment',   amount:18700,  date:'2025-07-27', status:'Approved' },
  { id:'TXN-003', dept:'Marketing',      category:'Ad Campaign',      amount:31200,  date:'2025-07-26', status:'Pending'  },
  { id:'TXN-004', dept:'Operations',     category:'Facility Rent',    amount:55000,  date:'2025-07-25', status:'Approved' },
  { id:'TXN-005', dept:'Engineering',    category:'Software License', amount:12800,  date:'2025-07-24', status:'Approved' },
  { id:'TXN-006', dept:'Logistics',      category:'Freight Cost',     amount:9400,   date:'2025-07-23', status:'Rejected' },
  { id:'TXN-007', dept:'HR & Admin',     category:'Recruitment',      amount:7600,   date:'2025-07-22', status:'Pending'  },
  { id:'TXN-008', dept:'Cloud & Infra',  category:'Cloud Services',   amount:38900,  date:'2025-07-21', status:'Approved' },
  { id:'TXN-009', dept:'Procurement',    category:'Raw Materials',    amount:62000,  date:'2025-07-20', status:'Approved' },
  { id:'TXN-010', dept:'Marketing',      category:'Events',           amount:24500,  date:'2025-07-19', status:'Rejected' },
  { id:'TXN-011', dept:'Engineering',    category:'R&D',              amount:88000,  date:'2025-07-18', status:'Approved' },
  { id:'TXN-012', dept:'Operations',     category:'Utilities',        amount:14200,  date:'2025-07-17', status:'Pending'  },
]

const PIE_DATA = [
  { name: 'Procurement',    value: 620000,  color: '#3b82f6' },
  { name: 'Cloud Services', value: 812000,  color: '#06b6d4' },
  { name: 'Logistics',      value: 430000,  color: '#8b5cf6' },
  { name: 'Operations',     value: 870000,  color: '#f59e0b' },
  { name: 'Others',         value: 680800,  color: '#6b7280' },
]

const CLOUD_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  spend: Math.floor(28000 + Math.sin(i / 4) * 8000 + Math.random() * 5000),
}))

const ALERTS = [
  { severity: 'Critical', time: '5 min ago',  desc: 'Cloud & Infra exceeded allocated budget by $62,000' },
  { severity: 'High',     time: '30 min ago', desc: 'Marketing department spending 11.7% over budget' },
  { severity: 'Medium',   time: '2 hr ago',   desc: 'Cloud cost increased 18% compared to last month' },
  { severity: 'Low',      time: '5 hr ago',   desc: 'Operations budget utilisation at 96.7% — near threshold' },
]

const RECOMMENDATIONS = [
  { icon: '☁️', title: 'Reduce Cloud Cost',           desc: 'Rightsizing EC2 instances can save ~$14,000/month.' },
  { icon: '🔒', title: 'Freeze Non-Essential Spend',  desc: 'Pause Marketing events budget until Q3 review.' },
  { icon: '💼', title: 'Approve Emergency Budget',    desc: 'Cloud & Infra needs $62K emergency allocation.' },
  { icon: '🤝', title: 'Optimise Vendor Payments',    desc: 'Renegotiate Procurement contracts for 8% savings.' },
]

const TIMELINE = [
  { time: '11:02 AM', event: 'TXN-011 approved — Engineering R&D $88,000',        type: 'ok'   },
  { time: '10:45 AM', event: 'Cloud & Infra budget threshold breached',            type: 'err'  },
  { time: '10:20 AM', event: 'TXN-006 rejected — Logistics freight cost',          type: 'warn' },
  { time: '09:50 AM', event: 'Monthly budget report generated',                    type: 'ok'   },
  { time: '09:15 AM', event: 'Marketing overspend flagged by AI agent',            type: 'warn' },
]

const fmt = (n) => '$' + n.toLocaleString()
const PAGE_SIZE = 6
const SEVERITY_COLORS = { Critical: styles.badgeRed, High: styles.badgeOrange, Medium: styles.badgeYellow, Low: styles.badgeBlue }
const STATUS_COLORS   = { Approved: styles.badgeGreen, Pending: styles.badgeYellow, Rejected: styles.badgeRed }

export default function BudgetDashboard({ onClose }) {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('All')
  const [page, setPage]       = useState(1)

  const filtered = useMemo(() => TRANSACTIONS.filter(t => {
    const q = search.toLowerCase()
    const matchQ = t.id.toLowerCase().includes(q) || t.dept.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    return matchQ && (filter === 'All' || t.status === filter)
  }), [search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const overBudget = DEPARTMENTS.filter(d => d.spent > d.allocated).length

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Navbar */}
        <div className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12l4 4 8-8" stroke="url(#blg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="blg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
              <span>Enterprise AI Hub</span>
            </div>
            <span className={styles.navSep}>›</span>
            <span className={styles.navTitle}>Agent 2 — Budget & Financial Analytics</span>
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
              { label: 'Total Budget',       value: fmt(TOTAL_BUDGET), icon: <FiDollarSign/>,  trend: '0%',   color: styles.cardBlue   },
              { label: 'Spent Amount',        value: fmt(SPENT),        icon: <FiTrendingUp/>,  trend: '+6.2%',color: styles.cardRed    },
              { label: 'Remaining Budget',    value: fmt(REMAINING),    icon: <FiTrendingDown/>,trend: '-6.2%',color: styles.cardGreen  },
              { label: 'Budget Utilisation',  value: UTILIZATION + '%', icon: <FiPieChart/>,    trend: '+2.1%',color: styles.cardYellow },
            ].map(c => (
              <div key={c.label} className={`${styles.statCard} ${c.color}`}>
                <div className={styles.statIcon}>{c.icon}</div>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statTrend}>{c.trend}</div>
              </div>
            ))}
          </div>

          {/* Budget Overview + Risk Panel */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Budget Overview</div>
              {DEPARTMENTS.map(d => {
                const pct = Math.min(Math.round((d.spent / d.allocated) * 100), 100)
                const over = d.spent > d.allocated
                return (
                  <div key={d.dept} className={styles.budgetRow}>
                    <div className={styles.budgetMeta}>
                      <span className={styles.budgetDept}>{d.dept}</span>
                      <span className={`${styles.budgetAmt} ${over ? styles.over : ''}`}>
                        {fmt(d.spent)} / {fmt(d.allocated)}
                      </span>
                    </div>
                    <div className={styles.progressBg}>
                      <div className={`${styles.progressFill} ${over ? styles.progressRed : pct > 80 ? styles.progressYellow : styles.progressBlue}`}
                        style={{ width: pct + '%' }} />
                    </div>
                    <span className={styles.budgetPct}>{pct}%</span>
                  </div>
                )
              })}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Financial Risk Panel</div>
              <div className={styles.riskGrid}>
                {[
                  { label: 'Risk Level',          value: overBudget >= 2 ? 'HIGH' : 'MEDIUM', badge: overBudget >= 2 ? styles.badgeRed : styles.badgeYellow },
                  { label: 'Emergency Fund',       value: 'DEPLETED',   badge: styles.badgeRed    },
                  { label: 'Budget Health',        value: UTILIZATION > 80 ? 'AT RISK' : 'STABLE', badge: UTILIZATION > 80 ? styles.badgeOrange : styles.badgeGreen },
                  { label: 'Departments Over Budget', value: `${overBudget} of ${DEPARTMENTS.length}`, badge: overBudget > 0 ? styles.badgeOrange : styles.badgeGreen },
                ].map(r => (
                  <div key={r.label} className={styles.riskCard}>
                    <div className={styles.riskLabel}>{r.label}</div>
                    <span className={`${styles.badge} ${r.badge}`}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className={styles.riskRec}>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>💡 AI Recommendation</span>
                <p>Reallocate $120K from underspent Logistics budget to cover Cloud & Infra and Marketing overruns.</p>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Expenses Table</span>
              <div className={styles.tableControls}>
                <div className={styles.searchBox}>
                  <FiSearch size={13}/>
                  <input placeholder="Search ID, dept, category…" value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className={styles.filterSelect}>
                  <option>All</option><option>Approved</option><option>Pending</option><option>Rejected</option>
                </select>
              </div>
            </div>
            <table className={styles.table}>
              <thead><tr><th>Transaction ID</th><th>Department</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.id}</td>
                    <td>{t.dept}</td>
                    <td>{t.category}</td>
                    <td className={styles.amount}>{fmt(t.amount)}</td>
                    <td>{t.date}</td>
                    <td><span className={`${styles.badge} ${STATUS_COLORS[t.status]}`}>{t.status}</span></td>
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

          {/* Pie + Line Chart */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Expense Breakdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Cloud Cost Trend (30 Days)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={CLOUD_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="spend" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts + Recommendations */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Financial Alerts</div>
              <div className={styles.alertList}>
                {ALERTS.map((a, i) => (
                  <div key={i} className={styles.alertCard}>
                    <div className={styles.alertTop}>
                      <span className={`${styles.badge} ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                      <span className={styles.alertTime}>{a.time}</span>
                    </div>
                    <div className={styles.alertDesc}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>AI Financial Recommendations</div>
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
          </div>

          {/* Timeline */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Recent Transactions Timeline</div>
            <div className={styles.timeline}>
              {TIMELINE.map((t, i) => (
                <div key={i} className={styles.tlItem}>
                  <div className={`${styles.tlDot} ${styles[`tl_${t.type}`]}`} />
                  <div className={styles.tlContent}>
                    <div className={styles.tlEvent}>{t.event}</div>
                    <div className={styles.tlTime}>{t.time}</div>
                  </div>
                </div>
              ))}
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
