import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { FiX, FiShoppingCart, FiClock, FiCheckCircle, FiTrendingUp, FiBell, FiSearch } from 'react-icons/fi'
import styles from './ProcurementDashboard.module.css'

const WORKFLOW_STEPS = ['Requisition Created', 'Approval', 'PO Generated', 'ERP Updated', 'Order Placed']

const PO_DETAILS = [
  { po: 'PO-2025-001', vendor: 'Infosys Ltd',      product: 'Cloud Licenses',    qty: 50,  amount: 125000, status: 'Approved',  dept: 'Engineering',  date: '2025-07-28' },
  { po: 'PO-2025-002', vendor: 'TCS Global',        product: 'IT Hardware',       qty: 20,  amount: 84000,  status: 'Pending',   dept: 'Operations',   date: '2025-07-27' },
  { po: 'PO-2025-003', vendor: 'Wipro Solutions',   product: 'Office Supplies',   qty: 200, amount: 18500,  status: 'Completed', dept: 'HR & Admin',   date: '2025-07-26' },
  { po: 'PO-2025-004', vendor: 'HCL Technologies',  product: 'Network Equipment', qty: 10,  amount: 210000, status: 'Rejected',  dept: 'Cloud & Infra',date: '2025-07-25' },
  { po: 'PO-2025-005', vendor: 'Tech Mahindra',     product: 'Security Software', qty: 30,  amount: 67500,  status: 'Approved',  dept: 'Engineering',  date: '2025-07-24' },
  { po: 'PO-2025-006', vendor: 'Mphasis Ltd',       product: 'Logistics Services',qty: 1,   amount: 43000,  status: 'Pending',   dept: 'Logistics',    date: '2025-07-23' },
  { po: 'PO-2025-007', vendor: 'L&T Infotech',      product: 'Consulting Hours',  qty: 100, amount: 95000,  status: 'Completed', dept: 'Procurement',  date: '2025-07-22' },
  { po: 'PO-2025-008', vendor: 'Cognizant Corp',    product: 'Data Services',     qty: 5,   amount: 38000,  status: 'Pending',   dept: 'Operations',   date: '2025-07-21' },
  { po: 'PO-2025-009', vendor: 'Persistent Sys',    product: 'Dev Tools License', qty: 40,  amount: 52000,  status: 'Approved',  dept: 'Engineering',  date: '2025-07-20' },
  { po: 'PO-2025-010', vendor: 'Zensar Tech',       product: 'Facility Services', qty: 1,   amount: 29000,  status: 'Completed', dept: 'HR & Admin',   date: '2025-07-19' },
  { po: 'PO-2025-011', vendor: 'Hexaware Tech',     product: 'Testing Services',  qty: 60,  amount: 71000,  status: 'Rejected',  dept: 'Engineering',  date: '2025-07-18' },
  { po: 'PO-2025-012', vendor: 'Cyient Ltd',        product: 'Analytics Platform',qty: 1,   amount: 148000, status: 'Pending',   dept: 'Cloud & Infra',date: '2025-07-17' },
]

const APPROVALS = [
  { po: 'PO-2025-002', vendor: 'TCS Global',     amount: 84000,  approver: 'CFO – Rajesh Kumar',   dept: 'Operations'    },
  { po: 'PO-2025-006', vendor: 'Mphasis Ltd',    amount: 43000,  approver: 'VP Ops – Priya Nair',  dept: 'Logistics'     },
  { po: 'PO-2025-008', vendor: 'Cognizant Corp', amount: 38000,  approver: 'Dir – Amit Sharma',    dept: 'Operations'    },
  { po: 'PO-2025-012', vendor: 'Cyient Ltd',     amount: 148000, approver: 'CFO – Rajesh Kumar',   dept: 'Cloud & Infra' },
]

const BAR_DATA = [
  { dept: 'Engineering',   Completed: 3, Pending: 1, Rejected: 1, Cancelled: 0 },
  { dept: 'Operations',    Completed: 2, Pending: 2, Rejected: 0, Cancelled: 1 },
  { dept: 'Cloud & Infra', Completed: 1, Pending: 2, Rejected: 1, Cancelled: 0 },
  { dept: 'Logistics',     Completed: 1, Pending: 1, Rejected: 0, Cancelled: 0 },
  { dept: 'HR & Admin',    Completed: 2, Pending: 0, Rejected: 0, Cancelled: 0 },
  { dept: 'Procurement',   Completed: 1, Pending: 0, Rejected: 1, Cancelled: 0 },
]

const ALERTS = [
  { severity: 'High',     time: '10 min ago', desc: 'PO-2025-012 pending CFO approval — $148K threshold exceeded' },
  { severity: 'High',     time: '35 min ago', desc: 'TCS Global delivery delayed by 5 days on PO-2025-002' },
  { severity: 'Medium',   time: '2 hr ago',   desc: 'PO-2025-008 purchase amount near department budget limit' },
  { severity: 'Low',      time: '4 hr ago',   desc: 'ERP sync failed for PO-2025-003 — retry scheduled' },
]

const RECOMMENDATIONS = [
  { icon: '✅', title: 'Approve PO-2025-002',          desc: 'TCS Global IT Hardware — all compliance checks passed.' },
  { icon: '⬆️', title: 'Escalate PO-2025-012',         desc: '$148K exceeds standard limit. Escalate to Board approval.' },
  { icon: '🔄', title: 'Select Alternate for HCL',     desc: 'PO-2025-004 rejected. Recommend Persistent Systems instead.' },
  { icon: '🚨', title: 'Generate Emergency PO',         desc: 'Cloud & Infra license expiry in 7 days. Raise emergency PO.' },
]

const TIMELINE = [
  { time: '11:20 AM', event: 'PO-2025-009 approved by Dir – Amit Sharma',          type: 'ok'   },
  { time: '10:55 AM', event: 'PO-2025-012 escalated to CFO for approval',          type: 'warn' },
  { time: '10:30 AM', event: 'PO-2025-004 rejected — vendor compliance failure',   type: 'err'  },
  { time: '09:48 AM', event: 'ERP sync completed for PO-2025-007',                 type: 'ok'   },
  { time: '09:10 AM', event: 'PO-2025-006 created and sent for approval',          type: 'ok'   },
]

const fmt      = (n) => '$' + n.toLocaleString()
const PAGE_SIZE = 6
const STATUS_COLORS = { Pending: 'badgeYellow', Approved: 'badgeBlue', Rejected: 'badgeRed', Completed: 'badgeGreen' }
const SEV_COLORS    = { High: 'badgeOrange', Medium: 'badgeYellow', Low: 'badgeBlue', Critical: 'badgeRed' }

const total     = PO_DETAILS.length
const pending   = PO_DETAILS.filter(p => p.status === 'Pending').length
const completed = PO_DETAILS.filter(p => p.status === 'Completed').length
const approved  = PO_DETAILS.filter(p => p.status === 'Approved').length
const successRate = Math.round(((completed + approved) / total) * 100)

export default function ProcurementDashboard({ onClose }) {
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('All')
  const [page, setPage]             = useState(1)
  const [approvalState, setApproval] = useState({})
  const [activeStep]                = useState(3) // steps 0-2 completed

  const filtered = useMemo(() => PO_DETAILS.filter(p => {
    const q = search.toLowerCase()
    const matchQ = p.po.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q)
    return matchQ && (filter === 'All' || p.status === filter)
  }), [search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleApproval(po, action) {
    setApproval(prev => ({ ...prev, [po]: action }))
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Navbar */}
        <div className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12l4 4 8-8" stroke="url(#plg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="plg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
              <span>Enterprise AI Hub</span>
            </div>
            <span className={styles.navSep}>›</span>
            <span className={styles.navTitle}>Agent 5 — Procurement & Workflow Execution</span>
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
              { label: 'Purchase Orders',       value: total,         icon: <FiShoppingCart/>, trend: '+3',      color: styles.cardBlue   },
              { label: 'Pending Approvals',     value: pending,       icon: <FiClock/>,        trend: '+2',      color: styles.cardYellow },
              { label: 'Completed Orders',      value: completed,     icon: <FiCheckCircle/>,  trend: '+1',      color: styles.cardGreen  },
              { label: 'Workflow Success Rate', value: successRate+'%',icon: <FiTrendingUp/>,  trend: '+4.2%',   color: styles.cardPurple },
            ].map(c => (
              <div key={c.label} className={`${styles.statCard} ${c.color}`}>
                <div className={styles.statIcon}>{c.icon}</div>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statTrend}>{c.trend}</div>
              </div>
            ))}
          </div>

          {/* Workflow Progress */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Procurement Workflow</div>
            <div className={styles.workflow}>
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step} className={styles.wfGroup}>
                  <div className={`${styles.wfStep} ${i <= activeStep ? styles.wfDone : styles.wfPending}`}>
                    <div className={`${styles.wfDot} ${i <= activeStep ? styles.wfDotDone : styles.wfDotPending}`}>
                      {i <= activeStep ? '✓' : i + 1}
                    </div>
                    <span className={styles.wfLabel}>{step}</span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className={`${styles.wfLine} ${i < activeStep ? styles.wfLineDone : styles.wfLinePending}`}/>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PO Details + Approval Required */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Purchase Order Details</div>
              <div className={styles.poList}>
                {PO_DETAILS.slice(0, 5).map(p => (
                  <div key={p.po} className={styles.poCard}>
                    <div className={styles.poTop}>
                      <span className={styles.poNum}>{p.po}</span>
                      <span className={`${styles.badge} ${styles[STATUS_COLORS[p.status]]}`}>{p.status}</span>
                    </div>
                    <div className={styles.poMeta}>
                      <span>{p.vendor}</span>
                      <span>{p.product}</span>
                      <span>Qty: {p.qty}</span>
                      <span className={styles.poAmt}>{fmt(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Approval Required</div>
              <div className={styles.approvalList}>
                {APPROVALS.map(a => {
                  const state = approvalState[a.po]
                  return (
                    <div key={a.po} className={styles.approvalCard}>
                      <div className={styles.approvalTop}>
                        <span className={styles.approvalPo}>{a.po}</span>
                        <span className={styles.approvalAmt}>{fmt(a.amount)}</span>
                      </div>
                      <div className={styles.approvalVendor}>{a.vendor} · {a.dept}</div>
                      <div className={styles.approvalApprover}>👤 {a.approver}</div>
                      {state ? (
                        <span className={`${styles.badge} ${state === 'approved' ? styles.badgeGreen : styles.badgeRed}`}>
                          {state === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      ) : (
                        <div className={styles.approvalActions}>
                          <button className={styles.btnApprove} onClick={() => handleApproval(a.po, 'approved')}>Approve</button>
                          <button className={styles.btnReject}  onClick={() => handleApproval(a.po, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* PO Table */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Purchase Orders</span>
              <div className={styles.tableControls}>
                <div className={styles.searchBox}>
                  <FiSearch size={13}/>
                  <input placeholder="Search PO, vendor, dept…" value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className={styles.filterSelect}>
                  <option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option><option>Completed</option>
                </select>
              </div>
            </div>
            <table className={styles.table}>
              <thead>
                <tr><th>PO Number</th><th>Vendor</th><th>Department</th><th>Amount</th><th>Status</th><th>Created</th></tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.po}>
                    <td className={styles.mono}>{p.po}</td>
                    <td className={styles.vendorName}>{p.vendor}</td>
                    <td>{p.dept}</td>
                    <td className={styles.amount}>{fmt(p.amount)}</td>
                    <td><span className={`${styles.badge} ${styles[STATUS_COLORS[p.status]]}`}>{p.status}</span></td>
                    <td>{p.date}</td>
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

          {/* Bar Chart + Alerts */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Workflow Analytics by Department</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={BAR_DATA} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                  <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#6b7280' }}/>
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false}/>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }}/>
                  <Bar dataKey="Completed" fill="#22c55e" radius={[3,3,0,0]}/>
                  <Bar dataKey="Pending"   fill="#f59e0b" radius={[3,3,0,0]}/>
                  <Bar dataKey="Rejected"  fill="#ef4444" radius={[3,3,0,0]}/>
                  <Bar dataKey="Cancelled" fill="#6b7280" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Procurement Alerts</div>
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
          </div>

          {/* Recommendations + Timeline */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>AI Recommendations</div>
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
              <div className={styles.sectionTitle}>Recent Procurement Timeline</div>
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
