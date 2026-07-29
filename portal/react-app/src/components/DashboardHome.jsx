import AgentCard from './AgentCard'
import styles from './DashboardHome.module.css'

const AGENT_KEYS = ['supply','budget','vendor','risk','procurement','briefing']
const STEP_LABELS = ['Supply Chain','Budget','Vendor','Risk','Procurement','Briefing']

const ENDPOINTS = {
  supply: 'http://localhost:8000/health',
  budget: 'http://localhost:8001/health',
  vendor: 'http://localhost:8002/health',
  orchestrator: 'http://localhost:8003/health',
}

export default function DashboardHome({
  incidents, activities, pipelineRunning, pipelineRuns,
  pipelineSteps, pipelineStatus, consoleLogs, metrics, cards, customAgents,
  addIncident, addActivity, appendLog, updateMetric, updateCard,
  showToast, onRunPipeline,
}) {
  async function handleHealthCheck(agent) {
    const name = agent.charAt(0).toUpperCase() + agent.slice(1)
    showToast(`Checking ${name}...`, 'info')
    appendLog(`Health check: ${name}...`, 'info')
    try {
      const resp = await fetch(ENDPOINTS[agent] || ENDPOINTS.orchestrator)
      const result = await resp.json()
      showToast(`✅ ${name} is online`, 'success')
      appendLog(`✓ ${name}: ${JSON.stringify(result)}`, 'ok')
      updateMetric(agent)
      updateCard(agent, { lastRun: new Date().toLocaleTimeString() })
      addActivity(`${name} health check`, 'Agent is online and responding')
    } catch (err) {
      showToast(`❌ ${name} is offline`, 'error')
      appendLog(`✕ ${name} unreachable: ${err.message}`, 'err')
      addIncident('error', `${name} Agent`, `Offline: ${err.message}`)
    }
  }

  function handleInfo(name) {
    showToast(`${name} runs autonomously via pipeline`, 'info')
  }

  return (
    <div>
      {/* Top Bar */}
      <div className={styles.topbar}>
        <h1><span className={styles.grad}>Enterprise</span> AI Control Center</h1>
        <div className={styles.actions}>
          {pipelineRunning && <div className={styles.badge}>
            <span className={`${styles.dot} ${styles.yellow}`} />
            <span>Pipeline Active</span>
          </div>}
          <button className={styles.btnRun} onClick={onRunPipeline} disabled={pipelineRunning}>
            {pipelineRunning ? <><span className={styles.spinner} /> Running...</> : '▶ Run Pipeline'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>Friendly AI operations workspace</div>
          <h2>Your digital team helps the business stay calm, informed, and ready.</h2>
          <p>This control center turns complex agent activity into simple, clear updates so anyone can understand what is happening and why.</p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={onRunPipeline}>Run a workflow</button>
          </div>
          <div className={styles.chips}>
            {['Supply chain insight','Budget monitoring','Vendor support','Executive summaries'].map(c => (
              <span key={c} className={styles.chip}>{c}</span>
            ))}
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.robotCard}>
            <span className={styles.robotTag}>AI Guide</span>
            <img src="/robot.png" alt="Enterprise AI robot" className={styles.robotImg} />
            <div className={styles.robotGlow} />
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        {[
          { label: 'Total Incidents', value: incidents.length, change: '▲ 0%', up: true },
          { label: 'Active Agents', value: 6 + customAgents.length, change: '▲ All Online', up: true },
          { label: 'Pipeline Runs', value: pipelineRuns, change: `▲ ${pipelineRuns}`, up: true },
          { label: 'Uptime', value: '99.9%', change: '▲ Stable', up: true },
        ].map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValue}>{k.value}</div>
            <div className={`${styles.kpiChange} ${k.up ? styles.up : styles.down}`}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* Agent Cards */}
      <div className={styles.sectionTitle}>
        Your AI Team <span className={styles.count}>{6 + customAgents.length}</span>
      </div>
      <div className={styles.agentGrid}>
        {AGENT_KEYS.map(key => (
          <AgentCard key={key} agentKey={key} cardData={cards[key]}
            onHealthCheck={handleHealthCheck} onInfo={handleInfo} />
        ))}
        {customAgents.map(a => (
          <div key={a.id} className={styles.customCard}>
            <div className={styles.customHeader}>
              <div className={styles.customAvatar}>🤖</div>
              <div>
                <div className={styles.customName}>{a.name}</div>
                <div className={styles.customRole}>{a.role}</div>
              </div>
            </div>
            <div className={styles.customGoal}>{a.goal}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className={styles.sectionTitle}>What is happening right now</div>
      <div className={styles.dashGrid}>
        {/* Incident Feed */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Live updates</span>
            <span className={styles.panelBadge}>{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</span>
          </div>
          <FeedList items={incidents} empty="No incidents · All clear" />
        </div>

        {/* Pipeline Status */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Workstream flow</span>
            <span className={styles.panelBadge}>{pipelineStatus}</span>
          </div>
          <div className={styles.pipeline}>
            {STEP_LABELS.map((label, i) => (
              <span key={label} className={styles.pipelineGroup}>
                <span className={styles.step}>
                  <span className={`${styles.stepDot} ${styles[pipelineSteps[i]]}`} />
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && <span className={styles.arrow}>→</span>}
              </span>
            ))}
          </div>
          <div className={styles.console}>
            {consoleLogs.map((l, i) => (
              <div key={i} className={styles.clLine}>
                <span className={styles.clTime}>[{l.time}]</span>{' '}
                <span className={styles[`cl_${l.level}`]}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Table */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>How each assistant is performing</span>
            <span className={styles.panelBadge}>Last 24h</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Agent</th><th>Tasks</th><th>Success</th><th>Avg Time</th><th>Load</th></tr>
            </thead>
            <tbody>
              {[
                ['supply','Supply Chain'],['budget','Budget & Finance'],['vendor','Vendor & Contract'],
                ['risk','Risk & Forecast'],['procurement','Procurement'],['briefing','Exec. Briefing'],
              ].map(([key, label]) => {
                const m = metrics[key]
                const successRate = m.tasks > 0 ? Math.round((m.success / m.tasks) * 100) + '%' : '—'
                const barClass = m.load > 80 ? styles.bad : m.load > 50 ? styles.warn : styles.good
                return (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>{m.tasks}</td>
                    <td>{successRate}</td>
                    <td>{m.time ? m.time + 'ms' : '—'}</td>
                    <td><div className={styles.bar}><div className={`${styles.fill} ${barClass}`} style={{ width: m.load + '%' }} /></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Activity</span>
            <span className={styles.panelBadge}>{activities.length} event{activities.length !== 1 ? 's' : ''}</span>
          </div>
          <FeedList items={activities} empty="No activity yet" />
        </div>
      </div>
    </div>
  )
}

function FeedList({ items, empty }) {
  const icons = { error: '✕', warn: '⚠', info: 'ℹ', success: '✓' }
  if (!items.length) return (
    <ul className={styles.feed}>
      <li><div className={`${styles.iIcon} ${styles.info}`}>ℹ</div>
        <div className={styles.iText}><strong>{empty}</strong></div>
        <span className={styles.iTime}>—</span></li>
    </ul>
  )
  return (
    <ul className={styles.feed}>
      {items.map((item, i) => (
        <li key={i}>
          <div className={`${styles.iIcon} ${styles[item.type || 'info']}`}>{icons[item.type] || 'ℹ'}</div>
          <div className={styles.iText}>
            <strong>{item.title}</strong>
            {item.detail && <div className={styles.iDetail}>{item.detail}</div>}
          </div>
          <span className={styles.iTime}>{item.time}</span>
        </li>
      ))}
    </ul>
  )
}
