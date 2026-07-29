import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { FiX, FiAlertTriangle, FiTrendingUp, FiDollarSign, FiZap, FiBell, FiSearch } from 'react-icons/fi'
import styles from './RiskDashboard.module.css'

const VENDORS = [
  { name: 'Supplier 1 – Mumbai',    cost: 187750, delivery: 29, risk: 18, status: 'Low Risk'    },
  { name: 'Supplier 2 – Delhi',     cost: 145200, delivery: 18, risk: 32, status: 'Medium Risk'  },
  { name: 'Supplier 3 – Kolkata',   cost: 321450, delivery: 25, risk: 55, status: 'High Risk'    },
  { name: 'Supplier 4 – Chennai',   cost: 412800, delivery: 35, risk: 72, status: 'Critical'     },
  { name: 'Supplier 5 – Bangalore', cost: 198600, delivery: 20, risk: 24, status: 'Low Risk'     },
  { name: 'Supplier 6 – Hyderabad', cost: 267300, delivery: 28, risk: 41, status: 'Medium Risk'  },
  { name: 'Supplier 7 – Pune',      cost: 534900, delivery: 40, risk: 68, status: 'High Risk'    },
  { name: 'Supplier 8 – Ahmedabad', cost: 178400, delivery: 22, risk: 29, status: 'Low Risk'     },
  { name: 'Supplier 9 – Surat',     cost: 234500, delivery: 24, risk: 37, status: 'Medium Risk'  },
  { name: 'Supplier 10 – Jaipur',   cost: 156700, delivery: 19, risk: 21, status: 'Low Risk'     },
]

const BEST = VENDORS.reduce((a, b) => a.risk < b.risk ? a : b)

const RISK_FACTORS = [
  { label: 'Supplier Reliability',   score: 72, level: 'High'   },
  { label: 'Delivery Performance',   score: 55, level: 'Medium' },
  { label: 'Financial Stability',    score: 38, level: 'Medium' },
  { label: 'Compliance Risk',        score: 28, level: 'Low'    },
  { label: 'Geopolitical Risk',      score: 61, level: 'High'   },
]

const FORECAST = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  riskTrend:          Math.floor(30 + Math.sin(i / 4) * 18 + Math.random() * 10),
  deliveryProb:       Math.floor(70 + Math.cos(i / 5) * 12 + Math.random() * 8),
  demandForecast:     Math.floor(50 + Math.sin(i / 3) * 20 + Math.random() * 12),
}))

const HEATMAP = [
  { category: 'Raw Materials',  low: 2, medium: 3, high: 1, critical: 1 },
  { category: 'Logistics',      low: 3, medium: 2, high: 2, critical: 0 },
  { category: 'Supplier',       low: 1, medium: 2, high: 3, critical: 1 },
  { category: 'Compliance',     low: 4, medium: 1, high: 1, critical: 0 },
  { category: 'Financial',      low: 2, medium: 3, high: 1, critical: 2 },
]

const ALERTS = [
  { severity: 'Critical', time: '8 min ago',  desc: 'Supplier 4 risk score hit 72 — exceeds critical threshold' },
  { severity: 'High',     time: '25 min ago', desc: 'Demand surge detected — 34% above forecast for Haircare SKUs' },
  { severity: 'High',     time: '1 hr ago',   desc: 'Supplier 7 delivery delay probability at 68%' },
  { severity: 'Medium',   time: '3 hr ago',   desc: 'Financial stability score dropped 12 points for Supplier 3' },
]

const RECOMMENDATIONS = [
  { icon: '🔄', title: 'Select Alternate Vendor',      desc: 'Switch Supplier 4 orders to Supplier 1 — saves $225K and reduces risk by 54 pts.' },
  { icon: '📦', title: 'Increase Buffer Stock',         desc: 'Add 30-day safety stock for Haircare SKUs to absorb demand surge.' },
  { icon: '🚨', title: 'Approve Emergency Purchase',    desc: 'Raise emergency PO for SKU2, SKU8 before Supplier 3 lead time increases.' },
  { icon: '🚚', title: 'Delay Non-Critical Shipments',  desc: 'Defer Supplier 7 shipments by 14 days to avoid high-delay window.' },
]

const TIMELINE = [
  { time: '11:10 AM', event: 'Supplier 4 flagged as Critical risk — auto-alert sent',     type: 'err'  },
  { time: '10:42 AM', event: 'Risk model re-run — 10 vendors re-scored',                  type: 'ok'   },
  { time: '10:15 AM', event: 'Demand surge detected in Haircare category',                type: 'warn' },
  { time: '09:50 AM', event: 'Supplier 1 confirmed as recommended vendor',                type: 'ok'   },
  { time: '09:20 AM', event: 'Geopolitical risk index updated for Mumbai region',         type: 'warn' },
]

const fmt  = (n) => '$' + n.toLocaleString()
const PAGE_SIZE = 5
const STATUS_COLORS = {
  'Low Risk':    'badgeGreen',
  'Medium Risk': 'badgeYellow',
  'High Risk':   'badgeOrange',
  'Critical':    'badgeRed',
}
const LEVEL_COLORS = { Low: 'badgeGreen', Medium: 'badgeYellow', High: 'badgeRed' }
const SEV_COLORS   = { Critical: 'badgeRed', High: 'badgeOrange', Medium: 'badgeYellow' }

const overallRisk   = Math.round(VENDORS.reduce((s, v) => s + v.risk, 0) / VENDORS.length)
const deliveryProb  = 100 - overallRisk
const avgCost       = Math.round(VENDORS.reduce((s, v) => s + v.cost, 0) / VENDORS.length)
const criticalCount = VENDORS.filter(v => v.status === 'Critical' || v.status === 'High Risk').length

export default function RiskDashboard({ onClose }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage]     = useState(1)

  const filtered = useMemo(() => VENDORS.filter(v => {
    const q = v.name.toLowerCase().includes(search.toLowerCase())
    return q && (filter === 'All' || v.status === filter)
  }), [search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Navbar */}
        <div className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12l4 4 8-8" stroke="url(#rlg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="rlg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
              <span>Enterprise AI Hub</span>
            </div>
            <span className={styles.navSep}>›</span>
            <span className={styles.navTitle}>Agent 4 — Risk Assessment & Forecasting</span>
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
              { label: 'Overall Risk Score',    value: overallRisk + '/100', icon: <FiAlertTriangle/>, trend: '+3 pts', color: styles.cardRed    },
              { label: 'Delivery Probability',  value: deliveryProb + '%',   icon: <FiTrendingUp/>,    trend: '-3%',   color: styles.cardYellow },
              { label: 'Avg Vendor Cost',       value: fmt(avgCost),         icon: <FiDollarSign/>,    trend: '+2.1%', color: styles.cardBlue   },
              { label: 'High / Critical Vendors', value: criticalCount,      icon: <FiZap/>,           trend: '+1',    color: styles.cardOrange },
            ].map(c => (
              <div key={c.label} className={`${styles.statCard} ${c.color}`}>
                <div className={styles.statIcon}>{c.icon}</div>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statTrend}>{c.trend}</div>
              </div>
            ))}
          </div>

          {/* Recommended Vendor + Risk Factors */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Recommended Vendor</div>
              <div className={styles.recVendorCard}>
                <div className={styles.recVendorTop}>
                  <div>
                    <div className={styles.recVendorName}>{BEST.name}</div>
                    <span className={`${styles.badge} ${styles.badgeGreen}`}>✓ AI Recommended</span>
                  </div>
                  <div className={`${styles.riskScore} ${styles.scoreGreen}`}>{BEST.risk}</div>
                </div>
                <div className={styles.recVendorMeta}>
                  <div className={styles.metaItem}><span>Estimated Cost</span><strong>{fmt(BEST.cost)}</strong></div>
                  <div className={styles.metaItem}><span>Delivery Time</span><strong>{BEST.delivery} days</strong></div>
                  <div className={styles.metaItem}><span>Risk Score</span><strong>{BEST.risk} / 100</strong></div>
                  <div className={styles.metaItem}><span>Status</span><strong>{BEST.status}</strong></div>
                </div>
                <div className={styles.recVendorNote}>
                  Lowest risk score across all evaluated vendors. Recommended for immediate PO assignment.
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Risk Factors</div>
              <div className={styles.riskFactors}>
                {RISK_FACTORS.map(f => (
                  <div key={f.label} className={styles.rfRow}>
                    <div className={styles.rfMeta}>
                      <span className={styles.rfLabel}>{f.label}</span>
                      <span className={`${styles.badge} ${styles[LEVEL_COLORS[f.level]]}`}>{f.level}</span>
                    </div>
                    <div className={styles.progressBg}>
                      <div
                        className={`${styles.progressFill} ${f.score >= 60 ? styles.progressRed : f.score >= 40 ? styles.progressYellow : styles.progressGreen}`}
                        style={{ width: f.score + '%' }}
                      />
                    </div>
                    <span className={styles.rfScore}>{f.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor Comparison Table */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Vendor Comparison</span>
              <div className={styles.tableControls}>
                <div className={styles.searchBox}>
                  <FiSearch size={13}/>
                  <input placeholder="Search vendor…" value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className={styles.filterSelect}>
                  <option>All</option>
                  <option>Low Risk</option>
                  <option>Medium Risk</option>
                  <option>High Risk</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <table className={styles.table}>
              <thead>
                <tr><th>Vendor</th><th>Cost</th><th>Delivery Days</th><th>Risk Score</th><th>Status</th></tr>
              </thead>
              <tbody>
                {paginated.map(v => (
                  <tr key={v.name}>
                    <td className={styles.vendorName}>{v.name}</td>
                    <td>{fmt(v.cost)}</td>
                    <td>{v.delivery}d</td>
                    <td>
                      <div className={styles.scoreBar}>
                        <div className={`${styles.scoreBarFill} ${v.risk >= 60 ? styles.progressRed : v.risk >= 40 ? styles.progressYellow : styles.progressGreen}`}
                          style={{ width: v.risk + '%' }} />
                        <span>{v.risk}</span>
                      </div>
                    </td>
                    <td><span className={`${styles.badge} ${styles[STATUS_COLORS[v.status]]}`}>{v.status}</span></td>
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

          {/* Forecast Chart + Heatmap */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Forecast Summary (30 Days)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} interval={4}/>
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }}/>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }}/>
                  <Line type="monotone" dataKey="riskTrend"      stroke="#ef4444" strokeWidth={2} dot={false} name="Risk Trend"/>
                  <Line type="monotone" dataKey="deliveryProb"   stroke="#22c55e" strokeWidth={2} dot={false} name="Delivery Prob"/>
                  <Line type="monotone" dataKey="demandForecast" stroke="#3b82f6" strokeWidth={2} dot={false} name="Demand Forecast"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Risk Heatmap</div>
              <table className={styles.heatTable}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className={styles.hLow}>Low</th>
                    <th className={styles.hMed}>Medium</th>
                    <th className={styles.hHigh}>High</th>
                    <th className={styles.hCrit}>Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {HEATMAP.map(h => (
                    <tr key={h.category}>
                      <td className={styles.hCategory}>{h.category}</td>
                      <td><div className={`${styles.hCell} ${styles.hCellLow}`}>{h.low}</div></td>
                      <td><div className={`${styles.hCell} ${styles.hCellMed}`}>{h.medium}</div></td>
                      <td><div className={`${styles.hCell} ${styles.hCellHigh}`}>{h.high}</div></td>
                      <td><div className={`${styles.hCell} ${styles.hCellCrit}`}>{h.critical}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.heatLegend}>
                {[['Low','hCellLow'],['Medium','hCellMed'],['High','hCellHigh'],['Critical','hCellCrit']].map(([l,c]) => (
                  <span key={l} className={styles.heatLegendItem}>
                    <span className={`${styles.heatDot} ${styles[c]}`}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts + Recommendations */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Risk Alerts</div>
              <div className={styles.alertList}>
                {ALERTS.map((a, i) => (
                  <div key={i} className={styles.alertCard}>
                    <div className={styles.alertTop}>
                      <span className={`${styles.badge} ${styles[SEV_COLORS[a.severity]]}`}>{a.severity}</span>
                      <span className={styles.alertTime}>{a.time}</span>
                    </div>
                    <div className={styles.alertDesc}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>AI Risk Recommendations</div>
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
            <div className={styles.sectionTitle}>Recent Risk Events</div>
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
