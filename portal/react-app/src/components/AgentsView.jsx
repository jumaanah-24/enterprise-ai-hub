import { useState } from 'react'
import AgentCard from './AgentCard'
import SupplyChainDashboard from './SupplyChainDashboard'
import BudgetDashboard from './BudgetDashboard'
import VendorDashboard from './VendorDashboard'
import RiskDashboard from './RiskDashboard'
import ProcurementDashboard from './ProcurementDashboard'
import BriefingDashboard from './BriefingDashboard'
import styles from './AgentsView.module.css'

const AGENT_KEYS = ['supply','budget','vendor','risk','procurement','briefing']

export default function AgentsView({ cards, customAgents, showToast, addIncident, addActivity, appendLog, updateMetric, updateCard }) {
  const [activeInfo, setActiveInfo] = useState(null)
  async function handleHealthCheck(agent) {
    const endpoints = {
      supply: 'http://localhost:8000/health',
      budget: 'http://localhost:8001/health',
      vendor: 'http://localhost:8002/health',
    }
    const name = agent.charAt(0).toUpperCase() + agent.slice(1)
    showToast(`Checking ${name}...`, 'info')
    try {
      const resp = await fetch(endpoints[agent] || 'http://localhost:8003/health')
      const result = await resp.json()
      showToast(`✅ ${name} is online`, 'success')
      appendLog(`✓ ${name}: ${JSON.stringify(result)}`, 'ok')
      updateMetric(agent)
      updateCard(agent, { lastRun: new Date().toLocaleTimeString() })
      addActivity(`${name} health check`, 'Agent is online and responding')
    } catch (err) {
      showToast(`❌ ${name} is offline`, 'error')
      addIncident('error', `${name} Agent`, `Offline: ${err.message}`)
    }
  }

  return (
    <div>
      <div className={styles.title}>All Agents <span className={styles.count}>{6 + customAgents.length}</span></div>
      <div className={styles.grid}>
        {AGENT_KEYS.map(key => (
          <AgentCard key={key} agentKey={key} cardData={cards[key]}
            onHealthCheck={handleHealthCheck}
            onInfo={(key) => ['supply','budget','vendor','risk','procurement','briefing'].includes(key) ? setActiveInfo(key) : showToast(`${key} runs autonomously via pipeline`, 'info')} />
        ))}
        {customAgents.map(a => (
          <div key={a.id} className={styles.customCard}>
            <div className={styles.customHeader}>
              <div className={styles.avatar}>🤖</div>
              <div>
                <div className={styles.name}>{a.name}</div>
                <div className={styles.role}>{a.role}</div>
              </div>
            </div>
            <p className={styles.goal}>{a.goal}</p>
          </div>
        ))}
      </div>
      {activeInfo === 'supply'  && <SupplyChainDashboard onClose={() => setActiveInfo(null)} />}
      {activeInfo === 'budget'  && <BudgetDashboard      onClose={() => setActiveInfo(null)} />}
      {activeInfo === 'vendor'  && <VendorDashboard      onClose={() => setActiveInfo(null)} />}
      {activeInfo === 'risk'         && <RiskDashboard         onClose={() => setActiveInfo(null)} />}
      {activeInfo === 'procurement'  && <ProcurementDashboard  onClose={() => setActiveInfo(null)} />}
      {activeInfo === 'briefing'     && <BriefingDashboard     onClose={() => setActiveInfo(null)} />}
    </div>
  )
}
