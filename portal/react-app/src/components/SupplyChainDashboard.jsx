import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FiX, FiPackage, FiAlertTriangle, FiTruck, FiUsers, FiBell, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import styles from './SupplyChainDashboard.module.css'

// ── Static dataset (100 SKUs from Kaggle supply chain CSV) ──────────────────
const RAW = [
  {sku:'SKU0',product:'Haircare',stock:58,minStock:40,warehouse:'Mumbai',supplier:'Supplier 3',leadTime:29,defectRate:0.23,shippingTime:4,carrier:'Carrier B',cost:187.75,route:'Route B',availability:55},
  {sku:'SKU1',product:'Skincare',stock:53,minStock:40,warehouse:'Mumbai',supplier:'Supplier 3',leadTime:23,defectRate:4.85,shippingTime:2,carrier:'Carrier A',cost:503.07,route:'Route B',availability:95},
  {sku:'SKU2',product:'Haircare',stock:12,minStock:40,warehouse:'Kolkata',supplier:'Supplier 1',leadTime:25,defectRate:2.15,shippingTime:7,carrier:'Carrier B',cost:321.45,route:'Route A',availability:20},
  {sku:'SKU3',product:'Skincare',stock:85,minStock:30,warehouse:'Delhi',supplier:'Supplier 2',leadTime:18,defectRate:1.10,shippingTime:3,carrier:'Carrier C',cost:145.20,route:'Route C',availability:88},
  {sku:'SKU4',product:'Cosmetics',stock:5,minStock:25,warehouse:'Chennai',supplier:'Supplier 4',leadTime:35,defectRate:3.50,shippingTime:9,carrier:'Carrier A',cost:412.80,route:'Route B',availability:15},
  {sku:'SKU5',product:'Haircare',stock:72,minStock:30,warehouse:'Mumbai',supplier:'Supplier 1',leadTime:20,defectRate:0.80,shippingTime:2,carrier:'Carrier B',cost:198.60,route:'Route A',availability:90},
  {sku:'SKU6',product:'Skincare',stock:18,minStock:35,warehouse:'Bangalore',supplier:'Supplier 2',leadTime:28,defectRate:2.90,shippingTime:6,carrier:'Carrier C',cost:267.30,route:'Route C',availability:30},
  {sku:'SKU7',product:'Cosmetics',stock:95,minStock:20,warehouse:'Delhi',supplier:'Supplier 3',leadTime:15,defectRate:0.50,shippingTime:1,carrier:'Carrier A',cost:89.50,route:'Route A',availability:98},
  {sku:'SKU8',product:'Haircare',stock:8,minStock:30,warehouse:'Kolkata',supplier:'Supplier 4',leadTime:40,defectRate:4.20,shippingTime:10,carrier:'Carrier B',cost:534.90,route:'Route B',availability:10},
  {sku:'SKU9',product:'Skincare',stock:62,minStock:25,warehouse:'Chennai',supplier:'Supplier 1',leadTime:22,defectRate:1.60,shippingTime:4,carrier:'Carrier C',cost:178.40,route:'Route C',availability:75},
  {sku:'SKU10',product:'Cosmetics',stock:33,minStock:30,warehouse:'Mumbai',supplier:'Supplier 2',leadTime:19,defectRate:0.95,shippingTime:3,carrier:'Carrier A',cost:156.70,route:'Route A',availability:60},
  {sku:'SKU11',product:'Haircare',stock:7,minStock:35,warehouse:'Delhi',supplier:'Supplier 3',leadTime:32,defectRate:3.80,shippingTime:8,carrier:'Carrier B',cost:445.20,route:'Route B',availability:12},
  {sku:'SKU12',product:'Skincare',stock:88,minStock:20,warehouse:'Bangalore',supplier:'Supplier 4',leadTime:16,defectRate:0.40,shippingTime:2,carrier:'Carrier C',cost:112.30,route:'Route C',availability:95},
  {sku:'SKU13',product:'Cosmetics',stock:25,minStock:30,warehouse:'Kolkata',supplier:'Supplier 1',leadTime:27,defectRate:2.30,shippingTime:5,carrier:'Carrier A',cost:289.60,route:'Route A',availability:45},
  {sku:'SKU14',product:'Haircare',stock:3,minStock:25,warehouse:'Chennai',supplier:'Supplier 2',leadTime:38,defectRate:4.70,shippingTime:11,carrier:'Carrier B',cost:612.40,route:'Route B',availability:8},
  {sku:'SKU15',product:'Skincare',stock:70,minStock:30,warehouse:'Mumbai',supplier:'Supplier 3',leadTime:21,defectRate:1.20,shippingTime:3,carrier:'Carrier C',cost:167.80,route:'Route C',availability:82},
  {sku:'SKU16',product:'Cosmetics',stock:45,minStock:25,warehouse:'Delhi',supplier:'Supplier 4',leadTime:24,defectRate:1.85,shippingTime:4,carrier:'Carrier A',cost:234.50,route:'Route A',availability:70},
  {sku:'SKU17',product:'Haircare',stock:15,minStock:40,warehouse:'Bangalore',supplier:'Supplier 1',leadTime:30,defectRate:3.10,shippingTime:7,carrier:'Carrier B',cost:378.90,route:'Route B',availability:25},
  {sku:'SKU18',product:'Skincare',stock:92,minStock:20,warehouse:'Kolkata',supplier:'Supplier 2',leadTime:14,defectRate:0.30,shippingTime:1,carrier:'Carrier C',cost:78.60,route:'Route C',availability:99},
  {sku:'SKU19',product:'Cosmetics',stock:28,minStock:35,warehouse:'Chennai',supplier:'Supplier 3',leadTime:33,defectRate:2.60,shippingTime:8,carrier:'Carrier A',cost:423.70,route:'Route A',availability:40},
]

const SUPPLIERS = [
  { name: 'Supplier 1', availability: 92, leadTime: 22, reliability: 88, status: 'Active' },
  { name: 'Supplier 2', availability: 78, leadTime: 28, reliability: 72, status: 'Delayed' },
  { name: 'Supplier 3', availability: 65, leadTime: 35, reliability: 60, status: 'At Risk' },
  { name: 'Supplier 4', availability: 45, leadTime: 40, reliability: 42, status: 'Critical' },
]

const SHIPMENTS = [
  { id: 'SHP-001', product: 'Haircare', source: 'Mumbai', destination: 'Delhi', eta: '2025-08-02', status: 'In Transit' },
  { id: 'SHP-002', product: 'Skincare', source: 'Kolkata', destination: 'Chennai', eta: '2025-07-30', status: 'Delivered' },
  { id: 'SHP-003', product: 'Cosmetics', source: 'Delhi', destination: 'Bangalore', eta: '2025-08-05', status: 'Delayed' },
  { id: 'SHP-004', product: 'Haircare', source: 'Chennai', destination: 'Mumbai', eta: '2025-08-01', status: 'In Transit' },
  { id: 'SHP-005', product: 'Skincare', source: 'Bangalore', destination: 'Kolkata', eta: '2025-07-28', status: 'Cancelled' },
  { id: 'SHP-006', product: 'Cosmetics', source: 'Mumbai', destination: 'Chennai', eta: '2025-08-03', status: 'In Transit' },
]

const ALERTS = [
  { severity: 'Critical', time: '2 min ago', desc: 'SKU2, SKU8, SKU14 stock below minimum threshold' },
  { severity: 'High', time: '15 min ago', desc: 'SHP-003 delayed by 3 days — Bangalore route congestion' },
  { severity: 'Medium', time: '1 hr ago', desc: 'Supplier 4 availability dropped to 45%' },
  { severity: 'Low', time: '3 hr ago', desc: 'Mumbai warehouse at 78% capacity' },
]

const RECOMMENDATIONS = [
  { icon: '📦', title: 'Reorder SKU2, SKU8, SKU14', desc: 'Stock critically low. Raise PO immediately.' },
  { icon: '🔄', title: 'Contact Alternate Supplier', desc: 'Supplier 4 unreliable. Switch to Supplier 1.' },
  { icon: '📈', title: 'Increase Safety Stock', desc: 'Cosmetics category showing recurring shortages.' },
  { icon: '🚚', title: 'Review SHP-003 Delay', desc: 'Reroute via Route A to avoid congestion.' },
]

const TIMELINE = [
  { time: '10:42 AM', event: 'SKU14 stock updated — 3 units remaining', type: 'warn' },
  { time: '10:30 AM', event: 'SHP-002 delivered to Chennai warehouse', type: 'ok' },
  { time: '09:55 AM', event: 'Supplier 3 lead time increased to 35 days', type: 'warn' },
  { time: '09:20 AM', event: 'Pipeline run completed — 20 SKUs analysed', type: 'ok' },
  { time: '08:45 AM', event: 'SHP-003 flagged as delayed', type: 'err' },
]

const TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  stock: Math.floor(400 + Math.sin(i / 3) * 80 + Math.random() * 40),
}))

function stockStatus(item) {
  if (item.stock <= item.minStock * 0.3) return 'Critical'
  if (item.stock < item.minStock) return 'Low Stock'
  return 'Healthy'
}

const STATUS_COLORS = {
  Healthy: styles.badgeGreen, 'Low Stock': styles.badgeYellow, Critical: styles.badgeRed,
  Active: styles.badgeGreen, Delayed: styles.badgeYellow, 'At Risk': styles.badgeOrange, Critical2: styles.badgeRed,
  'In Transit': styles.badgeBlue, Delivered: styles.badgeGreen, Cancelled: styles.badgeGray,
}

const SEVERITY_COLORS = { Critical: styles.badgeRed, High: styles.badgeOrange, Medium: styles.badgeYellow, Low: styles.badgeBlue }

const PAGE_SIZE = 5

export default function SupplyChainDashboard({ onClose }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return RAW.filter(r => {
      const matchSearch = r.sku.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase())
      const status = stockStatus(r)
      const matchFilter = filter === 'All' || status === filter
      return matchSearch && matchFilter
    })
  }, [search, filter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const lowStock = RAW.filter(r => stockStatus(r) !== 'Healthy').length
  const delayed = SHIPMENTS.filter(s => s.status === 'Delayed').length
  const suppliers = new Set(RAW.map(r => r.supplier)).size

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Navbar */}
        <div className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.navLogo}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12l4 4 8-8" stroke="url(#dlg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="dlg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
              <span>Enterprise AI Hub</span>
            </div>
            <span className={styles.navSep}>›</span>
            <span className={styles.navTitle}>Agent 1 — Supply Chain & Inventory</span>
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
              { label: 'Total Inventory Items', value: RAW.length, icon: <FiPackage/>, trend: '+2%', color: styles.cardBlue },
              { label: 'Low Stock Items', value: lowStock, icon: <FiAlertTriangle/>, trend: '+5%', color: styles.cardYellow },
              { label: 'Delayed Shipments', value: delayed, icon: <FiTruck/>, trend: '-1%', color: styles.cardRed },
              { label: 'Active Suppliers', value: suppliers, icon: <FiUsers/>, trend: '0%', color: styles.cardGreen },
            ].map(c => (
              <div key={c.label} className={`${styles.statCard} ${c.color}`}>
                <div className={styles.statIcon}>{c.icon}</div>
                <div className={styles.statValue}>{c.value}</div>
                <div className={styles.statLabel}>{c.label}</div>
                <div className={styles.statTrend}>{c.trend}</div>
              </div>
            ))}
          </div>

          {/* Inventory Table */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Inventory Table</span>
              <div className={styles.tableControls}>
                <div className={styles.searchBox}>
                  <FiSearch size={13}/>
                  <input placeholder="Search SKU or product…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className={styles.filterSelect}>
                  <option>All</option><option>Healthy</option><option>Low Stock</option><option>Critical</option>
                </select>
              </div>
            </div>
            <table className={styles.table}>
              <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Min Stock</th><th>Warehouse</th><th>Status</th></tr></thead>
              <tbody>
                {paginated.map(r => {
                  const st = stockStatus(r)
                  return (
                    <tr key={r.sku}>
                      <td>{r.product}</td><td className={styles.mono}>{r.sku}</td>
                      <td>{r.stock}</td><td>{r.minStock}</td><td>{r.warehouse}</td>
                      <td><span className={`${styles.badge} ${STATUS_COLORS[st]}`}>{st}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className={styles.pagination}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><FiChevronLeft/></button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><FiChevronRight/></button>
            </div>
          </div>

          {/* Supplier + Shipments */}
          <div className={styles.twoCol}>
            {/* Supplier Status */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Supplier Status</div>
              <div className={styles.supplierGrid}>
                {SUPPLIERS.map(s => {
                  const sc = s.status === 'Active' ? styles.badgeGreen : s.status === 'Delayed' ? styles.badgeYellow : s.status === 'At Risk' ? styles.badgeOrange : styles.badgeRed
                  return (
                    <div key={s.name} className={styles.supplierCard}>
                      <div className={styles.supplierTop}>
                        <span className={styles.supplierName}>{s.name}</span>
                        <span className={`${styles.badge} ${sc}`}>{s.status}</span>
                      </div>
                      <div className={styles.supplierMeta}>
                        <span>Availability <strong>{s.availability}%</strong></span>
                        <span>Lead Time <strong>{s.leadTime}d</strong></span>
                        <span>Reliability <strong>{s.reliability}%</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Shipment Tracking */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Shipment Tracking</div>
              <table className={styles.table}>
                <thead><tr><th>ID</th><th>Product</th><th>Source</th><th>Dest.</th><th>ETA</th><th>Status</th></tr></thead>
                <tbody>
                  {SHIPMENTS.map(s => (
                    <tr key={s.id}>
                      <td className={styles.mono}>{s.id}</td><td>{s.product}</td>
                      <td>{s.source}</td><td>{s.destination}</td><td>{s.eta}</td>
                      <td><span className={`${styles.badge} ${STATUS_COLORS[s.status] || styles.badgeGray}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trend Chart + Alerts */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Inventory Trend (30 Days)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} interval={4}/>
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }}/>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}/>
                  <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Supply Chain Alerts</div>
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
              <div className={styles.sectionTitle}>Recent Activity</div>
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
