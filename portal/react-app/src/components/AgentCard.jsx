import styles from './AgentCard.module.css'

const AGENT_CONFIG = {
  supply:      { emoji: '📦', name: 'Inventory & Logistics Assistant', type: 'Online', port: 8000 },
  budget:      { emoji: '💰', name: 'Spend & Budget Assistant',        type: 'Online', port: 8001 },
  vendor:      { emoji: '📋', name: 'Vendor & Contract Assistant',     type: 'Online', port: 8002 },
  risk:        { emoji: '⚠️', name: 'Risk & Forecasting Assistant',    type: 'Autonomous', port: null },
  procurement: { emoji: '🛒', name: 'Procurement & Workflow Assistant',type: 'Autonomous', port: null },
  briefing:    { emoji: '📊', name: 'Executive Briefing Assistant',    type: 'Autonomous', port: null },
}

const CARD_METRICS = {
  supply:      (c) => [['Stock view', c.inventory], ['Open orders', c.orders], ['Coverage', c.stock], ['Risk signal', c.alerts]],
  budget:      (c) => [['Spend used', c.budgetUsed], ['Recommendation', c.forecast], ['Gap', c.variance], ['Remaining', c.savings]],
  vendor:      (c) => [['Partner', c.vendors], ['Contract status', c.contracts], ['Compliance', c.compliance], ['Expires soon', c.expiring]],
  risk:        (c) => [['Overall risk', c.riskLevel], ['Risk score', c.riskScore], ['Best backup', c.supplier], ['Expected delay', c.delay]],
  procurement: (c) => [['Latest PO', c.po], ['Approval', c.approval], ['ERP update', c.erp], ['Execution', c.status]],
  briefing:    (c) => [['Latest report', c.report], ['Dashboard', c.dashboard], ['Slack', c.slack], ['WhatsApp', c.wa]],
}

export default function AgentCard({ agentKey, cardData, onHealthCheck, onInfo }) {
  const cfg = AGENT_CONFIG[agentKey]
  const metrics = CARD_METRICS[agentKey](cardData)

  return (
    <div className={`${styles.card} ${styles[agentKey]}`}>
      <div className={styles.topBar} />
      <div className={styles.header}>
        <div className={`${styles.avatar} ${styles[`avatar_${agentKey}`]}`}>{cfg.emoji}</div>
        <div>
          <div className={styles.name}>{cfg.name}</div>
          <div className={styles.status}>
            <span className={styles.dot} /> {cfg.type} · {cardData.lastRun}
          </div>
        </div>
      </div>
      <div className={styles.body}>
        {metrics.map(([label, value]) => (
          <div key={label} className={styles.metric}>
            <div className={styles.mLabel}>{label}</div>
            <div className={styles.mValue}>{value}</div>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        {cfg.port
          ? <>
              <button className={styles.btnSecondary} onClick={() => window.open(`http://localhost:${cfg.port}`, '_blank')}>Open Chat</button>
              <button className={styles.btnPrimary} onClick={() => onHealthCheck(agentKey)}>Health Check</button>
            </>
          : <button className={styles.btnSecondary} onClick={() => onInfo(cfg.name)}>Info</button>
        }
      </div>
    </div>
  )
}
